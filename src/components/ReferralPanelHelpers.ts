/**
 * Pure helpers for ReferralPanel — extracted to a .ts file so vitest (which
 * has no JSX transform configured in this repo) can exercise them without
 * pulling the .tsx component. Mirrors the pattern used by
 * renewalBannerHelpers.ts (Plan 09.04 precedent).
 *
 * Single source of truth for:
 *   - Arabic status labels (REFER-11 transparency — no progress bars, no
 *     gamification, plain-language labels).
 *   - Share text + href builders shared by WhatsApp (primary), Instagram
 *     (fallback), and copy-to-clipboard (fallback).
 *
 * NOT imported: React, next/*, process.env — the helpers are pure and take
 * `appDomain` as a function argument so tests are deterministic.
 *
 * Banned vocabulary (enforced by ReferralPanelHelpers.test.ts):
 *   earn / cash / reward / points / affiliate / commission / خصم / أرباح / سحب.
 * These tokens MUST NOT appear in the share text. Copy is da'wah-framed.
 */

export type ReferralStatus =
  | "pending_invitee"
  | "pending_day14"
  | "rewarded"
  | "refunded"
  | "void";

/**
 * Arabic status labels per REFER-11. Refunded/void both render as
 * "أُلغيت" — the distinction (refund vs expiry) is internal audit data,
 * not user-facing.
 */
export const STATUS_LABEL: Record<ReferralStatus, string> = {
  pending_invitee: "بانتظار البدء",
  pending_day14: "في الطريق",
  rewarded: "تمّت الهدية",
  refunded: "أُلغيت",
  void: "أُلغيت",
};

/**
 * Build the Arabic da'wah-framed share text.
 *
 * The URL carries `?ref={code}` so the landing page can auto-populate the
 * activation form. Single-line format keeps WhatsApp previews tidy.
 */
export function buildShareText(code: string, appDomain: string): string {
  return `تمعّن — ٢٨ يومًا مع القرآن. خذ شهرًا تجربة على حسابي: ${appDomain}/?ref=${code}`;
}

/**
 * WhatsApp deep-link. `wa.me/?text=` is the universal share endpoint and works
 * on both mobile (opens the WhatsApp app) and web.
 */
export function buildWhatsAppHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Instagram "share" fallback.
 *
 * IG Web does NOT accept arbitrary prefilled story text from an external
 * referrer. There is no documented `instagram.com/stories/create?text=...`
 * API. Pragmatic fallback: open instagram.com and instruct the user to
 * paste the copied code (the Copy button is shown alongside).
 *
 * `code` and `appDomain` are accepted for symmetry with the other builders
 * and so a future IG OG-card route (Plan 10.07) can swap the impl without
 * touching the component call sites.
 */
export function buildInstagramStoryHref(
  _code: string,
  _appDomain: string,
): string {
  return "https://www.instagram.com/";
}

/**
 * Copy-to-clipboard text — same source of truth as buildShareText. Keeping
 * these aligned (alias-by-call, not alias-by-reference) prevents drift if a
 * future change adds context-specific formatting to the WhatsApp path.
 */
export function buildCopyText(code: string, appDomain: string): string {
  return buildShareText(code, appDomain);
}
