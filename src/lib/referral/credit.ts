import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Referral credit helpers — Phase 10, REFER-03/04/05/06/08.
 *
 * The nightly cron at /api/cron/credit-referrals iterates pending_day14 rows
 * and calls `creditOneReferral()` per row. That helper enforces FOUR guards:
 *
 *   1. Day-14 retention gate (REFER-03/05) — only credit if invitee actually
 *      completed day 14 (checked via progress.completed_days, fallback to
 *      user_progress legacy table).
 *   2. Refund/cancel check (REFER-08) — void pending reward if invitee
 *      refunded within 14 days.
 *   3. Annual cap re-check (REFER-06) — 3-per-calendar-year per referrer,
 *      enforced at BOTH /api/referral/create and here (defense in depth).
 *   4. Direct expires_at update (REFER-04) — NEVER mint activation_codes.
 *      The referrer's reward is a straight UPDATE to profiles.expires_at.
 *
 * Silent delivery (REFER-11): no email_queue insert, no push, no emitEvent
 * on credit. Users simply notice their expires_at extended on next /account
 * visit — in keeping with "transparent without gamification UI".
 *
 * Synchronous (PITFALL #19 / REFER-05): each credit is a direct DB write
 * inside the cron loop — no webhook, no queue, no setTimeout.
 */

export type CreditOutcome =
  | "credited"
  | "refunded"
  | "capped"
  | "not_yet_day14"
  | "already_rewarded"
  | "invalid_row";

export interface ReferralRow {
  id: string;
  code: string;
  referrer_id: string;
  invitee_id: string | null;
  status: string;
  invitee_redeemed_at: string | null;
}

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Check whether an invitee is eligible for the referrer credit.
 *
 * Returns:
 *  - 'refunded'      — invitee refunded/cancelled, reward should be voided.
 *  - 'day14_reached' — invitee completed day 14, safe to credit.
 *  - 'not_yet'       — invitee active but hasn't reached day 14, retry later.
 *
 * Refund heuristic (REFER-08): subscription_status === 'expired' (expired
 * before the 14d mark) OR profiles.expires_at earlier than
 * invitee_redeemed_at + 14d (short-lived month = refunded/chargeback).
 */
export async function isInviteeEligible(
  admin: SupabaseClient,
  inviteeId: string,
  redeemedAt: string,
): Promise<"day14_reached" | "not_yet" | "refunded"> {
  const { data: profile } = await admin
    .from("profiles")
    .select("subscription_status, expires_at")
    .eq("id", inviteeId)
    .maybeSingle();

  // No profile = treat as refunded (defensive). Account gone = no reward.
  if (!profile) return "refunded";

  const redeemedMs = Date.parse(redeemedAt);
  const minExpiresMs = redeemedMs + FOURTEEN_DAYS_MS;
  const expiresMs = profile.expires_at ? Date.parse(profile.expires_at) : 0;

  if (profile.subscription_status === "expired" && expiresMs < minExpiresMs) {
    return "refunded";
  }
  if (profile.expires_at && expiresMs < minExpiresMs) {
    // Short month — the invitee's free month was cut short (refund/chargeback).
    return "refunded";
  }

  // Day-14 gate: progress.completed_days must include 14. Fallback to legacy
  // user_progress table (matches src/lib/progressStore.ts shape).
  const day14 = await readDay14Reached(admin, inviteeId);
  return day14 ? "day14_reached" : "not_yet";
}

async function readDay14Reached(
  admin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const primary = await admin
    .from("progress")
    .select("completed_days")
    .eq("user_id", userId)
    .maybeSingle();

  if (!primary.error && primary.data) {
    return hasDay14(primary.data.completed_days);
  }

  // Legacy fallback — only if primary table itself is missing.
  if (primary.error && isMissingTable(primary.error)) {
    const legacy = await admin
      .from("user_progress")
      .select("completed_days")
      .eq("user_id", userId)
      .maybeSingle();
    if (!legacy.error && legacy.data) {
      return hasDay14(legacy.data.completed_days);
    }
  }

  return false;
}

function hasDay14(completedDays: unknown): boolean {
  if (!Array.isArray(completedDays)) return false;
  return completedDays.some((v) => Number(v) === 14);
}

function isMissingTable(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  const msg = String((err as { message?: string } | null)?.message ?? "").toLowerCase();
  return code === "42P01" || msg.includes("does not exist");
}

/**
 * Count a referrer's rewarded rows in the current calendar year.
 *
 * Used by creditOneReferral() to enforce REFER-06 (max 3 per year).
 * The /api/referral/create endpoint also checks this cap; doing it again
 * here guarantees no more than 3 credits even if /create had a race window.
 */
export async function yearlyRewardedCount(
  admin: SupabaseClient,
  referrerId: string,
  nowIso: string,
): Promise<number> {
  const now = new Date(nowIso);
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();

  const { count } = (await admin
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", referrerId)
    .eq("status", "rewarded")
    .gte("created_at", yearStart)) as { count: number | null };

  return count ?? 0;
}

/**
 * Orchestrate a single referral credit. Idempotent — re-running on the same
 * row after it's been credited is a no-op (`invalid_row` outcome).
 *
 * Order of checks is deliberate:
 *   1. Idempotency (status must be pending_day14).
 *   2. Defensive null guard (invitee_id can't be null post-redemption).
 *   3. Eligibility (refund/day14 gate) — voids refunded rows immediately.
 *   4. Cap re-check — voids over-cap rows immediately.
 *   5. Extend referrer.expires_at by 30d from max(now, current).
 *   6. Mark referrals row as rewarded.
 *
 * Never:
 *  - Inserts into activation_codes (REFER-04).
 *  - Emits email_queue / push / emitEvent (REFER-11 silent delivery).
 *  - Runs async (REFER-05 synchronous per PITFALL #19).
 */
export async function creditOneReferral(
  admin: SupabaseClient,
  row: ReferralRow,
): Promise<CreditOutcome> {
  // 1. Idempotency guard — only credit pending_day14 rows.
  if (row.status !== "pending_day14") return "invalid_row";

  // 2. Defensive null guard — should never happen post-redemption.
  if (!row.invitee_id || !row.invitee_redeemed_at) return "invalid_row";

  // 3. Eligibility gate.
  const eligibility = await isInviteeEligible(
    admin,
    row.invitee_id,
    row.invitee_redeemed_at,
  );

  if (eligibility === "not_yet") {
    // Leave the row untouched — the next cron run will retry.
    return "not_yet_day14";
  }

  if (eligibility === "refunded") {
    // Void pending reward (REFER-08).
    await admin
      .from("referrals")
      .update({ status: "refunded" })
      .eq("id", row.id);
    return "refunded";
  }

  // 4. Annual cap re-check (REFER-06 defense in depth).
  const nowIso = new Date().toISOString();
  const count = await yearlyRewardedCount(admin, row.referrer_id, nowIso);
  if (count >= 3) {
    await admin
      .from("referrals")
      .update({ status: "void" })
      .eq("id", row.id);
    return "capped";
  }

  // 5. Read referrer profile + extend expires_at.
  const { data: referrer, error: readErr } = await admin
    .from("profiles")
    .select("expires_at")
    .eq("id", row.referrer_id)
    .maybeSingle();

  if (readErr || !referrer) return "invalid_row";

  // Extend from the LATER of (current expiry, now) — defends against cheating
  // users whose expiry is in the past from stacking past months.
  const currentExpiresMs = referrer.expires_at
    ? Date.parse(referrer.expires_at)
    : 0;
  const base = Math.max(Date.now(), Number.isFinite(currentExpiresMs) ? currentExpiresMs : 0);
  const newExpiresAt = new Date(base + THIRTY_DAYS_MS).toISOString();

  const { error: updateErr } = await admin
    .from("profiles")
    .update({ expires_at: newExpiresAt })
    .eq("id", row.referrer_id);

  if (updateErr) {
    // Leave referrals row unchanged — next cron run will retry.
    return "invalid_row";
  }

  // 6. Mark referral as rewarded. If this fails, we've already extended the
  // referrer's expiry — next run will see status='pending_day14' still and
  // attempt again; the cap check prevents unbounded credits.
  await admin
    .from("referrals")
    .update({
      status: "rewarded",
      referrer_rewarded_at: nowIso,
    })
    .eq("id", row.id);

  return "credited";
}
