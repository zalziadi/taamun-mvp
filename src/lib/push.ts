import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared web-push sender for transactional notifications (thread replies,
 * creator updates, etc.). The daily send-push cron has its own copy of the
 * VAPID setup for historical reasons; this helper is the canonical path for
 * one-off sends.
 *
 * Silent no-op when VAPID env isn't configured — we never throw up the stack
 * because a failed push must not block the inserting request.
 */
export async function sendPushToUser(
  admin: SupabaseClient,
  userId: string,
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<{ sent: number; failed: number; skipped: boolean }> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@taamun.com";

  if (!publicKey || !privateKey) {
    return { sent: 0, failed: 0, skipped: true };
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId)
    .limit(50);

  if (!subs || subs.length === 0) {
    return { sent: 0, failed: 0, skipped: false };
  }

  const serialized = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  const expiredIds: string[] = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint as string,
          keys: { p256dh: sub.p256dh as string, auth: sub.auth as string },
        },
        serialized
      );
      sent++;
    } catch (err: unknown) {
      failed++;
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        expiredIds.push(sub.id as string);
      }
    }
  }

  if (expiredIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", expiredIds);
  }

  return { sent, failed, skipped: false };
}
