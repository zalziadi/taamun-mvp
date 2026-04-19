---
phase: 07
status: human_needed
verified_at: 2026-04-19
verified_by: gsd-verifier
score: 5/5 criteria code-verified; 3/5 require real-device confirmation before rollout
automated_results:
  integration_harness: 31/31 pass
  calendarDay_vitest: 13/13 pass
  guard_phase_07: pass (zero banned patterns)
  package_json_diff: scripts-only (zero new runtime deps)
re_verification: false
human_verification:
  - test: "Inline CTA renders without modal/nav-away"
    expected: "After saving Day-28 awareness selection, 'واصل الرحلة' section fades in INLINE below the reflection area. No Dialog/Modal opens. No route change. CTA remains tappable, RTL-correct on iOS Safari + Android Chrome."
    why_human: "Visual + flow judgment; framer-motion rendering + RTL glyph-joining can only be confirmed on real devices at 3 viewport widths"
  - test: "Day-28 badge appears on /progress silently after cycle transition"
    expected: "Right after tapping 'واصل الرحلة', user lands on Day-1 of cycle 2. No toast / modal / achievement popup fired during the transition. Navigating to /progress shows the 'عتبة الثامن والعشرين' badge rendered, cycle-1 attributed. No animation of a new badge 'arriving'."
    why_human: "Requires an authenticated session with completed_days=[1..28] in Supabase, tapping the real CTA, and visual inspection of /progress. Harness proves the DB row + event invariant but not the rendered UI."
  - test: "Multi-device race (phone + laptop within 5s)"
    expected: "User with completed_days=[1..28] on cycle 1. Phone taps 'واصل الرحلة' and laptop taps within 5s. One device lands on Day-1/cycle-2 (200), the other device shows the 'تم بدء الحلقة من جهاز آخر. حدّث الصفحة' state (409). Exactly one badges row, exactly one cycle_start in PostHog, exactly one badge_unlock in PostHog."
    why_human: "Real concurrent-device race cannot be reproduced in the in-memory harness; requires two authenticated clients hitting the live /api/program/start-cycle"
  - test: "Timezone boundary on real Vercel deployment"
    expected: "User activated around 2026-03-01 23:00 Asia/Riyadh (= 20:00 UTC). Querying /api/program/progress at 2026-03-29 06:00 Asia/Riyadh (= 03:00 UTC) returns current_day=28, not 27."
    why_human: "Vitest proves the unit; staging proves the whole stack (Vercel runtime TZ, serverless cold start, Supabase clock) honors Asia/Riyadh end-to-end"
  - test: "NFR-02 a11y on Day-28 view with CTA rendered"
    expected: "Lighthouse mobile a11y ≥ 95 (existing 100). Keyboard Tab reaches CTA; focus ring visible; aria-busy announces 'جارٍ البدء...' during submitting state; aria-disabled respected by screen readers."
    why_human: "Lighthouse + VoiceOver/TalkBack audit cannot be scripted here"
---

# Phase 7: Cycle 2 Transition + Day-28 Badge — Verification Report

**Phase Goal:** A user who saves Day-28 reflection sees an Arabic-native "واصل الرحلة" CTA inside the same flow, can advance to cycle 2 with one tap, and the Day-28 badge unlocks silently — no separate achievement modal, no tonal mismatch.

**Verified:** 2026-04-19
**Status:** `human_needed` — all 5 ROADMAP success criteria are **code-verified** against the actual implementation + 31/31 integration assertions pass + anti-pattern guard clean + zero new runtime deps. What remains is staging/real-device confirmation for the 3 criteria whose last mile is visual/behavioral (CTA render, badge surface, concurrent-device race). No gaps, no regressions.

**Re-verification:** No — initial verification.

---

## Goal Achievement — 5 ROADMAP Success Criteria

