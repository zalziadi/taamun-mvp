import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/authz";
import { shouldShowRenewalBanner } from "@/lib/renewal/shouldShow";
import { refreshEntitlementIfStale } from "@/lib/renewal/refreshEntitlement";

/**
 * GET /api/renewal/status
 *
 * Plan 09.04 — bridges the RenewalBanner client component to the Plan 09.05
 * server authority (`shouldShowRenewalBanner`) and the Plan 09.06 cookie
 * reconciler (`refreshEntitlementIfStale`).
 *
 * Contract:
 *   - Auth-gated via requireUser(); unauthenticated callers get a safe
 *     `{ show: false, reason: "unauthenticated" }` (banner stays hidden).
 *   - Refreshes the entitlement cookie BEFORE reading banner state so that a
 *     user who just auto-renewed doesn't see the banner while their cookie
 *     catches up (Pitfall #14 in 09-CONTEXT).
 *   - Returns JSON only. Never PII. Never user-content bodies.
 *   - NO analytics emission here. The banner fires `renewal_prompted` exactly
 *     once per session from the client; polling this endpoint must not
 *     repeatedly count as a prompt.
 *   - Uses NODE runtime (the supabase admin client + HMAC entitlement need
 *     Node crypto; Edge runtime is not compatible).
 *   - `force-dynamic` because the answer depends on the authenticated user
 *     and freshly-queried DB state — never cacheable.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) {
    // Unauthenticated callers should never see the banner — keep the response
    // shape consistent with `ShouldShowResult` so the client's discriminated
    // union stays happy.
    return NextResponse.json({ show: false, reason: "unauthenticated" });
  }

  // Step 1: compute the banner decision based on current DB truth.
  const result = await shouldShowRenewalBanner(auth.user.id);

  const body = result.show
    ? {
        show: true as const,
        gateway: result.gateway,
        daysRemaining: result.daysRemaining,
        tier: result.tier,
      }
    : { show: false as const, reason: result.reason };

  const res = NextResponse.json(body);

  // Step 2: best-effort cookie reconciliation (never throws by contract of
  // 09.06). Attached onto the outgoing response so a stale cookie re-mints on
  // this same round-trip.
  try {
    await refreshEntitlementIfStale(req, res, auth.user.id);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[renewal/status] entitlement refresh failed (non-blocking):", e);
  }

  return res;
}
