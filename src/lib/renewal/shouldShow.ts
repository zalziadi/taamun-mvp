import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Result type for shouldShowRenewalBanner.
 *
 * When show=false, `reason` explains why for observability (Phase 9 analytics
 * consumers + debugging). When show=true, the caller receives the gateway
 * slug it must route the user to, plus days-remaining and subscription tier
 * for banner copy.
 *
 * Consumed by `/api/renewal/status/route.ts` (Plan 09.04) and ultimately
 * by `RenewalBanner.tsx`.
 */
export type ShouldShowResult =
  | {
      show: false;
      reason:
        | "no_profile"
        | "no_expires_at"
        | "not_within_window"
        | "already_expired"
        | "no_gateway"
        | "email_sent_today"
        | "push_sent_today"
        | "db_error";
    }
  | {
      show: true;
      gateway: "salla" | "tap" | "stripe" | "eid_code";
      daysRemaining: number;
      tier: string;
    };

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Server-side authority for "should the renewal banner render for this user right now?"
 *
 * Consolidates into a single function:
 *   - RENEW-01: 7-day pre-expiry window check
 *   - RENEW-06: multi-channel dedup (email + push) so we never triple-nudge
 *   - RENEW-07: auto-renewed users self-suppress (their expires_at jumps > 7d)
 *   - RENEW-08: we only READ email_queue — we never mint a new template
 *
 * READ-ONLY by contract. No writes, no analytics emission, no cookie touch,
 * no React imports. The caller (an API route) is responsible for emitting
 * the `renewal_prompted` event (once per session) after receiving show=true.
 *
 * Schema drift adaptation (documented in 09.05-SUMMARY.md):
 *   - email_queue uses `template` (not `type`) — values: 'expiry_warning', 'expired', ...
 *   - email_queue.sent_at is NULL until the 5-min cron flushes; we dedup on
 *     `created_at` so that a just-queued-but-not-yet-delivered email still
 *     suppresses the banner (user-perceived nudge count is what matters).
 *   - push_subscriptions uses `last_sent_at` (not `last_notified_at`).
 */
export async function shouldShowRenewalBanner(
  userId: string
): Promise<ShouldShowResult> {
  let admin;
  try {
    admin = getSupabaseAdmin();
  } catch {
    return { show: false, reason: "db_error" };
  }

  // 1. Profile lookup — must exist, must have expires_at, must be within window
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("expires_at, original_gateway, subscription_tier")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.warn("[shouldShow] profile read error:", profileError.message);
    return { show: false, reason: "db_error" };
  }
  if (!profile) return { show: false, reason: "no_profile" };

  const p = profile as {
    expires_at: string | null;
    original_gateway: string | null;
    subscription_tier: string | null;
  };

  if (!p.expires_at) return { show: false, reason: "no_expires_at" };

  const expiresAtMs = new Date(p.expires_at).getTime();
  const now = Date.now();

  if (expiresAtMs <= now) return { show: false, reason: "already_expired" };
  if (expiresAtMs - now > SEVEN_DAYS_MS) {
    // Auto-renewed users land here naturally: their expires_at jumps well past 7 days.
    return { show: false, reason: "not_within_window" };
  }
  if (!p.original_gateway) return { show: false, reason: "no_gateway" };

  // 2. Email dedup — respect the existing v1.1 expiry-warning queue.
  // We look at `created_at` so that a queued-but-not-yet-sent email still
  // dedups (the user will see it within 5min; don't stack a banner on top).
  const since = new Date(now - ONE_DAY_MS).toISOString();
  const { data: recentEmails } = await admin
    .from("email_queue")
    .select("id")
    .eq("user_id", userId)
    .in("template", ["expiry_warning", "renewal", "expired"])
    .gte("created_at", since)
    .limit(1);
  if (recentEmails && (recentEmails as unknown[]).length > 0) {
    return { show: false, reason: "email_sent_today" };
  }

  // 3. Push dedup — if user received a push in the last 24h, skip the banner.
  // Column is `last_sent_at` (per 20260418100000_push_subscriptions.sql).
  const { data: pushRows } = await admin
    .from("push_subscriptions")
    .select("last_sent_at")
    .eq("user_id", userId)
    .gte("last_sent_at", since)
    .limit(1);
  if (pushRows && (pushRows as unknown[]).length > 0) {
    return { show: false, reason: "push_sent_today" };
  }

  // 4. Compute days remaining — ceil so "6.3 days" reads as "6 more days".
  const daysRemaining = Math.max(
    0,
    Math.ceil((expiresAtMs - now) / ONE_DAY_MS)
  );

  // 5. Narrow gateway — if a rogue value sneaks in, treat as no_gateway so
  // the banner never renders with a broken CTA.
  const gateway = p.original_gateway;
  if (
    gateway !== "salla" &&
    gateway !== "tap" &&
    gateway !== "stripe" &&
    gateway !== "eid_code"
  ) {
    return { show: false, reason: "no_gateway" };
  }

  return {
    show: true,
    gateway,
    daysRemaining,
    tier: p.subscription_tier || "monthly",
  };
}
