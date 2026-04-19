/**
 * Pure helpers for RenewalBanner — extracted to a .ts file so vitest (which
 * has no JSX transform configured in this repo) can exercise them without
 * pulling the .tsx component.
 *
 * Single source of truth for the storage key names + dismiss window. The
 * component imports from here; tests import from here. Do not duplicate
 * these constants in the component.
 */

export const DISMISS_KEY = "taamun.renewal_dismissed_until.v1";
export const DISMISS_COUNT_KEY = "taamun.renewal_dismiss_count.v1";
export const SESSION_EMIT_KEY = "taamun.renewal_prompted_session.v1";
export const DISMISS_WINDOW_MS = 48 * 60 * 60 * 1000; // 48h
export const MAX_DISMISSALS = 3;

export type RenewalGateway = "salla" | "tap" | "stripe" | "eid_code";

/**
 * Resolves the CTA href per original gateway. When a gateway-specific env
 * URL isn't set, falls back to `/pricing?source=expired&gateway=<gw>` so the
 * link is never broken.
 */
export function gatewayCtaHref(gateway: RenewalGateway): string {
  switch (gateway) {
    case "salla":
      return (
        process.env.NEXT_PUBLIC_SALLA_RENEWAL_URL ||
        "/pricing?source=expired&gateway=salla"
      );
    case "tap":
      return (
        process.env.NEXT_PUBLIC_TAP_RENEWAL_URL ||
        "/pricing?source=expired&gateway=tap"
      );
    case "stripe":
      return (
        process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL ||
        "/pricing?source=expired&gateway=stripe"
      );
    case "eid_code":
    default:
      return "/pricing?source=expired";
  }
}

/**
 * Pure dismiss-state check from the provided storage. Returns true when the
 * banner should be suppressed because the user dismissed recently or has hit
 * the dismiss cap.
 *
 * Storage-blocked environments (Safari private, enterprise Chrome) return
 * false — banner renders normally. Strictly better than crashing.
 */
export function isDismissedFrom(
  storage: Pick<Storage, "getItem"> | null | undefined,
  now: number = Date.now()
): boolean {
  if (!storage) return false;
  try {
    const untilRaw = storage.getItem(DISMISS_KEY);
    const until = Number(untilRaw || 0);
    if (Number.isFinite(until) && until > now) return true;
    const countRaw = storage.getItem(DISMISS_COUNT_KEY);
    const count = Number(countRaw || 0);
    if (Number.isFinite(count) && count >= MAX_DISMISSALS) return true;
  } catch {
    /* storage access blocked — treat as not-dismissed */
  }
  return false;
}
