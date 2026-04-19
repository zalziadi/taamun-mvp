---
phase: 09-renewal-prompts
verified: 2026-04-18T00:00:00Z
status: human_needed
score: 5/5 automated must-haves verified (human staging sign-off pending)
re_verification:
  previous_status: initial
  previous_score: n/a
  gaps_closed: []
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Apply both v1.2 Phase 9 migrations on staging Supabase"
    expected: |
      20260421000000_v1_2_profiles_original_gateway.sql → profiles.original_gateway column added (nullable, CHECK constraint present).
      20260421100000_v1_2_profiles_original_gateway_backfill.sql → idempotent UPDATEs populate existing rows.
      Second apply of both files reports UPDATE 0 across all 4 sections.
    why_human: "DDL + backfill must run on staging Supabase project — no programmatic path to verify prod DB state from the worktree."
  - test: "Load /program on a subscriber 6 days from expiry (staging)"
    expected: "Banner renders above page content with copy 'واصل معنا — اشتراكك يقترب من الانتهاء.' + CTA 'واصل رحلتك'. Network tab shows GET /api/renewal/status returning {show:true, gateway, daysRemaining, tier}."
    why_human: "Requires running Next.js server + authenticated staging user with seeded expires_at. No programmatic way to exercise the full fetch from harness."
  - test: "Navigate to /day/7, /reflection, /book/any-chapter"
    expected: "Banner DOES NOT render. No request to /api/renewal/status fires in Network tab (sacred-path structural guard short-circuits BEFORE fetch)."
    why_human: "Visual + network-tab confirmation on real browser against sacred paths."
  - test: "Dismiss banner → reload page → close tab → reopen"
    expected: "Banner stays hidden for 48h. LocalStorage key 'taamun.renewal_dismissed_until.v1' holds future-timestamp. Third dismiss hits cap (MAX_DISMISSALS=3) and suppresses even if window expires."
    why_human: "LocalStorage persistence across sessions + 3-dismiss cap requires real browser interaction."
  - test: "Gateway-aware CTA routing on staging"
    expected: |
      Salla user → NEXT_PUBLIC_SALLA_RENEWAL_URL (or /pricing?source=expired&gateway=salla fallback).
      Tap user → NEXT_PUBLIC_TAP_RENEWAL_URL fallback.
      Stripe user → NEXT_PUBLIC_STRIPE_PORTAL_URL fallback.
      Eid-code user → /pricing?source=expired.
    why_human: "Requires 4 distinct staging users with different profiles.original_gateway values + network hop to gateway."
  - test: "Auto-renew webhook simulation"
    expected: "After webhook extends expires_at past now+7d, next page load → banner disappears within one request even if HMAC cookie still carries stale expiry (refreshEntitlementIfStale re-mints on /api/renewal/status)."
    why_human: "Requires webhook fixture + cookie inspection in real browser."
  - test: "3-channel fatigue dedup"
    expected: "User with email_queue row (template='expiry_warning', created<24h ago) OR push_subscriptions row (last_sent_at<24h) → banner suppressed. shouldShow returns reason='email_sent_today' or 'push_sent_today'."
    why_human: "Requires seeded rows in staging DB + real API call."
  - test: "RTL + viewport check"
    expected: "Banner renders RTL (dir='rtl'), gold accent (#C9A84C) preserved, no overflow at 320px / 768px / 1240px viewports. Lighthouse A11y ≥ 95 on /program with banner visible."
    why_human: "Visual correctness + accessibility audit cannot be fully automated."
  - test: "renewal_prompted fires ONCE per session"
    expected: "First banner render → PostHog receives renewal_prompted with props {renewal_days_remaining, gateway, tier}. Route changes / remounts within same session → NO additional emit. New session (sessionStorage cleared) → one emit."
    why_human: "PostHog dashboard inspection + sessionStorage state across route changes require real browser."
---

# Phase 9: Renewal Prompts In-App — Verification Report

**Phase Goal:** A subscriber whose `expires_at` is within 7 days sees a single, dismissible, "واصل" — framed banner inside `AppChrome.tsx` (never on sacred routes) that deep-links to the gateway they originally paid through — and a user who already auto-renewed never sees it once.

**Verified:** 2026-04-18
**Status:** human_needed — all automated goal-backward checks pass; 9 staging/browser items route to human sign-off (Task 3 of 09.07, already flagged in SUMMARY as PENDING).
**Re-verification:** No (initial)

