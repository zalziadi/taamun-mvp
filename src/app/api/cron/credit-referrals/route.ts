import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  creditOneReferral,
  type CreditOutcome,
  type ReferralRow,
} from "@/lib/referral/credit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Nightly cron — credit referrers after their invitee's day-14 gate passes.
 *
 * Phase 10, REFER-03/04/05/06/08. Scheduled via vercel.json at 23:00 UTC
 * (02:00 Asia/Riyadh — UTC+3, no DST). Bearer-gated by CRON_SECRET,
 * mirroring /api/cron/manage-subscriptions.
 *
 * Scans public.referrals for rows with status='pending_day14' whose invitee
 * redeemed more than 14 days ago, then calls creditOneReferral() per row.
 * All eligibility + cap + refund checks are inside creditOneReferral()
 * (see src/lib/referral/credit.ts).
 *
 * Safety posture:
 *   - .limit(500) — prevents runaway credits on a bad scan.
 *   - sequential per row — easier to reason about cap races and DB load.
 *   - per-row try/catch — one poison row doesn't block the batch.
 *   - zero side-effects outside credit.ts — no email_queue, no push,
 *     no emitEvent. REFER-11 "transparent without gamification UI".
 *   - zero activation_codes insert — REFER-04 enforced by grep in 10.08.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const fourteenDaysAgo = new Date(
    Date.now() - 14 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Uses partial index idx_referrals_status_redeemed (Plan 10.01) — cheap scan.
  const { data: candidates, error } = await admin
    .from("referrals")
    .select("id, code, referrer_id, invitee_id, status, invitee_redeemed_at")
    .eq("status", "pending_day14")
    .lte("invitee_redeemed_at", fourteenDaysAgo)
    .limit(500);

  if (error) {
    console.error("[cron/credit-referrals] scan error:", error.message);
    return NextResponse.json(
      { error: "scan_failed", message: error.message },
      { status: 500 },
    );
  }

  const outcomes: Record<CreditOutcome, number> = {
    credited: 0,
    refunded: 0,
    capped: 0,
    not_yet_day14: 0,
    already_rewarded: 0,
    invalid_row: 0,
  };

  for (const row of (candidates ?? []) as ReferralRow[]) {
    try {
      const outcome = await creditOneReferral(admin, row);
      outcomes[outcome] = (outcomes[outcome] ?? 0) + 1;
    } catch (e) {
      console.error(
        "[cron/credit-referrals] row error:",
        row.id,
        (e as Error).message,
      );
      outcomes.invalid_row += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: candidates?.length ?? 0,
    outcomes,
    timestamp: new Date().toISOString(),
  });
}
