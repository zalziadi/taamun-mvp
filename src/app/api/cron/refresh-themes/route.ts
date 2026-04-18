import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  clusterReflections,
  type ReflectionItem,
} from "@/lib/reflection-clustering";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GET /api/cron/refresh-themes
 *
 * Runs monthly (1st of the month, 4 AM UTC / 7 AM KSA).
 * For each active subscriber with ≥5 reflections:
 *   - Embeds reflections via OpenAI
 *   - Clusters by cosine similarity
 *   - Labels top clusters via Claude
 *   - Stores in reflection_themes (replaces prior themes)
 *
 * Skip if themes already refreshed within 25 days.
 * Cost: ~$0.008 per user per month.
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
  const twentyFiveDaysAgoIso = new Date(now.getTime() - 25 * 86400000).toISOString();

  const { data: candidates } = await admin
    .from("profiles")
    .select("id, subscription_status, expires_at")
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
    skipped_no_api: 0,
    failed: [] as { user_id: string; reason: string }[],
  };

  for (const user of candidates) {
    results.processed++;

    // Skip if themes refreshed recently
    const { data: existingTheme } = await admin
      .from("reflection_themes")
      .select("generated_at")
      .eq("user_id", user.id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      existingTheme?.generated_at &&
      existingTheme.generated_at > twentyFiveDaysAgoIso
    ) {
      results.skipped_recent++;
      continue;
    }

    // Fetch reflections (need at least 5 to cluster meaningfully)
    const { data: reflections } = await admin
      .from("reflections")
      .select("id, day, note")
      .eq("user_id", user.id)
      .not("note", "is", null)
      .order("day", { ascending: false })
      .limit(60);

    if (!reflections || reflections.length < 5) {
      results.skipped_insufficient++;
      continue;
    }

    const items: ReflectionItem[] = reflections
      .filter((r) => r.note && r.note.trim().length > 20)
      .map((r) => ({
        id: r.id as string,
        day: r.day as number,
        text: r.note as string,
      }));

    if (items.length < 5) {
      results.skipped_insufficient++;
      continue;
    }

    const themes = await clusterReflections(items, { maxThemes: 3 });

    if (themes.length === 0) {
      results.skipped_no_api++;
      continue;
    }

    // Replace prior themes (atomic: delete + insert)
    const { error: delErr } = await admin
      .from("reflection_themes")
      .delete()
      .eq("user_id", user.id);

    if (delErr) {
      results.failed.push({ user_id: user.id, reason: `delete: ${delErr.message}` });
      continue;
    }

    const rows = themes.map((t, idx) => ({
      user_id: user.id,
      label: t.label,
      keywords: t.keywords,
      reflection_ids: t.reflection_ids,
      reflection_count: t.reflection_count,
      sample_texts: t.sample_texts,
      rank: idx + 1,
    }));

    const { error: insErr } = await admin.from("reflection_themes").insert(rows);
    if (insErr) {
      results.failed.push({ user_id: user.id, reason: `insert: ${insErr.message}` });
      continue;
    }

    results.updated++;
  }

  return NextResponse.json({ ok: true, ...results });
}