| # | Criterion (from ROADMAP.md Phase 7) | Verdict | Evidence (file:line) |
|---|---|---|---|
| 1 | "واصل الرحلة" CTA on Day-28 inline — no modal, no nav-away | ✓ VERIFIED (code); ? HUMAN (visual) | `src/components/DayExperience.tsx:466–527` — inline `<motion.section>` wrapped in `<AnimatePresence>`, gated by `day === 28 && isCompleted`; `isCompleted = progress?.completed_days?.includes(28) ?? false` (line 328); `framer-motion` only (line 4) — no `Dialog`/`Modal`/`Drawer`; copy = "واصل الرحلة" (line 510). Guard Check 3 in `scripts/guards/phase-07-anti-patterns.sh:124` structurally blocks regression. |
| 2 | One-tap advance to Day 1 of cycle 2, SAME 28 verses (Headspace model) | ✓ VERIFIED | `src/app/api/program/start-cycle/route.ts:99–111` — `.update({ completed_days: [], current_day: 1, current_cycle: targetCycle, completed_cycles: newArchive, cycle_paused_at: ... })`. Verse content is pulled by day number from `taamun-content.ts` via `getDay(day)` — cycle increment does not change which verse renders for a given day. Harness Scenario 1 assertions (integration.mjs:510–551): `payload.cycle === 2`, `DB current_cycle === 2`, `DB current_day === 1`, `DB cycle_paused_at set`. |
| 3 | Multi-device race (phone + laptop within 5s) → `current_cycle=2` + exactly ONE `cycle_start` event | ✓ VERIFIED (harness); ? HUMAN (staging) | `src/app/api/program/start-cycle/route.ts:77–82` — early read-side race-check returns 409 without mutation. Lines 108–123: write-side guard via `.eq("current_cycle", expectedCurrentCycle).select()` + zero-row check returns second 409. `emitEvent("cycle_start", ...)` sits at line 200 — AFTER mutation + AFTER `unlockBadge` — so neither 409 path emits. Client echoes `expected_current_cycle` (`DayExperience.tsx:340`). Harness Scenario 2 (integration.mjs:554–631, 7 assertions): `[200, 409]` pair + loser attributed ZERO events via X-Invocation header. |
| 4 | Day-28 badge on /progress after transition — NO separate achievement modal | ✓ VERIFIED (code); ? HUMAN (visual) | `src/lib/badges/unlock.ts:65–124` — idempotent upsert with `onConflict: "user_id,badge_code,cycle_number", ignoreDuplicates: true`; emits `badge_unlock` only when `data.length > 0`. Called from `start-cycle/route.ts:177` BEFORE `cycle_start` emit (line 200). `MilestoneBadge.tsx:59–112` is pure SVG + HTML span, no hooks/fetch/effects, no share action, no next/og. UNIQUE constraint at `supabase/migrations/20260419000000_v1_2_badges_and_cycle_guard.sql:54`. Guard Check 4 (guards/phase-07:137–142) blocks `next/og`/`ImageResponse` on badge surface. Harness Scenarios 1+3: single row + single event + silent duplicate. |
| 5 | 23:00 Asia/Riyadh day 27 → 06:00 next day returns Day 28 (no UTC drift) | ✓ VERIFIED (unit); ? HUMAN (staging) | `src/lib/calendarDay.ts:21–47` — `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", ... })` extracts YYYY-MM-DD in Riyadh TZ, then midnight-to-midnight diff. `src/lib/calendarDay.test.ts:68–77` — load-bearing ROADMAP-#5 vector: `computeCalendarDay("2026-03-01T20:00:00Z", new Date("2026-03-29T03:00:00Z"))` → `28`. Plus boundary tests at lines 79–95. All 13 vitest cases pass. |

