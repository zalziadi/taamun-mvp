---
phase: 10-referral-program
verified: 2026-04-20T00:00:00Z
status: human_needed
score: 5/5 automated must-haves verified — human staging verification required
re_verification: false
automated_checks:
  guard_phase_10: pass
  test_phase_10: 67/67 pass
  analytics_privacy: pass (465 files)
  tsc_noemit: pass
  no_new_deps: confirmed (package.json diff shows scripts only)
  refer_04_invariant: pass (zero executable activation_codes writes in referral paths)
human_verification:
  - test: "Visit /account/referral as a signed-in user, confirm a unique FRIEND-XXXXXX code renders, then share via WhatsApp primary / Instagram / copy-link and confirm the wa.me prefilled text contains the code + domain"
    expected: "Code visible, monospace gold; WhatsApp deep link opens with Arabic da'wah text + ?ref={code} suffix; copy label swaps to 'تم النسخ'"
    why_human: "Visual appearance, RTL correctness, WhatsApp/IG deep-link behavior in real OS, OG crawler preview rendering"
  - test: "With two staging accounts A+B, have A share code, B redeem via /api/activate, then wait for day-14 progress and confirm cron credit extends A.expires_at by 30d AND referrals.status='rewarded'"
    expected: "B gets free month immediately (profiles.expires_at ≈ now+30d, via='friend_referral'); A unchanged until day-14 milestone; after cron run, A.expires_at extended, one row rewarded"
    why_human: "End-to-end timing requires real Supabase + cron invocation + real user progress writes — proven in harness but staging is the contract check"
  - test: "Attempt self-referral: sign in as A, generate FRIEND-XXX, then try to redeem it on the same account"
    expected: "409 self_referral_forbidden from app layer (DB CHECK referrals_no_self_referral is backstop); no profile mutation"
    why_human: "Confirms both app-layer guard + DB CHECK fire together on the real PG instance"
  - test: "Generate 3 rewarded referrals for one account within the calendar year, attempt a 4th POST /api/referral/create"
    expected: "4th returns 429 annual_cap_reached; if the 4th invitee does redeem a previously-minted code, cron marks that row status='void' and A.expires_at unchanged"
    why_human: "Cap enforcement across create-time + credit-time needs real DB state"
  - test: "Simulate invitee refund within 14 days (manage-subscriptions cron flips subscription_status='expired' OR expires_at shortens), run credit cron"
    expected: "creditOneReferral returns 'refunded', referrals.status='refunded', referrer.expires_at untouched"
    why_human: "Depends on cron-vs-cron schedule interaction and real subscription_status writes"
  - test: "OG crawler probe: request /account/referral/og?code=FRIEND-TESTAB, confirm 1200×630 ImageResponse renders without personal content"
    expected: "200 image, Latin-only layout, no auth required, invalid code → safe fallback image (no 400)"
    why_human: "Edge runtime + next/og rendering; must be smoked with a real HTTP request and image inspection"
---

# Phase 10: Referral Program — Verification Report

**Phase Goal (from ROADMAP.md):** Convert "قلبي يتشرب معاني" advocacy into growth — each user can generate `FRIEND-*` invite code; both invitee and referrer get a free month; self-referral / refund-keep-reward / MLM tiers closed by design; copy reads as da'wah, not affiliate marketing.

**Verified:** 2026-04-20
**Status:** human_needed (all automated invariants pass; staging smoke-test required before Ziad sign-off)
**Re-verification:** No — initial verification

## Goal Achievement — 5 ROADMAP Success Criteria