## Goal Achievement — 5 ROADMAP Success Criteria

| # | Success Criterion | Verdict | Evidence |
|---|-------------------|---------|----------|
| 1 | Subscriber 6d from expiry sees banner above content on `/`, `/program`, `/account`; sees NOTHING on `/day/*`, `/reflection/*`, `/book/*` | VERIFIED (code) | `src/components/AppChrome.tsx:104` mounts `<RenewalBanner />` inside `<main>` ABOVE `{children}` when `!hide`. `src/components/RenewalBanner.tsx:63` computes `onSacredPath = isExcludedPath(pathname)` and early-returns `null` at line 134 BEFORE any fetch. Harness Scenario A (lines 409–439) + Scenario E (lines 643–696): 13/13 checks PASS (isExcludedPath true for `/day/7`, `/book/chapter-1`, `/reflection`, `/program/day/3`; false for `/`, `/pricing`, `/account`). Guard check #3 bans `<Dialog>/<Modal>/fixed inset-0` — PASS. |
| 2 | Gateway-aware CTA: Salla→Salla, Tap→Tap, Stripe→Stripe | VERIFIED (code) | `src/components/renewalBannerHelpers.ts:24-45` — `gatewayCtaHref()` switch over `salla|tap|stripe|eid_code`, env override with `/pricing?source=expired&gateway=<gw>` fallback so link is never broken. `src/lib/renewal/shouldShow.ts:134-141` narrows gateway to the typed union; unknown values → `reason='no_gateway'` (banner suppressed, never broken CTA). Backfill migration `20260421100000:72-119` populates from `salla_connections`, `customer_subscriptions` (payment_provider='tap'/'stripe'), `activation_codes.used_by` with first-match-wins + NULL guards. Forward-fill confirmed in 4 webhook/activate routes (grep). |
| 3 | Dismiss persists 48h, max 3 dismisses per cycle | VERIFIED (code) | `src/components/renewalBannerHelpers.ts:11-15` — `DISMISS_KEY='taamun.renewal_dismissed_until.v1'`, `DISMISS_WINDOW_MS = 48*60*60*1000`, `MAX_DISMISSALS = 3`. `isDismissedFrom()` (lines 55-71) returns true when `until > now` OR `count >= 3`. `RenewalBanner.tsx:122-132` handleDismiss writes `now+48h` to DISMISS_KEY + increments DISMISS_COUNT_KEY. Harness Scenario C (lines 480–560): 4/4 checks PASS (recent dismiss → true; cap reached → true; stale dismiss + count=0 → false; null storage → false graceful). |
| 4 | Auto-renewed user does NOT see banner (even with stale HMAC cookie) | VERIFIED (code) | `shouldShow.ts:92-95` — `if (expiresAtMs - now > SEVEN_DAYS_MS) return {show:false, reason:'not_within_window'}`. Shield comment: "Auto-renewed users land here naturally". `refreshEntitlement.ts:34-80` reconciles cookie-vs-DB: reads current HMAC, compares to DB `profiles.expires_at`, re-mints onto response ONLY when `dbExpiryMs > cookieExpiryMs`. Wired in `src/app/api/renewal/status/route.ts:57-62` AFTER computing banner decision (best-effort, swallows errors, never throws). Harness Scenario B (show=false, not_within_window) + Scenario F (stale→refresh, same→no-op, no-cookie→no-op): 12/12 checks PASS. |
| 5 | 3-channel fatigue: email sent today → NO banner same day | VERIFIED (code) | `shouldShow.ts:101-123` — queries `email_queue` for `template IN ('expiry_warning','renewal','expired')` with `created_at >= now-24h`, returns `{show:false, reason:'email_sent_today'}`. Parallel check on `push_subscriptions.last_sent_at` → `reason:'push_sent_today'`. Uses `created_at` (not `sent_at`) so queued-but-not-yet-delivered emails still suppress banner. Reuses existing `expiry-warning-template.ts` (RENEW-08) — no new email template. Harness Scenario D: 3/3 checks PASS including negative case (`weekly_digest` does NOT suppress). |

**Score: 5/5 success criteria VERIFIED at code/harness level.** Real staging validation deferred to human-verify checkpoint.

## Required Artifacts — Level 1-4