**Score:** 5/5 criteria verifiable by code-inspection + automation. Of those, criteria 1, 3, 4, 5 have a final last-mile that can only be confirmed on real devices/staging — itemized in `human_verification:` frontmatter.

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `supabase/migrations/20260419000000_v1_2_badges_and_cycle_guard.sql` | badges table + cycle_paused_at + UNIQUE constraint + RLS | ✓ VERIFIED | Exists; lines 36–37 add `cycle_paused_at` nullable; lines 43–55 create `badges` with `UNIQUE (user_id, badge_code, cycle_number)`; lines 69–80 enable RLS with SELECT-only `users_select_own_badges` policy |
| `src/lib/calendarDay.ts` | Asia/Riyadh-anchored day math | ✓ VERIFIED | `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" })` at lines 27–33; `TOTAL_DAYS = 28` clamp preserved; no new deps |
| `src/lib/calendarDay.test.ts` | ROADMAP-#5 vector covered | ✓ VERIFIED | 13 test cases, load-bearing test at lines 68–77 |
| `src/app/api/program/start-cycle/route.ts` | race guard + cycle_start emit + unlockBadge call | ✓ VERIFIED | `expected_current_cycle` at line 39; early 409 at lines 77–82; write-side 409 at lines 119–122; narrowed 42703 fallback at lines 144–167; `unlockBadge` call at line 177 BEFORE `emitEvent("cycle_start")` at line 200 |
| `src/components/DayExperience.tsx` | inline Day-28 CTA, framer-motion only | ✓ VERIFIED | Lines 280–283 state shape; 305–325 progress fetch; 328 isCompleted derivation; 330–363 handler with `expected_current_cycle` echo + 409 → `raced` state; 466–527 inline `<motion.section>` |
| `src/components/badges/MilestoneBadge.tsx` | SVG-only, Arabic in HTML siblings, no share | ✓ VERIFIED | Pure presentational component; zero `<text>` nodes; no hooks; no fetch; Arabic copy in HTML `<span>` at lines 106 + 108 |
| `src/lib/badges/unlock.ts` | idempotent upsert, emit-only-on-insert | ✓ VERIFIED | `ignoreDuplicates: true` at line 90; `inserted = data.length > 0` at line 100; `emitEvent` fires only when `inserted === true` at lines 112–121 |
| `src/app/api/badges/unlock/route.ts` | Phase-7-scoped allow-list, delegates to helper | ✓ VERIFIED | `PHASE_7_ALLOWED_BADGE_CODES = new Set(["day_28"])` at line 26; thin auth+parse+delegate wrapper |
| `scripts/verify/phase-07-integration.mjs` | 31 assertions, 5 scenarios | ✓ VERIFIED | Re-run live: **31 passed, 0 failed** in ~80ms |
| `scripts/guards/phase-07-anti-patterns.sh` | sacred-path-scoped grep guard | ✓ VERIFIED | Re-run live: **PASS — zero banned patterns found**; 6 scoped checks |
| `package.json` scripts block | `guard:phase-07` + wired into `guard:release` | ✓ VERIFIED | Lines 15–17; diff against last v1.1 commit (694b0de) shows scripts-only changes, zero dependency edits |