| # | Criterion | Status | File:line evidence |
|---|-----------|--------|--------------------|
| 1 | User generates unique FRIEND-XXXX code — shareable via WhatsApp (primary) / IG (secondary) / copy (fallback) | ✓ VERIFIED | `src/lib/referral/generate.ts:40` (`FRIEND_CODE_REGEX = /^FRIEND-[0-9A-HJKMNP-TV-Z]{6}$/`); `src/app/api/referral/create/route.ts:161` (mint + emit); `src/components/ReferralPanel.tsx:7-8,143,153,155,165` (3 share channels + da'wah heading). Harness scn 1 = 13/13 pass. |
| 2 | Invitee redeems → free month immediately; referrer credited ONLY after invitee day-14 | ✓ VERIFIED | `src/app/api/activate/route.ts:45` (FRIEND branch); profile upsert with `tier='monthly'`, row → `pending_day14`. Cron `src/lib/referral/credit.ts:163-258` (`creditOneReferral`) extends referrer `profiles.expires_at` by 30d only when `isInviteeEligible` returns `day14_reached` AND cap ≤ 3. Harness scn 2 (18 checks) + scn 3 (7 checks) PASS. |
| 3 | Self-referral blocked at DB CHECK | ✓ VERIFIED | `supabase/migrations/20260422000000_v1_2_referrals.sql:66-67` (`CONSTRAINT referrals_no_self_referral CHECK (invitee_id IS NULL OR referrer_id <> invitee_id)`); app-layer 409 backstop at `src/app/api/activate/route.ts:74`. Harness scn 4 = 8/8 PASS (both layers exercised). |
| 4 | 4th referral in year → cap triggered | ✓ VERIFIED | `src/app/api/referral/create/route.ts:81-107` (UTC year-boundary cap query, `status='rewarded'` only, 429 at 3); `src/lib/referral/credit.ts:132-157` (`yearlyRewardedCount` cap re-check at credit time → `outcome='capped'` + row `status='void'`). Harness scn 6 = 9/9 PASS. |
| 5 | Invitee refund within 14d → referrer reward voided | ✓ VERIFIED | `src/lib/referral/credit.ts:51-82` (`isInviteeEligible`: `subscription_status='expired'` OR `expires_at < redeemed+14d` → `'refunded'`); `creditOneReferral` marks `status='refunded'` + NO `profiles.update`. Harness scn 5 = 5/5 PASS. |

**Score: 5/5 truths automated-verified.** Staging smoke-test still required for OS-level share flow + cron-against-real-DB — see human_verification frontmatter.

## Required Artifacts

| Artifact | Exists | Substantive | Wired | Status |
|----------|--------|-------------|-------|--------|
| `supabase/migrations/20260422000000_v1_2_referrals.sql` | ✓ (7.2 KB) | ✓ (table + 2 CHECKs + UNIQUE + RLS + 3 indexes) | ✓ (admin writes via service role) | VERIFIED |
| `src/lib/referral/generate.ts` | ✓ | ✓ (Crockford b32 + collision retry) | ✓ (imported by create route + activate + harness) | VERIFIED |
| `src/lib/referral/credit.ts` | ✓ | ✓ (isInviteeEligible + yearlyRewardedCount + creditOneReferral) | ✓ (called by cron route + harness) | VERIFIED |
| `src/app/api/referral/create/route.ts` | ✓ | ✓ (reuse-or-mint + cap + emit) | ✓ (invoked by ReferralPanel mount) | VERIFIED |
| `src/app/api/referral/list/route.ts` | ✓ | ✓ (whitelist projection excludes `invitee_id`) | ✓ (invoked by ReferralPanel mount) | VERIFIED |
| `src/app/api/activate/route.ts` (FRIEND branch) | ✓ | ✓ (130-line branch, 3 REFER-07 guards) | ✓ (redemption entry point) | VERIFIED |
| `src/app/api/cron/credit-referrals/route.ts` | ✓ | ✓ (Bearer gate + .limit(500) + per-row loop) | ✓ (vercel.json schedule `0 23 * * *`) | VERIFIED |
| `src/app/account/referral/page.tsx` | ✓ | ✓ (Server Component + requireUser redirect) | ✓ (renders ReferralPanel) | VERIFIED |
| `src/components/ReferralPanel.tsx` | ✓ (8.8 KB) | ✓ (3 share branches + status list + da'wah heading) | ✓ (calls create + list APIs) | VERIFIED |
| `src/app/account/referral/og/route.tsx` | ✓ (4.5 KB) | ✓ (1200×630 ImageResponse, edge runtime, safe fallback) | ✓ (WhatsApp/OG crawler target) | VERIFIED |
| `scripts/test-phase-10-integration.mjs` | ✓ (43 KB) | ✓ (7 scenarios, 67 assertions) | ✓ (wired via npm `test:phase-10`) | VERIFIED |
| `scripts/guards/phase-10-anti-patterns.sh` | ✓ (15 KB) | ✓ (5 buckets × 11 checks) | ✓ (wired via npm `guard:phase-10` and `guard:release`) | VERIFIED |

## Key Link Verification

| From | To | Via | Status |
|------|-----|-----|--------|
| ReferralPanel.tsx | /api/referral/create (POST) | `fetch('/api/referral/create')` on mount | WIRED |
| ReferralPanel.tsx | /api/referral/list (GET) | `fetch('/api/referral/list')` on mount | WIRED |
| /api/referral/create | generateUniqueFriendCode | `import { generateUniqueFriendCode }` | WIRED |
| /api/activate (FRIEND branch) | `public.referrals` UPDATE | admin `.from("referrals").update({status:'pending_day14'})` | WIRED |
| /api/cron/credit-referrals | creditOneReferral | imported + called in per-row loop | WIRED |
| vercel.json | /api/cron/credit-referrals | `"schedule": "0 23 * * *"` | WIRED |
| guard:release | guard:phase-10 | package.json chain | WIRED |

## Requirements Coverage — 12 REFER REQs

| REQ | Claimed by | Evidence | Status |
|-----|------------|----------|--------|
| REFER-01 | 10.02/03/04/05 | generate.ts + create route + redeem branch + /account/referral | ✓ SATISFIED |
| REFER-02 | 10.01 | new `public.referrals` table (not activation_codes extension) | ✓ SATISFIED |
| REFER-03 | 10.04/06 | invitee immediate month + day-14 gated referrer credit | ✓ SATISFIED |
| REFER-04 | 10.06/08 | zero `activation_codes` executable writes in referral paths (grep confirmed, guard enforces) | ✓ SATISFIED |
| REFER-05 | 10.06/08 | sync credit inside cron loop; C-async guard forbids `webhook\|queue.add\|enqueue` | ✓ SATISFIED |
| REFER-06 | 10.03/06 | annual cap at create (429) + credit-time re-check → `void` | ✓ SATISFIED |
| REFER-07 | 10.01/04 | DB CHECK `referrals_no_self_referral` + app-layer 409 | ✓ SATISFIED |
| REFER-08 | 10.06 | isInviteeEligible refund heuristic → `status='refunded'`, no profile.update | ✓ SATISFIED |
| REFER-09 | 10.05/07 | WhatsApp-primary + IG + copy + OG share card | ✓ SATISFIED |
| REFER-10 | 10.05/08 | "ادعُ للتمعّن" heading present; A-copy/A-vocab/A-gami guards pass | ✓ SATISFIED |
| REFER-11 | 10.05 | status labels `بانتظار البدء`/`في الطريق`/`تمّت الهدية`/`أُلغيت`; silent-delivery guard C-notify | ✓ SATISFIED |
| REFER-12 | 10.01/03/04 | RLS SELECT-only policies + service-role mutations | ✓ SATISFIED |

No orphaned requirements. All 12 REFER REQs claimed by at least one plan.

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Anti-pattern guard | `npm run guard:phase-10` | `PASS — zero banned patterns found` | ✓ PASS |
| End-to-end harness | `npm run test:phase-10` | `67 passed, 0 failed (of 67)` | ✓ PASS |
| No new runtime deps | `git diff main -- package.json` | Only scripts added; no dependencies/devDependencies diff | ✓ PASS |
| REFER-04 invariant | Grep `activation_codes` in credit.ts + cron route | Only JSDoc ban documentation; zero executable writes | ✓ PASS |
| Analytics prefix-only | Grep `referral_code_prefix` in create + activate | Literal `"FRIEND"`; no full code interpolation | ✓ PASS |

## Anti-Patterns Found

None. 5-bucket × 11-check guard returns clean on current HEAD. Regression-insurance proven 5× per 10.08-SUMMARY §Regression-Insurance Evidence.

## Human Staging Verification Required

See frontmatter `human_verification` block. Six staging smokes cover the dimensions automated tests cannot validate:
1. Real WhatsApp/IG deep-link OS behavior + RTL appearance
2. End-to-end A→B credit against real Supabase
3. Self-referral DB CHECK firing on live PG
4. Annual cap across both create + credit paths with real rows
5. Refund cron-interaction with manage-subscriptions
6. OG crawler image response via real HTTP

## Gaps Summary

No code gaps. Plans 10.01–10.08 collectively close all 5 ROADMAP success criteria and all 12 REFER REQs with:
- A dedicated `public.referrals` table (not an activation_codes extension)
- Strict DB-level self-referral CHECK + app-layer defense-in-depth 409
- Prefix-only analytics contract (`referral_code_prefix: "FRIEND"` literal)
- Direct `profiles.expires_at` extension as reward (REFER-04 invariant grep-enforced)
- Synchronous credit + day-14 retention gate + refund void + annual cap re-check
- Da'wah copy framing with 5-bucket regression guard
- Zero new runtime dependencies (NFR-08 preserved)

Phase 10 is automated-complete and awaits human staging sign-off before marking the ROADMAP row `Complete`.

---

*Verified: 2026-04-20*
*Verifier: Claude (gsd-verifier)*
