# Phase 9 — Deferred Items

## Pre-existing issues discovered during Plan 09.07 verification (NOT caused by Phase 9)

### 1. phase-07 guard false-positive on MilestoneBadge.tsx JSDoc

- **Where**: `src/components/badges/MilestoneBadge.tsx` line 16
- **Content**: `* - No English-loan vocabulary for milestones ("Unlocked!", "Achievement").`
- **Git blame**: introduced in commit `044a3ce` (Plan 08.01, 2026-04-19) — predates Phase 9.
- **Why the phase-07 guard trips**: the JSDoc line contains the literal quoted string `"Unlocked!"` which matches the phase-07 vocab pattern. Phase 07 guard has NO comment-line carve-out (Phase 08 guard added one; Phase 09 guard copied that).
- **Phase 09 scope**: OUT. Plan 09.07 is forbidden from touching phase-07 guard or badge components (unrelated to renewal surface).
- **Recommended fix (future plan)**: backport the Phase 8/9 `grep -v CARVE_OUT` comment-line skip into `scripts/guards/phase-07-anti-patterns.sh` Check 2.
- **Interim workaround for Plan 09.07**: executed the individual Phase 9 invariants independently — phase-09 harness 32/32 PASS, phase-09 guard PASS on current codebase, phase-09 regression-insurance PASS, tsc clean, analytics-privacy clean. The full `guard:release` chain is blocked by this pre-existing item; release readiness requires the backport.

### 2. Pre-existing HMAC entitlement bug (documented in 09.06-SUMMARY.md)

- **Where**: `src/lib/entitlement.ts` — `verifyEntitlementToken` splits on `:` which corrupts colon-containing ISO `expiresAt` values.
- **Status**: Workaround in 09.06 tests (colon-free YYYY-MM-DD dates). Same workaround applied in Plan 09.07 harness Scenario F.
- **Scope**: Out of Phase 9 remit; file separate bug-fix plan.
