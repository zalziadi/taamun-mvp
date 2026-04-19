import { ImageResponse } from "next/og";
import { APP_DOMAIN } from "@/lib/appConfig";

// FRIEND_CODE_REGEX is inlined here (kept in sync with
// src/lib/referral/generate.ts). We cannot import from generate.ts on the
// edge runtime because that module also imports Node's `crypto` at the top
// level for `randomBytes` (server-only code path). next/og's ImageResponse
// requires the edge runtime, and webpack refuses to bundle `crypto` for
// edge. Any change to the FRIEND-* alphabet or length in generate.ts MUST
// be mirrored here — the guard in 10.08 will grep both files to enforce it.
const FRIEND_CODE_REGEX = /^FRIEND-[0-9A-HJKMNP-TV-Z]{6}$/;

/**
 * GET /account/referral/og?code=FRIEND-XXXXXX
 *
 * Phase 10 — REFER-09 / REFER-10 (share-card portion).
 *
 * Emits a 1200x630 next/og ImageResponse used by WhatsApp / Instagram /
 * generic OpenGraph crawlers when a subscriber shares their referral link.
 *
 * Design constraints (locked in 10.07-PLAN.md + 10-CONTEXT.md §Sharing):
 *  - PUBLIC endpoint — unauthenticated. WhatsApp's crawler MUST be able to
 *    fetch this without a session cookie. The route therefore reads ONLY
 *    the `code` query param and never touches cookies, headers, or the
 *    Supabase admin client.
 *  - ZERO personalization. The card is content-free by policy: no invitee
 *    name, no journal text, no progress number, no email, no day-index.
 *    Privacy contract from BADGE-04 extends to the referral card.
 *  - Code gate: FRIEND_CODE_REGEX (mirrored from src/lib/referral/generate.ts
 *    — cannot be imported on edge due to generate.ts's Node `crypto` dep)
 *    rejects anything that is not a FRIEND-* code — prevents scraping of
 *    the OG endpoint for arbitrary text injection (PITFALL #22).
 *  - Minimal Latin-only design for v1.2. Satori (the renderer inside
 *    next/og) does not ship Arabic glyphs by default; adding a remote
 *    Google Fonts fetch would inflate latency beyond the NFR-01 first-byte
 *    budget. REFER-10 da'wah framing is satisfied by the Arabic copy on
 *    /account/referral (Plan 10.05) — the crawler preview itself can be a
 *    minimal Latin + code + domain card without violating the requirement.
 *  - Edge runtime is mandatory: next/og's ImageResponse is only supported
 *    on the edge runtime in Next.js 14.2.18 (verified against STACK.md).
 *    This is the single edge route in Phase 10; every other referral route
 *    uses the Node.js runtime.
 *  - Zero new dependencies (NFR-08): next/og is built into Next.js 14.
 */

export const runtime = "edge";

// Static design tokens — NO user-derived values allowed on this card.
const BG = "#0A0908";
const GOLD = "#C9A84C";
const CREAM = "#D6D1C8";
const MUTED = "#807A72";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") ?? "";

  // Hard validation per REFER-01 / PITFALL #22 — reject anything that
  // is not a FRIEND-* code. Plaintext 400 (not an image) keeps the
  // response cheap and prevents the endpoint from being abused as an
  // arbitrary text-to-image renderer.
  if (!FRIEND_CODE_REGEX.test(code)) {
    return new Response("invalid code", {
      status: 400,
      headers: { "content-type": "text/plain" },
    });
  }

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
            fontSize: 72,
            color: GOLD,
            marginBottom: 32,
            fontWeight: 600,
          }}
        >
          {code}
        </div>
        <div
          style={{
            fontSize: 40,
            color: CREAM,
            marginBottom: 48,
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          An invitation to 28 days with the Qur&rsquo;an.
        </div>
        <div style={{ fontSize: 28, color: MUTED }}>{APP_DOMAIN}</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
