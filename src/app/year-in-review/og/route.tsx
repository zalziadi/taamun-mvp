import { ImageResponse } from "next/og";
import { APP_DOMAIN } from "@/lib/appConfig";
import { YEAR_KEY_PATTERN } from "@/lib/yearInReview/types";

// Type-only import note: we import YEAR_KEY_PATTERN (a pure regex constant)
// from the Phase 11 type-split library. We do NOT import the private body
// type — not even as a type. The Plan 11.07 anti-pattern grep guard will
// fail CI if that identifier ever appears in this file. This is the third
// layer of PITFALL #10 defense (privacy bleed into OG image):
//   1. Data  — RPC returns only aggregates (Plan 11.01)
//   2. Types — public-stats and private-body types are key-disjoint (Plan 11.02)
//   3. Route — this file's import-set forbids reaching user-authored content
//   4. CI    — grep guard (Plan 11.07) seals the invariant at build time

/**
 * GET /year-in-review/og?year_key=YYYY_anniversary&c=<count>
 *
 * Phase 11 — YIR-05 (share card portion), YIR-07, YIR-08, YIR-09, NFR-01/04/08.
 *
 * Emits a 1200x630 next/og ImageResponse used by WhatsApp / Instagram /
 * generic OpenGraph crawlers when a subscriber shares their year-in-review.
 *
 * Design constraints (locked in 11.06-PLAN.md + 11-CONTEXT.md §Privacy):
 *  - PUBLIC endpoint — unauthenticated. Crawlers must fetch this without any
 *    session cookie. This route therefore NEVER reads cookies, headers, or
 *    the Supabase admin client. All inputs arrive via query params.
 *  - ZERO personalization beyond public aggregates. No user name, no email,
 *    no reflection text, no emotion label, no guide message. The card shows
 *    a Latin-numeral count and the year prefix — values that originate from
 *    YIRPublicStats (Plan 11.02) by construction.
 *  - Query-param-only design: the edge runtime cannot reach Supabase via the
 *    service role (Node `crypto` unavailable), and RLS blocks the anon key
 *    from reading `year_reviews` rows. The share URL builder in Plan 11.05
 *    embeds the aggregate count into the query — values are already on the
 *    public-aggregate side of the Plan 11.02 type split.
 *  - year_key gate: YEAR_KEY_PATTERN (from Plan 11.02) rejects anything that
 *    is not `YYYY_anniversary` — prevents the endpoint from being abused as
 *    an arbitrary text-to-image renderer (PITFALL #22 carried forward from
 *    Phase 10's referral OG route).
 *  - Count cap: reflections_count is clamped to [0, 9999] before render so
 *    an attacker cannot inject huge digit strings or NaN payloads.
 *  - Western Arabic (Latin) numerals — YIR-05 cross-platform readability
 *    decision. WhatsApp / Instagram crawler renderers have inconsistent
 *    support for Eastern Arabic numerals; Intl.NumberFormat("en-US") keeps
 *    the glyphs stable.
 *  - Latin-only body copy. Satori (the renderer inside next/og) ships
 *    without Arabic glyphs by default; adding a remote font fetch would
 *    inflate latency beyond NFR-01. Arabic reflective tone lives on the
 *    /year-in-review page itself (Plan 11.04). The OG card preview is a
 *    minimal Latin + count + domain card — same precedent as Phase 10.
 *  - Edge runtime is mandatory: next/og's ImageResponse is only supported
 *    on the edge runtime in Next.js 14.2. This is the single edge route in
 *    Phase 11; every other year-in-review route uses the Node.js runtime.
 *  - Zero new dependencies (NFR-08): next/og is built into Next.js 14.
 *
 * Analytics:
 *  - Fires `year_review_shared` server-side (fire-and-forget) on successful
 *    image response. We do NOT import `@/lib/analytics/server` because that
 *    module is Node-runtime flavored; instead we inline a minimal PostHog
 *    capture fetch which is supported by the edge runtime. distinct_id is
 *    the literal "share_card_crawler" — the viewer is a crawler, not the
 *    user, so we deliberately avoid any user identifier. This measures
 *    share-intent at crawler-fetch time; upstream click-time is measured by
 *    the share button in Plan 11.05 (page-side event).
 */

export const runtime = "edge";

// Static design tokens — NO user-derived values allowed on this card.
const BG = "#0A0908";
const GOLD = "#C9A84C";
const CREAM = "#D6D1C8";
const MUTED = "#807A72";

// Clamp bounds for the reflections_count query param. 0 ≤ c ≤ 9999 —
// upper bound aligns with what a realistic human could produce inside a
// 28-day cycle times the theoretical max of ~13 cycles per anniversary
// year, with generous slack. Anything above 9999 is either noise or
// adversarial and is clamped silently rather than erroring.
const COUNT_MIN = 0;
const COUNT_MAX = 9999;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const yearKey = url.searchParams.get("year_key") ?? "";
  const countRaw = url.searchParams.get("c") ?? "0";
  const parsed = parseInt(countRaw, 10);
  const count = Number.isFinite(parsed)
    ? Math.max(COUNT_MIN, Math.min(COUNT_MAX, parsed))
    : COUNT_MIN;

  // Hard validation per YIR-07 / PITFALL #22 — reject anything that is not
  // a YYYY_anniversary key. Plaintext 400 (not an image) keeps the response
  // cheap and prevents the endpoint from being abused as an arbitrary
  // text-to-image renderer. Crawlers that receive a 400 will not preview.
  if (!YEAR_KEY_PATTERN.test(yearKey)) {
    return new Response("invalid year_key", {
      status: 400,
      headers: { "content-type": "text/plain" },
    });
  }

  // Fire-and-forget analytics. Never block the image response, never throw
  // up through to the crawler. We deliberately use a generic distinct_id
  // because crawlers are not users — the share INTENT is tracked upstream
  // at click-time in Plan 11.05; this event tracks card-render reach.
  try {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (key && host) {
      // `void` — we do not await; the image render proceeds in parallel.
      void fetch(`${host}/capture/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: key,
          event: "year_review_shared",
          distinct_id: "share_card_crawler",
          properties: {
            year_key: yearKey,
            reflections_count: count,
          },
          timestamp: new Date().toISOString(),
        }),
      });
    }
  } catch {
    // Swallow analytics failures — image response must still succeed.
  }

  // Derive the year prefix for display (strip the `_anniversary` suffix).
  // Regex-validated above so this is safe.
  const yearLabel = yearKey.replace("_anniversary", "");
  const countFormatted = new Intl.NumberFormat("en-US").format(count);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: BG,
          color: CREAM,
          fontFamily: "serif",
          padding: "60px",
        }}
      >
        <div
          style={{
            fontSize: 36,
            color: MUTED,
            marginBottom: 24,
            letterSpacing: 2,
          }}
        >
          TAAMUN · تمعّن
        </div>
        <div
          style={{
            fontSize: 40,
            color: CREAM,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          My Year with the Qur&rsquo;an
        </div>
        <div
          style={{
            fontSize: 96,
            color: GOLD,
            marginBottom: 16,
            fontWeight: 600,
          }}
        >
          {countFormatted}
        </div>
        <div
          style={{
            fontSize: 32,
            color: CREAM,
            marginBottom: 48,
            textAlign: "center",
          }}
        >
          reflections · {yearLabel}
        </div>
        <div style={{ fontSize: 28, color: MUTED }}>{APP_DOMAIN}</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
