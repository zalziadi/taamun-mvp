import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/queue-digests
 *
 * Runs every Saturday (Arabic week start) and queues two types of emails:
 *
 * 1. Weekly digest — for all active subscribers (reflection count + streak + insight)
 * 2. Re-engagement — for users inactive 3+ days (gentle "we miss you")
 *
 * The actual sending happens in /api/cron/send-emails (runs 6 AM daily).
 * This cron just INSERTS into email_queue — separation of concerns.
 *
 * Protected via Vercel Cron secret header (CRON_SECRET env var).
 */
export async function GET(req: Request) {
  // Verify this is called by Vercel Cron or authorized
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const results = {
    weekly_digests_queued: 0,
    reengagement_queued: 0,
    errors: [] as string[],
  };

  const now = new Date().toISOString();
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();

  // ── 1. Weekly digests for active subscribers ──
  try {
    const { data: activeSubscribers } = await admin
      .from("profiles")
      .select("id, full_name, email:id")
      .eq("subscription_status", "active")
      .gt("expires_at", now)
      .limit(1000);

    if (activeSubscribers) {
      for (const sub of activeSubscribers) {
        // Skip if digest already queued this week (idempotent)
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: existing } = await admin
          .from("email_queue")
          .select("id")
          .eq("user_id", sub.id)
          .eq("template", "weekly_digest")
          .gte("created_at", sevenDaysAgo)
          .limit(1)
          .maybeSingle();

        if (existing) continue;

        // Get user email via auth.users
        const { data: userAuth } = await admin.auth.admin.getUserById(sub.id);
        const email = userAuth.user?.email;
        if (!email) continue;

        // Count this week's reflections + awareness logs
        const { count: reflectionCount } = await admin
          .from("reflections")
          .select("*", { count: "exact", head: true })
          .eq("user_id", sub.id)
          .gte("created_at", sevenDaysAgo);

        const { count: awarenessCount } = await admin
          .from("awareness_logs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", sub.id)
          .gte("created_at", sevenDaysAgo);

        await admin.from("email_queue").insert({
          user_id: sub.id,
          email,
          template: "weekly_digest",
          payload: {
            userName: sub.full_name ?? email.split("@")[0],
            reflectionCount: reflectionCount ?? 0,
            awarenessCount: awarenessCount ?? 0,
          },
          status: "pending",
          send_after: now,
        });

        results.weekly_digests_queued++;
      }
    }
  } catch (err) {
    results.errors.push(`weekly_digest: ${(err as Error).message}`);
  }

  // ── 2. Re-engagement for inactive users ──
  try {
    // Find users who haven't reflected in 3+ days but subscription is active
    const { data: dormantUsers } = await admin
      .from("profiles")
      .select("id, full_name")
      .eq("subscription_status", "active")
      .gt("expires_at", now)
      .limit(500);

    if (dormantUsers) {
      for (const user of dormantUsers) {
        // Check last reflection
        const { data: lastReflection } = await admin
          .from("reflections")
          .select("created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!lastReflection) continue; // Never reflected — skip (not dormant)
        if (lastReflection.created_at > threeDaysAgo) continue; // Active

        // Skip if re-engagement already queued this week
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: existing } = await admin
          .from("email_queue")
          .select("id")
          .eq("user_id", user.id)
          .eq("template", "reengagement")
          .gte("created_at", sevenDaysAgo)
          .limit(1)
          .maybeSingle();

        if (existing) continue;

        const { data: userAuth } = await admin.auth.admin.getUserById(user.id);
        const email = userAuth.user?.email;
        if (!email) continue;

        await admin.from("email_queue").insert({
          user_id: user.id,
          email,
          template: "reengagement",
          payload: {
            userName: user.full_name ?? email.split("@")[0],
            daysSinceLastReflection: Math.floor(
              (Date.now() - new Date(lastReflection.created_at).getTime()) / 86400000
            ),
          },
          status: "pending",
          send_after: now,
        });

        results.reengagement_queued++;
      }
    }
  } catch (err) {
    results.errors.push(`reengagement: ${(err as Error).message}`);
  }

  return NextResponse.json({ ok: results.errors.length === 0, ...results });
}
