import type { NextRequest, NextResponse } from "next/server";
import {
  verifyEntitlementToken,
  makeEntitlementToken,
  COOKIE_NAME,
} from "../entitlement";
import { getSupabaseAdmin } from "../supabaseAdmin";
import { cookieMaxAge } from "../subscriptionDurations";

/**
 * RENEW-09: cookie-vs-DB reconciliation.
 *
 * If DB shows a later `profiles.expires_at` than the HMAC cookie carries, re-mint
 * the cookie onto the response. Defense against Pitfall #14: a user who just
 * auto-renewed has a fresh DB expiry but their entitlement cookie still reflects
 * yesterday's (stale) expiry. Without this helper, subscription gating and the
 * renewal banner would disagree with reality on the very next page load.
 *
 * Best-effort only: this function NEVER throws. Any failure (no cookie, invalid
 * cookie, DB error, supabase down) results in a silent no-op so the ride-along
 * request it was called from continues unaffected.
 *
 * Does NOT:
 * - issue any DB writes (read-only reconciliation)
 * - mint a cookie when DB expiry equals or precedes the cookie's expiry
 * - touch middleware (deliberately — see 09-CONTEXT decisions: route-handler
 *   call site avoids running on sacred routes)
 * - change the HMAC format or cookie name
 *
 * @param req     Incoming request — used to read the current cookie value
 * @param res     Outgoing response — mutated via `res.cookies.set` when refresh needed
 * @param userId  The authenticated user's id (already resolved by caller)
 */
export async function refreshEntitlementIfStale(
  req: NextRequest,
  res: NextResponse,
  userId: string
): Promise<void> {
  try {
    const currentToken = req.cookies.get(COOKIE_NAME)?.value;
    if (!currentToken) return; // Nothing to refresh — no entitlement cookie present.

    const verified = verifyEntitlementToken(currentToken);
    if (!verified.valid) return; // Forged / malformed / legacy — leave alone.

    const cookieExpiryMs = verified.expiresAt
      ? new Date(verified.expiresAt).getTime()
      : 0;

    const admin = getSupabaseAdmin();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("expires_at, subscription_tier")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile || !profile.expires_at) return;

    const dbExpiryMs = new Date(profile.expires_at).getTime();
    if (!Number.isFinite(dbExpiryMs)) return;

    // Only refresh when DB is STRICTLY later than the cookie. Equal → no-op.
    if (dbExpiryMs <= cookieExpiryMs) return;

    const tier = profile.subscription_tier || verified.tier || "monthly";
    const fresh = makeEntitlementToken(userId, tier, profile.expires_at);

    res.cookies.set(COOKIE_NAME, fresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: cookieMaxAge(tier),
    });
  } catch (e) {
    // Deliberately swallow — cookie refresh must never break the request it rode in on.
    // eslint-disable-next-line no-console
    console.warn("[refreshEntitlementIfStale] swallowed:", e);
  }
}
