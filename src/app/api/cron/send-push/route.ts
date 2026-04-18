import { NextResponse } from "next/server";
import webpush from "web-push";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getTodayVerse } from "@/lib/daily-verse-post28";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/send-push
 *
 * Runs every hour. For each hour of the day, finds users who have:
 *   - morning_enabled = true
 *   - morning_hour matches current UTC hour (adjusted for their timezone approximation)
 * ...and sends them today's verse as a push notification.
 *
 * Uses VAPID keys from env:
 *   VAPID_SUBJECT (mailto:support@taamun.com)
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *
 * Invalid/expired subscriptions (410 / 404) are automatically deleted.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@taamun.com";

  if (!publicKey || !privateKey) {
    return NextResponse.json(
      { error: "vapid_not_configured", hint: "Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in env" },
      { status: 500 }
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  // Current UTC hour — assume most KSA users want morning push around 6 AM local = 3 AM UTC
  // We run every hour and match subscriptions where morning_hour == currentUtcHour + 3
  // Simpler approach: match morning_hour directly (user picks UTC-equivalent)
  const currentHour = new Date().getUTCHours();

  const admin = getSupabaseAdmin();

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("*")
    .eq("morning_enabled", true)
    .eq("morning_hour", currentHour)
    .limit(1000);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, hour: currentHour });
  }

  const today = getTodayVerse();
  const notificationPayload = JSON.stringify({
    title: "آية اليوم — تمعّن",
    body: today.prompt,
    url: "/",
    tag: "taamun-morning",
  });

  let sent = 0;
  let failed = 0;
  const expiredIds: string[] = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        notificationPayload
      );
      sent++;
      // Mark last_sent_at (best-effort, fire-and-forget)
      await admin
        .from("push_subscriptions")
        .update({ last_sent_at: new Date().toISOString(), failure_count: 0 })
        .eq("id", sub.id);
    } catch (err) {
      failed++;
      const statusCode = (err as { statusCode?: number }).statusCode;
      // 410 Gone or 404 = subscription is dead, delete it
      if (statusCode === 410 || statusCode === 404) {
        expiredIds.push(sub.id);
      } else {
        // Increment failure count
        await admin
          .from("push_subscriptions")
          .update({
            last_failure_at: new Date().toISOString(),
            failure_count: (sub.failure_count ?? 0) + 1,
          })
          .eq("id", sub.id);
      }
    }
  }

  if (expiredIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", expiredIds);
  }

  return NextResponse.json({
    ok: true,
    hour: currentHour,
    sent,
    failed,
    expired_removed: expiredIds.length,
  });
}