| Artifact | Exists | Substantive | Wired | Data Flows | Status |
|----------|--------|-------------|-------|------------|--------|
| `src/lib/renewal/shouldShow.ts` | YES (149 lines) | YES (single-authority shouldShowRenewalBanner) | YES (imported by /api/renewal/status/route.ts:3) | YES (reads real Supabase via getSupabaseAdmin) | VERIFIED |
| `src/lib/renewal/shouldShow.test.ts` | YES (co-located test) | YES | YES | — | VERIFIED |
| `src/lib/renewal/refreshEntitlement.ts` | YES (80 lines) | YES (cookie reconciler) | YES (imported by /api/renewal/status/route.ts:4) | YES (reads profiles.expires_at, re-mints HMAC) | VERIFIED |
| `src/lib/renewal/refreshEntitlement.test.ts` | YES | YES | — | — | VERIFIED |
| `src/components/RenewalBanner.tsx` | YES (167 lines) | YES (sacred-path gate, fetch, dismiss, analytics emit-once) | YES (mounted in AppChrome.tsx:9,104) | YES (fetches /api/renewal/status, consumes gateway→CTA) | VERIFIED |
| `src/components/renewalBannerHelpers.ts` | YES (71 lines) | YES (constants + gatewayCtaHref + isDismissedFrom) | YES (imported by RenewalBanner.tsx:6-14) | — (pure) | VERIFIED |
| `src/components/renewalBannerHelpers.test.ts` | YES | YES | — | — | VERIFIED |
| `src/app/api/renewal/status/route.ts` | YES (65 lines) | YES (requireUser + shouldShow + refresh) | YES (force-dynamic, runtime=nodejs) | YES (returns ShouldShowResult JSON) | VERIFIED |
| `src/components/AppChrome.tsx` (mount) | YES | YES | YES (line 9 import, line 104 render) | YES | VERIFIED |
| `20260421000000_...original_gateway.sql` | YES | YES (additive ALTER + CHECK) | — (DDL) | PENDING (must apply to staging) | HUMAN |
| `20260421100000_..._backfill.sql` | YES | YES (4-section idempotent backfill) | — (DDL) | PENDING (must apply to staging) | HUMAN |
| `scripts/test-phase-09-integration.mjs` | YES (797 lines) | YES (6 scenarios / 32 checks) | YES (invoked standalone) | YES (32/32 PASS) | VERIFIED |
| `scripts/guards/phase-09-anti-patterns.sh` | YES (184 lines) | YES (6 checks + carve-out) | YES (guard:phase-09 + guard:release) | YES (PASS on current tree) | VERIFIED |

## Key Link Verification

| From | To | Via | Status | Detail |
|------|-----|-----|--------|--------|
| AppChrome.tsx | RenewalBanner.tsx | `import { RenewalBanner }` + `<RenewalBanner />` | WIRED | line 9 + line 104 |
| RenewalBanner.tsx | /api/renewal/status | `fetch("/api/renewal/status", { cache: "no-store" })` | WIRED | line 72 |
| /api/renewal/status | shouldShowRenewalBanner | `await shouldShowRenewalBanner(auth.user.id)` | WIRED | line 41 |
| /api/renewal/status | refreshEntitlementIfStale | `await refreshEntitlementIfStale(req, res, auth.user.id)` | WIRED | line 58 |
| RenewalBanner.tsx | isExcludedPath | `isExcludedPath(pathname)` — BEFORE fetch | WIRED | line 63 |
| shouldShow.ts | profiles/email_queue/push_subscriptions | `admin.from(...).select(...)` | WIRED | lines 68, 102, 115 |
| refreshEntitlement.ts | profiles + HMAC mint | `makeEntitlementToken` + `res.cookies.set` | WIRED | lines 51, 66, 68 |
| Forward-fill: webhooks/activate | profiles.original_gateway | UPDATE on first-gateway-wins | WIRED | 4 files (activate, salla/tap/stripe webhooks) |
| RenewalBanner.tsx | analytics track | dynamic `import("@/lib/analytics").then(({track})=>track("renewal_prompted",…))` | WIRED | lines 104-114; deduped via SESSION_EMIT_KEY sessionStorage |

