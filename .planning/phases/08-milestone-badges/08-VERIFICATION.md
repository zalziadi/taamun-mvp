---
phase: 08-milestone-badges
verified: 2026-04-18T00:00:00Z
status: human_needed
score: 5/5 automated criteria verified; 2 require human device sign-off
re_verification: null
human_verification:
  - test: "Real-device RTL badge rendering"
    expected: "Badge SVGs render correctly on iOS Safari + Android Chrome; Arabic glyph joining in 'عتبة البداية' etc. is continuous (no disconnection); Eastern-Arabic numerals render in HTML spans below each badge; no mirrored glyph bug"
    why_human: "SVG/HTML glyph rendering on real mobile browsers cannot be verified by grep or headless CI. Plan 08.06 explicitly lists this as the human-verify checkpoint."
  - test: "End-to-end Day-7 save → silent reveal on /progress"
    expected: "Save a Day-7 reflection in the live app; confirm NO toast/modal/notification fires in the reflection flow; navigate to /progress; confirm the day_7 badge appears at full opacity with subtle fade-in, while day_14/day_21 remain dim"
    why_human: "Framer-motion fade-in timing + absence of notification surfaces can only be felt on a real device; grep only confirms structural absence of modal/toast code."
---

# Phase 8: Milestone Badges — Verification Report

**Phase Goal (ROADMAP):** Five private milestone badges (days 1/3/7/14/21) plus one cycle-completion badge per cycle become visible on `/progress` as the user crosses each threshold — and existing customers see retroactively earned badges without 5 push notifications firing on deploy day.

**Verified:** 2026-04-18
**Status:** human_needed (all automated invariants PASS; device + tone sign-off pending per Plan 08.06)
**Re-verification:** No — initial verification.

---

## Goal Achievement

### Observable Truths (5 ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | **Day-7 reflection save → badge visible on /progress, no toast** | VERIFIED (server wiring) / human-needed (visual fade) | `src/app/api/reflections/route.ts:110-126` guards on `PROGRESSION_MILESTONES` then calls `void unlockBadge(user.id, code, cycle, day)`; response payload unchanged (line 237-250 contains no badge/unlocked field). Integration Scenario A passes 10/10 (1 badges row + 1 event, silent response). `src/components/badges/BadgeGrid.tsx:71-95` reads via RLS-scoped SELECT on mount. |
| 2 | **Day-9 customer sees retroactive badges; ZERO events fired** | VERIFIED | `supabase/migrations/20260420000000_v1_2_badge_backfill.sql` — 5 pure-SQL `INSERT ... ON CONFLICT DO NOTHING` statements; every row sets `notified = true` (lines 46-145). No trigger/pg_net/NOTIFY/application code. Integration Scenario B passes 10/10: day-9 user gets day_1/day_3/day_7 at cycle 1 (not day_5/day_9 non-milestones), all `notified=true`, **ZERO badge_unlock events**, re-apply is no-op. |
| 3 | **Idempotency on duplicate saves** | VERIFIED | `src/lib/badges/unlock.ts:101-133` upserts with `ignoreDuplicates: true` on `onConflict: "user_id,badge_code,cycle_number"`, then gates emitEvent on `Array.isArray(data) && data.length > 0`. DB-level UNIQUE constraint (Phase 7 migration). Integration Scenarios A+D+C all confirm 1 row + 1 event across duplicate/multi-device saves. |
| 4 | **No share / next/og / social export on badges** | VERIFIED | Grep of `src/components/badges/` and `src/app/progress/` for `next/og|ImageResponse|opengraph|onShare|navigator.share|share-card` returns ZERO matches. `BadgeGrid.tsx` contains zero `<button>`, `onClick`, `<Dialog>`, `<Modal>`. Private-posture chip "خاصة بك — لا تُشارَك" at `BadgeGrid.tsx:144`. `scripts/guards/phase-08-anti-patterns.sh` Check 2 enforces structurally and passes. |
| 5 | **RTL correctness on /progress** | VERIFIED (structural) / human-needed (real-device glyph check) | `MilestoneBadge.tsx:418` wraps in `<div dir="rtl">`; SVG contains zero `<text>` nodes (grep-verified in 08.01-SUMMARY); Arabic copy rendered as HTML `<span>` siblings (lines 435-439); Eastern-Arabic numerals via `Intl.DateTimeFormat("ar-SA-u-nu-arab")` in BadgeGrid (line 206). `BadgeGrid.tsx:138` wraps section in `dir="rtl"`. Real-device glyph-joining confirmation needs human per Plan 08.06. |