---

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `DayExperience.tsx` (client) | `/api/program/progress` | `fetch("/api/program/progress", { cache: "no-store" })` | ✓ WIRED | Lines 306–321; result drives `isCompleted` (line 328) |
| `DayExperience.tsx` (client) | `/api/program/start-cycle` | `fetch("/api/program/start-cycle", { method: "POST", ... })` with `expected_current_cycle` echo | ✓ WIRED | Lines 335–342; 409 → `setCtaState("raced")`; 200 → `router.refresh()` |
| `/api/program/start-cycle/route.ts` | Supabase `progress` table | `getSupabaseAdmin().from("progress").update(...).eq("current_cycle", expectedCurrentCycle).select()` | ✓ WIRED | Lines 99–111 (conditional update); lines 126–135 (new-user insert) |
| `/api/program/start-cycle/route.ts` | `unlockBadge()` helper | `await unlockBadge(auth.user.id, "day_28", finishedCycle, 28)` | ✓ WIRED | Line 177; wrapped in defensive try/catch (lines 176–181) |
| `/api/program/start-cycle/route.ts` | `emitEvent("cycle_start")` | `void emitEvent({ name: "cycle_start", ... }, userId)` | ✓ WIRED | Lines 200–210; exactly one call site per `grep -c 'emitEvent('` in Plan 07.02 |
| `src/lib/badges/unlock.ts` | Supabase `badges` table | `.upsert(..., { onConflict: "user_id,badge_code,cycle_number", ignoreDuplicates: true }).select()` | ✓ WIRED | Lines 78–93 |
| `src/lib/badges/unlock.ts` | `emitEvent("badge_unlock")` | `await emitEvent(event, userId)` gated on `inserted === true` | ✓ WIRED | Lines 112–121; only fires on real insert |
| `src/app/api/badges/unlock/route.ts` | `unlockBadge()` helper | `await unlockBadge(auth.user.id, badge_code, cycle_number, day_number)` | ✓ WIRED | Lines 66–71 |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `DayExperience.tsx` Day-28 CTA | `progress.completed_days`, `progress.current_cycle` | `GET /api/program/progress` (live Supabase-backed) | Yes — reads real DB row | ✓ FLOWING |
| `/api/program/start-cycle` response | `{ ok, cycle, archived, completed_cycles }` | DB update result | Yes — actual mutation | ✓ FLOWING |
| `badges` row for Day-28 | `user_id, badge_code, cycle_number, unlocked_at` | `unlockBadge` upsert → `public.badges` | Yes — real DB insert | ✓ FLOWING |
| `cycle_start` PostHog event | `new_cycle_number, prior_cycle_days_completed, tier` | `profiles.subscription_tier` + current cycle math | Yes — real DB-derived props | ✓ FLOWING |
| `badge_unlock` PostHog event | `badge_code, day_number, cycle_number` | helper args | Yes — typed payload passes `assertAllowedProperties` | ✓ FLOWING |

---

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Integration harness exits 0 | `node scripts/verify/phase-07-integration.mjs` | **31 passed, 0 failed** — "Phase 7 integration invariants: OK" | ✓ PASS |
| Anti-pattern guard exits 0 | `bash scripts/guards/phase-07-anti-patterns.sh` | `[phase-07-guard] PASS — zero banned patterns found` | ✓ PASS |
| calendarDay unit tests pass | `npx vitest run src/lib/calendarDay.test.ts` | **Test Files 1 passed (1); Tests 13 passed (13)** | ✓ PASS |
| Zero new runtime deps since v1.1 | `git diff 694b0de -- package.json` | Only `scripts` block changed: added `lint:analytics-privacy`, `guard:phase-07`, wired into `guard:release`. `dependencies`/`devDependencies` UNCHANGED. | ✓ PASS |

---

## Requirements Coverage

| REQ | Description | Status | Evidence |
|---|---|---|---|
| RETURN-01 | Arabic-native "واصل الرحلة" CTA | ✓ SATISFIED | `DayExperience.tsx:510` button label; no English fallback |
| RETURN-02 | Idempotent + optimistic-concurrency via `cycle_paused_at` | ✓ SATISFIED | Column added (migration:36–37); `expected_current_cycle` guard + `.eq` write-side check (route:77–82, 108–123); harness Scenario 2 |
| RETURN-03 | Same 28 verses, deeper practice (Headspace) | ✓ SATISFIED | Only `current_cycle` increments; `getDay(day)` unchanged by cycle; heading copy "نفس الآيات، تعمّق أعمق" at DayExperience.tsx:477 |
| RETURN-04 | framer-motion only — no confetti/fireworks/unlocked! | ✓ SATISFIED | `import { AnimatePresence, motion } from "framer-motion"` (line 4); guard Check 1 + 2 scan for banned libs + vocab |
| RETURN-05 | Day-28 badge unlocks silently inside cycle transition | ✓ SATISFIED | `unlockBadge` called at route:177, no UI side-effect; `MilestoneBadge.tsx` has no hooks/effects/share; guard Check 3+4 block modals + next/og |
| RETURN-06 | Asia/Riyadh day boundary | ✓ SATISFIED | `calendarDay.ts:22` + `Intl.DateTimeFormat` at line 27; 13/13 tests pass including ROADMAP-#5 vector |
| RETURN-07 | Exactly-once `cycle_start` under race/reload | ✓ SATISFIED | Single `emitEvent` call site in start-cycle (route:200); single call site in unlock helper (unlock.ts:117); harness Scenarios 1–3 assert exactly-once |

