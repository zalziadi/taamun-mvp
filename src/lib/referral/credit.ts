// RED stub — intentionally failing, replaced in GREEN commit.
import type { SupabaseClient } from "@supabase/supabase-js";

export type CreditOutcome =
  | "credited"
  | "refunded"
  | "capped"
  | "not_yet_day14"
  | "already_rewarded"
  | "invalid_row";

export async function isInviteeEligible(
  _admin: SupabaseClient,
  _inviteeId: string,
  _redeemedAt: string,
): Promise<"day14_reached" | "not_yet" | "refunded"> {
  throw new Error("not_implemented");
}

export async function yearlyRewardedCount(
  _admin: SupabaseClient,
  _referrerId: string,
  _nowIso: string,
): Promise<number> {
  throw new Error("not_implemented");
}

export interface ReferralRow {
  id: string;
  code: string;
  referrer_id: string;
  invitee_id: string | null;
  status: string;
  invitee_redeemed_at: string | null;
}

export async function creditOneReferral(
  _admin: SupabaseClient,
  _row: ReferralRow,
): Promise<CreditOutcome> {
  throw new Error("not_implemented");
}