**Score:** 5/5 automated; 2 truths (#1 fade animation feel, #5 real-device glyphs) flagged for human sign-off per Plan 08.06 Task 3.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/badges/MilestoneBadge.tsx` | 7-variant SVG renderer | VERIFIED | 443 lines; BadgeCode union lines 28-35 exports all 7 codes; `renderSvgBody` switch (lines 66-400) covers every variant; `dir="rtl"` wrapper; zero `<text>` in SVG; no hooks/fetch/framer-motion. |
| `src/components/badges/BadgeGrid.tsx` | Private grid on /progress | VERIFIED | 214 lines; `"use client"`; Supabase RLS-scoped SELECT; opacity-only motion; private chip; capped at 3 cycles; silent-degrade on guest/error (`return null`). |
| `src/lib/badges/unlock.ts` | Widened 7-code helper | VERIFIED | `BadgeCode` union exported (lines 64-71); `unlockBadge` body unchanged, data-driven idempotency; single `emitEvent` call guarded on fresh-insert (line 142); never-throws contract. |
| `src/app/api/reflections/route.ts` | Milestone unlock trigger | VERIFIED | Import line 12-13; PROGRESSION_MILESTONES guard line 110; fire-and-forget `void unlockBadge(...)` at line 125; no payload field added; no push/toast/track. |
| `src/app/api/program/start-cycle/route.ts` | day_28 + cycle_complete unlocks | VERIFIED | Sequential awaits at lines 183-184 inside try/catch; emitEvent("cycle_start") at line 207 preserves Phase 7 "unlock-before-emit" invariant. |
| `src/app/progress/page.tsx` | BadgeGrid integrated | VERIFIED | Import at line 24; `{status === "ok" && <BadgeGrid />}` at line 283; gated to authenticated server-backed state (no flash on guest). |
| `supabase/migrations/20260420000000_v1_2_badge_backfill.sql` | Retroactive backfill | VERIFIED | 5 INSERT sections; all `ON CONFLICT DO NOTHING`; every row `notified = true`; zero triggers/pg_net/NOTIFY/ALTER/DROP. |
| `scripts/verify/phase-08-integration.mjs` | 40 checks | VERIFIED | Executed — 40/40 pass in <1s. |
| `scripts/guards/phase-08-anti-patterns.sh` | Anti-pattern guard | VERIFIED | Executed — `[phase-08-guard] PASS — zero banned patterns found`. |
| `package.json` | guard chain extension | VERIFIED | `guard:phase-08` script at line 17; chained into `guard:release` after `guard:phase-07` (line 18). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `POST /api/reflections` | `badges` table | `void unlockBadge(user.id, code, cycle, day)` | WIRED | Line 125; guarded by PROGRESSION_MILESTONES; fire-and-forget so it never blocks response. |
| `POST /api/program/start-cycle` | `badges` table (day_28 + cycle_complete) | `await unlockBadge(...)` × 2 | WIRED | Lines 183-184; awaited inside try/catch; sequential so failures are local. |
| `BadgeGrid` (client) | `badges` table | Supabase browser client SELECT with RLS | WIRED | Lines 71-75; scoped by `eq("user_id", authData.user.id)` under RLS policy `users_select_own_badges`. |
| Backfill migration | `badges` table | Pure SQL INSERT with ON CONFLICT DO NOTHING | WIRED | 5 sections; `notified=true` on every row; structurally incapable of triggering emitEvent. |
| `/progress` page | `BadgeGrid` component | `status === "ok"` gated render | WIRED | Line 283; only renders when server-backed timeline load succeeded (prevents guest flash). |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `BadgeGrid` | `rows` | `supabase.from("badges").select(...).eq("user_id", ...)` | Yes — live Supabase table populated by unlock helper + backfill migration | FLOWING |
| `MilestoneBadge` | `code`, `unlocked` | Props from BadgeGrid (live row lookup via `unlockedMap`) | Yes | FLOWING |
| `/api/reflections` unlock | `code`, `cycle`, `day` | `PROGRESSION_MILESTONES` const + `progress.current_cycle` DB read + request `day` | Yes — all real sources | FLOWING |
| `/api/program/start-cycle` unlock | `finishedCycle` | Derived from DB `progress` row (`targetCycle - 1`) | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Integration harness (40 invariants) | `node --experimental-strip-types scripts/verify/phase-08-integration.mjs` | `40 passed, 0 failed` | PASS |
| Anti-pattern guard | `bash scripts/guards/phase-08-anti-patterns.sh` | `[phase-08-guard] PASS` | PASS |
| Phase 7 guard (no regression) | Prior SUMMARY states clean | Not re-run here; integration Scenario C asserts Phase 7 `cycle_start` exactly-once invariant preserved | PASS (inferred) |
| package.json guard chain wired | `grep guard:phase-08 package.json` | script + chain entry both present | PASS |
| No new runtime deps | `git diff HEAD~10 HEAD -- package.json` | Only scripts changed; no `dependencies`/`devDependencies` diff | PASS |

### Requirements Coverage

| REQ | Description | Status | Evidence |
|-----|-------------|--------|----------|
| BADGE-01 | 7 badges per cycle (1/3/7/14/21/28 + cycle_complete), cap at cycle 3 | SATISFIED | All 7 variants in MilestoneBadge + BADGE_CODES_IN_ORDER + cycle cap via `Math.min(3, ...)` at BadgeGrid.tsx:107. |
| BADGE-02 | UNIQUE(user_id,badge_code,cycle_number) | SATISFIED | Phase 7 migration; reused data-driven idempotency; Scenarios A+D assert. |
| BADGE-03 | Inline SVG (no PNG/Lottie) | SATISFIED | MilestoneBadge is pure SVG; no `<img>`, no lottie imports. |
| BADGE-04 | Private by default (no share) | SATISFIED | Zero `next/og|onShare|navigator.share` in badges/progress trees; guard enforces. |
| BADGE-05 | Server-side trigger | SATISFIED | `/api/reflections:125` fires from Route Handler (not client). |
| BADGE-06 | Idempotent | SATISFIED | Scenarios A+D confirm 1 row/1 event. |
| BADGE-07 | Retroactive backfill, zero events | SATISFIED | Pure-SQL migration with `notified=true`; Scenario B asserts zero events. |
| BADGE-08 | Grid on /progress with locked+unlocked states | SATISFIED | BadgeGrid renders unlocked opaque + locked at 0.4 opacity × `opacity-40 grayscale`. |
| BADGE-09 | No modal/toast interrupt | SATISFIED | Response payload unchanged; no push; guard enforces; Scenario A asserts silent. |

All 9 BADGE REQs pass. Zero ORPHANED requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/badges/MilestoneBadge.tsx` | 16 | `"Unlocked!", "Achievement"` inside JSDoc documenting the ban | INFO | Intentional — it's the comment-line carve-out the phase-08 guard explicitly honors via `grep -v ':[[:space:]]*\*'`. No runtime impact. |

No Warning or Blocker anti-patterns. Zero matches for: confetti/lottie/canvas-confetti/framer-motion-spring imports in badges, next/og, OpenGraph, streak emojis, "N of M unlocked" progress copy, or push-notification calls in `src/lib/badges/`.

### Human Verification Required

#### 1. Real-device RTL glyph check

**Test:** Load `/progress` on iOS Safari + Android Chrome while signed in as a user with at least one unlocked badge.
**Expected:** Arabic badge names ("عتبة البداية" etc.) render with joined glyphs (no disconnection between letters); Eastern-Arabic numerals (١/٣/٧/١٤/٢١/٢٨/◯) render in HTML spans under each badge; no mirrored/flipped glyphs.
**Why human:** Real-device text-shaping engines can't be validated by grep/CI.

#### 2. End-to-end Day-7 silent-reveal feel

**Test:** In the live app, save a Day-7 reflection; observe the reflection completion flow; then navigate to `/progress`.
**Expected:** No toast, modal, push notification, or tonal interruption during save; on `/progress` the day_7 badge appears at full opacity with a subtle 600ms fade; unearned badges remain dim without any "unlock soon" messaging.
**Why human:** Framer-motion timing and the absence of notification channels require subjective device feel; structural grep only proves code absence.

### Gaps Summary

No structural gaps. The only outstanding items are Plan 08.06's deferred human-verify Task 3 (device + tone sign-off). All automated deliverables — 40-check integration harness, anti-pattern guard wired into guard:release, retroactive backfill migration, server-side triggers for days 1/3/7/14/21 + cycle_complete, private BadgeGrid — are structurally complete and verified.

Cross-cutting confirmations:
- Zero new runtime deps (package.json diff shows only script additions).
- `notified=true` + `ON CONFLICT DO NOTHING` + pure SQL (no triggers/pg_net) enforced in backfill migration.
- 40/40 integration checks PASS; phase-08 guard PASS; guard:release chain extended and wired.

### Deferred / Known Flags (carried from plan SUMMARYs)

1. **08.03 cap-at-cycle-3 guard** — planner recommendation is "no guard; DB mirrors semantics"; Ziad-flag. Does not block Phase 8 goal.
2. **08.04 section-5 over-backfill edge case** — theoretical only (start-cycle gates archival on `completed_days.includes(28)`); ON CONFLICT DO NOTHING makes a corrective migration safe later.
3. **Pre-existing `guard:brand` failure** — documented in `deferred-items.md`; pre-existed at commit 6ac844d; unrelated to Phase 8.

---

_Verified: 2026-04-18_
_Verifier: Claude (gsd-verifier)_