## Behavioral Spot-Checks (Step 7b)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Integration harness 32/32 | `node scripts/test-phase-09-integration.mjs` | "32 passed, 0 failed" | PASS |
| Phase-09 guard clean | `bash scripts/guards/phase-09-anti-patterns.sh` | "PASS — zero banned patterns found" | PASS |
| Phase-08 guard (regression) | `bash scripts/guards/phase-08-anti-patterns.sh` | "PASS — zero banned patterns found" | PASS |
| Phase-07 guard (regression) | `bash scripts/guards/phase-07-anti-patterns.sh` | FAIL (pre-existing MilestoneBadge JSDoc — documented in deferred-items.md, Phase 8 scope) | FAIL (out-of-scope) |
| Banned copy in RenewalBanner | Grep `لا تفقد\|Countdown\|setInterval` in RenewalBanner.tsx | No matches | PASS |
| Banned copy in renewal lib | Grep same in `src/lib/renewal/` | No matches | PASS |
| Zero new deps | Inspect `package.json` | No additions since 2026-04-18 | PASS |

## Requirements Coverage — 9 RENEW REQs

| REQ | Description | Status | Evidence |
|-----|-------------|--------|----------|
| RENEW-01 | 7-day expiry window banner in AppChrome | SATISFIED | shouldShow.ts:92-95 + AppChrome.tsx:104 |
| RENEW-02 | "واصل" framing — no "لا تفقد" / countdown | SATISFIED | RenewalBanner.tsx:149,154 copy + guard check #1,#2 clean |
| RENEW-03 | Gateway-aware CTA from profiles.original_gateway | SATISFIED | renewalBannerHelpers.ts:24-45 + migrations 09.01+09.02 + webhook forward-fill |
| RENEW-04 | Dismiss persists 48h in LocalStorage | SATISFIED | renewalBannerHelpers.ts:11-14 + RenewalBanner.tsx:122-132 |
| RENEW-05 | Banner NEVER renders on /day/**, /reflection/**, /book/** | SATISFIED | RenewalBanner.tsx:63,134 + isExcludedPath single-source; Scenario E grep confirms |
| RENEW-06 | Email+push dedup within 24h | SATISFIED | shouldShow.ts:101-123 |
| RENEW-07 | Auto-renewed users suppressed | SATISFIED | shouldShow.ts:92-95 (>7d window short-circuit) |
| RENEW-08 | Reuses existing expiry-warning-template.ts | SATISFIED | shouldShow.ts reads email_queue for that template; no new template file created |
| RENEW-09 | Cookie-vs-DB HMAC reconciliation | SATISFIED | refreshEntitlement.ts full impl + wired in /api/renewal/status:58 |

Zero orphaned RENEW REQs. All 9 cited in SUMMARY files and covered in code.

## Anti-Patterns Found

None in Phase 9 surface. Phase-09 guard PASS, plus manual greps for `لا تفقد`, `countdown`, `setInterval`, `Dialog`, `Modal`, `framer-motion` inside `src/lib/renewal/` and `src/components/RenewalBanner*.{tsx,ts}` return zero matches.

Pre-existing Phase 7 guard failure (MilestoneBadge.tsx:16 JSDoc) is documented in `.planning/phases/09-renewal-prompts/deferred-items.md` and is explicitly out of Phase 9 scope per CLAUDE.md rule S2 (single-change).

## Human Staging Items (blocks "passed" promotion)

See `human_verification` frontmatter above — 9 items including:
1. Apply both migrations on staging + verify idempotency
2. Banner visibility sweep on `/`, `/program`, `/account` vs sacred paths
3. 48h dismiss persistence + 3-dismiss cap
4. Gateway-aware CTA routing for 4 gateway values
5. Auto-renew webhook → banner disappears (HMAC refresh)
6. Email/push dedup behavior against seeded staging rows
7. RTL + viewport check at 320/768/1240px + Lighthouse A11y ≥ 95
8. `renewal_prompted` fires exactly once per session via PostHog dashboard
9. No console errors / hydration warnings on banner mount across routes

## Gaps Summary

**No automated gaps.** All 5 ROADMAP Phase 9 success criteria verified at code + harness level. All 9 RENEW REQs satisfied in code. Zero banned anti-patterns in Phase 9 surface. Integration harness 32/32 green, guard clean, zero new npm dependencies. The phase is correctly flagged `status: human_needed` — the residual work is the 13-step human-verify checkpoint (Task 3 of 09.07-PLAN) which requires a live staging environment + real browser + PostHog dashboard inspection.

---

_Verified: 2026-04-18_
_Verifier: Claude (gsd-verifier)_