**Orphaned requirements:** None. All 7 RETURN-* REQs from REQUIREMENTS.md are claimed by the 6 plans' frontmatter `requirements:` fields.

---

## Anti-Patterns Scan

| File | Finding | Severity |
|---|---|---|
| All Phase 7 artifacts | No `canvas-confetti` / `lottie` / `party-js` / `tsparticles` imports anywhere in `src/` | ✓ clean |
| Sacred paths | No `<Dialog>`/`<Modal>`/`<Drawer>`/`<Popover>` JSX | ✓ clean |
| Sacred paths | No `posthog.capture(` or client-side `track(` | ✓ clean |
| Badge surface | No `next/og` / `opengraph-image` / `ImageResponse` | ✓ clean |
| `DayExperience.tsx` | No `useEffect` auto-advancing to `/api/program/start-cycle` — advance only happens in click handler `handleStartCycle2` at line 330 (invoked by button onClick at line 500) | ✓ clean |
| Sacred-path vocab | No quoted `"Unlocked!"` / `"Achievement"` / `"Level Up"` / `"streak!"` / "🔥 N days streak" | ✓ clean |

Guard script (`scripts/guards/phase-07-anti-patterns.sh`) runs 6 scoped checks and exits 0 on current codebase. Wired into `guard:release` in `package.json:17`.

---

## Human Verification Required

Listed in `human_verification:` frontmatter — summary here:

1. **Inline CTA visual + RTL** — iOS Safari + Android Chrome, 3 viewports. Confirm fade-in is subtle, no layout shift, no modal/drawer opens.
2. **Badge appears on /progress silently** — authenticate as a user with `completed_days=[1..28]`, tap "واصل الرحلة", verify no toast/modal during transition, then navigate to `/progress` and confirm `عتبة الثامن والعشرين` is rendered with no animation of "arrival".
3. **Real multi-device race** — phone + laptop tap within 5s. Confirm one gets 200 → Day-1/cycle-2, other gets 409 → "تم بدء الحلقة من جهاز آخر" copy. PostHog shows exactly one `cycle_start` + one `badge_unlock`.
4. **Staging timezone** — activate test user at 2026-03-01 23:00 Asia/Riyadh, query at 06:00 next morning on live Vercel, confirm day 28.
5. **a11y score on Day-28 view** — Lighthouse mobile ≥ 95; keyboard Tab reaches CTA with visible focus ring; VoiceOver/TalkBack announces `aria-busy` and `aria-disabled` state transitions.

None of these are blockers for merge — all 31 harness assertions + 13 unit tests + guard-release all green. These are **pre-rollout checkpoints**.

---

## Gaps Summary

**No gaps.** Phase 7 ships all 5 ROADMAP success criteria at the code-structural level, backed by:
- 31/31 integration harness assertions proving happy path, multi-device race, idempotency, and narrowed DB-error fallback
- 13/13 vitest cases on calendarDay including the load-bearing ROADMAP-#5 vector
- Anti-pattern guard clean across 6 scoped checks
- Zero new runtime dependencies (scripts-only diff on `package.json`)
- All 7 RETURN-* REQs cited by plan frontmatter, each mapped to a concrete file:line

Residual items are real-device/staging confirmation, appropriate for a feature that ends in a visual + concurrency moment — documented as human verification.

---

_Verified: 2026-04-19_
_Verifier: Claude (gsd-verifier)_
