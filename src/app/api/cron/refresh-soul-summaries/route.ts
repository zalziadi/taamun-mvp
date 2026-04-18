import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  generateSoulSummary,
  isSoulMilestone,
} from "@/lib/soul-summary-generator";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // can be long — iterates users

/**
 * GET /api/cron/refresh-soul-summaries
 *
 * Runs Sunday 3 AM UTC (6 AM KSA) weekly.
 * For each active subscriber with ≥3 reflections:
 *   - If last updated > 7 days ago → refresh
 *   - If today is a milestone day for the user (14/28/60) → refresh with deeper pass
 *   - Otherwise → skip
 *
 * Shares the Claude API. Cost is bounded (~$0.002/user/week for active users).
 *
 * Protected by CRON_SECRET.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const now = new Date();
  const sevenDaysAgoIso = new Date(now.getTime() - 7 * 86400000).toISOString();

  // Find candidates: active subscribers with reflections
  const { data: candidates } = await admin
    .from("profiles")
    .select("id, full_name, subscription_status, expires_at")
    .eq("subscription_status", "active")
    .gt("expires_at", now.toISOString())
    .limit(500);

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, updated: 0 });
  }

  const results = {
    processed: 0,
    updated: 0,
    skipped_recent: 0,
    skipped_insufficient: 0,
    failed: [] as { user_id: string; reason: string }[],
    total_tokens: 0,
  };

  for (const user of candidates) {
    results.processed++;

    // Get current memory row (if any)
    const { data: memory } = await admin
      .from("guide_memory")
      .select("soul_summary, soul_summary_updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    // Get user's current day
    const { data: progress } = await admin
      .from("progress")
      .select("current_day, completed_days")
      .eq("user_id", user.id)
      .maybeSingle();

    const currentDay = progress?.current_day ?? 0;
    const completedDaysCount = Array.isArray(progress?.completed_days)
      ? progress.completed_days.length
      : 0;

    // Decide if refresh needed
    const lastUpdated = memory?.soul_summary_updated_at;
    const isMilestone = isSoulMilestone(currentDay);
    const isStale = !lastUpdated || lastUpdated < sevenDaysAgoIso;

    if (!isStale && !isMilestone) {
      results.skipped_recent++;
      continue;
    }

    // Fetch reflections + awareness
    const { data: reflections } = await admin
      .from("reflections")
      .select("day, note, emotion, awareness_state, created_at")
      .eq("user_id", user.id)
      .order("day", { ascending: false })
      .limit(30);

    if (!reflections || reflections.length < 3) {
      results.skipped_insufficient++;
      continue;
    }

    const { data: awareness } = await admin
      .from("awareness_logs")
      .select("day, level")
      .eq("user_id", user.id)
      .order("day", { ascending: false })
      .limit(14);

    // Generate via Claude
    const result = await generateSoulSummary({
      userName: user.full_name ?? null,
      currentDay,
      completedDaysCount,
      reflections,
      awareness: awareness ?? [],
      existingSummary: memory?.soul_summary ?? null,
    });

    if (!result) {
      results.failed.push({ user_id: user.id, reason: "generation_failed" });
      continue;
    }

    // Upsert into guide_memory
    const { error } = await admin.from("guide_memory").upsert(
      {
        user_id: user.id,
        soul_summary: result.summary,
        themes: result.themes,
        soul_summary_updated_at: now.toISOString(),
        soul_summary_token_count: result.tokenCount ?? 0,
      },
      { onConflict: "user_id" }
    );

    if (error) {
      results.failed.push({ user_id: user.id, reason: `db: ${error.message}` });
      continue;
    }

    results.updated++;
    results.total_tokens += result.tokenCount ?? 0;
  }

  return NextResponse.json({ ok: true, ...results });
}
