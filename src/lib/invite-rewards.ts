import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Apply +30-day invite reward to both inviter and invitee.
 *
 * Trigger: called on first successful subscription payment for the invitee.
 * Idempotent: guards via `invite_redemptions.rewarded` flag.
 *
 * Side effects:
 *   - Extends `profiles.expires_at` by 30 days for both users
 *   - Sets `invite_redemptions.rewarded = true` and `rewarded_at = now()`
 *
 * Returns a structured result for logging / telemetry.
 */
export type InviteRewardResult =
  | { applied: false; reason: "no_redemption" | "already_rewarded" }
  | {
      applied: true;
      inviteeUserId: string;
      inviterUserId: string;
      inviteeExpiresAt: string;
      inviterExpiresAt: string;
    };

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function extend(expiresAt: string | null | undefined): string {
  const now = Date.now();
  const current = expiresAt ? new Date(expiresAt).getTime() : 0;
  const base = Math.max(current, now);
  return new Date(base + THIRTY_DAYS_MS).toISOString();
}

export async function applyInviteReward(
  admin: SupabaseClient,
  inviteeUserId: string
): Promise<InviteRewardResult> {
  // Find the redemption row tied to this invitee
  const { data: redemption, error: redErr } = await admin
    .from("invite_redemptions")
    .select("id, inviter_user_id, invitee_user_id, rewarded")
    .eq("invitee_user_id", inviteeUserId)
    .maybeSingle();

  if (redErr || !redemption) {
    return { applied: false, reason: "no_redemption" };
  }
  if (redemption.rewarded) {
    return { applied: false, reason: "already_rewarded" };
  }

  const inviterId = redemption.inviter_user_id as string;

  // Fetch current expires_at for both
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, expires_at")
    .in("id", [inviteeUserId, inviterId]);

  const inviteeProfile = profiles?.find((p) => p.id === inviteeUserId);
  const inviterProfile = profiles?.find((p) => p.id === inviterId);

  const inviteeNew = extend(inviteeProfile?.expires_at as string | null);
  const inviterNew = extend(inviterProfile?.expires_at as string | null);

  // Apply both updates
  await admin
    .from("profiles")
    .update({ expires_at: inviteeNew, updated_at: new Date().toISOString() })
    .eq("id", inviteeUserId);

  await admin
    .from("profiles")
    .update({ expires_at: inviterNew, updated_at: new Date().toISOString() })
    .eq("id", inviterId);

  // Mark redemption as rewarded (atomic guard against double-apply)
  const { data: marked } = await admin
    .from("invite_redemptions")
    .update({ rewarded: true, rewarded_at: new Date().toISOString() })
    .eq("id", redemption.id)
    .eq("rewarded", false)
    .select("id")
    .maybeSingle();

  if (!marked) {
    // Race: another process rewarded in parallel. No harm — updates are idempotent.
    return { applied: false, reason: "already_rewarded" };
  }

  return {
    applied: true,
    inviteeUserId,
    inviterUserId: inviterId,
    inviteeExpiresAt: inviteeNew,
    inviterExpiresAt: inviterNew,
  };
}
