# Phase 7: Cycle 2 Transition + Day-28 Badge (merged) — Context

**Gathered:** 2026-04-19
**Status:** Ready for planning
**Source:** Milestone research + Phase 6 foundation. The synthesizer flagged Phase 7 for `/gsd:research-phase` (timezone + race condition spike) — that will happen inside the plan-phase workflow.

<domain>
## Phase Boundary

A user who saves the Day-28 reflection sees an Arabic-native "واصل الرحلة" CTA **inside the same flow** (no navigation away, no modal interrupting reflection input), can advance to cycle 2 with one tap, and the Day-28 badge unlocks silently as part of the moment — no separate achievement modal, no tonal mismatch.

This phase merges two feature areas (Cycle 2 Transition + Day-28 Badge) because they occupy the same emotionally-weighted screen and their tones must be unified (per FEATURES.md research).

Phase deliverables:
- Day-28 in-app CTA within the Day-28 completion view (no modal, no nav-away)
- `/api/program/start-cycle` gets an optimistic-concurrency guard against multi-device races
- Cycle 2 uses the **same 28 verses** (Headspace deeper-practice model — verse selection unchanged, cycle number incremented). Decision locked in REQUIREMENTS.md.
- Day-28 `badge` row written idempotently (UNIQUE `user_id + badge_code + cycle_number`) as part of the cycle transition — no separate "unlocked!" modal
- `cycle_start` analytics event fires server-side (extends Phase 6's `emitEvent` contract)
- Timezone-safe day boundary: `Asia/Riyadh` hardcoded via `Intl.DateTimeFormat` so a user activating at 23:00 returns at 06:00 still on the correct day
- Anti-pattern ban enforced: no confetti, no fireworks, no "unlocked!" / "achievement" English-loan vocabulary, no auto-advance modal, no streak continuation UI

</domain>

<decisions>
## Implementation Decisions

### Scope (locked in REQUIREMENTS.md)
- All 7 RETURN-* REQs (RETURN-01..07) are in scope.
- Cycle 2 content: **same 28 verses, deeper practice** (REQUIREMENTS.md decision #1).
- Badge 7 on Day 28 is part of this phase (not Phase 8). Phase 8 handles the other 5 milestones (days 1/3/7/14/21 + cycle-completion badge).

### Technical approach
- Schema change: add column `progress.cycle_paused_at timestamptz` for race-guard (two-step migration: additive, then enforce).
- Schema change: create `badges` table (`user_id`, `badge_code`, `cycle_number`, `unlocked_at`, `notified`) with `UNIQUE(user_id, badge_code, cycle_number)`.
- `/api/program/start-cycle`: add an optimistic concurrency check using `.eq("current_cycle", expected)` in the update. Returns 409 on race (client disables CTA after first tap).
- `cycle_start` event fires from `/api/program/start-cycle` success with `{new_cycle_number, prior_cycle_days_completed, tier}` — typed in Phase 6's events.ts.
- Day boundary via `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" })` — consistent with current `calendarDay.ts` pattern (verify before implementing).
- Cycle 2 CTA rendered inside `DayExperience.tsx` when `day === 28 && completed` — no new route.
- Badge unlock is **silent** — no modal, no toast. The badge appears on `/progress` after transition.

### Privacy + analytics
- `cycle_start` + `badge_unlock` events must come from existing `emitEvent` helper (Phase 6 contract).
- Property whitelist enforced by Phase 6 CI grep — any new prop must pass `assertAllowedProperties()`.
- NO client-side emission. NO session recording. NO autocapture triggered by cycle transition.

### Banned anti-patterns (subset of SUMMARY.md R4 — every plan's `<out_of_scope>` must include)
- Confetti on Day 28 (celebration animation OK via framer-motion, but no particle shower)
- Fireworks / emoji cascades
- "Unlocked!" / "Achievement" English-loan vocabulary
- Multi-step cycle-2 wizard
- Auto-advance to cycle 2 the moment Day 28 saves (user MUST tap CTA)
- Streak continuation UI ("🔥 28 days streak!")
- "You're in the top X% of users" comparison
- Separate badge modal on Day 28 (must be silent inside cycle transition)
- Share button on the badge (private-by-default per REQUIREMENTS.md decision #6)

### Claude's Discretion
- Exact wording of "واصل الرحلة" CTA copy (planner may propose 2-3 variants).
- Whether "cycle-completion" badge (for cycles 1/2/3) is inserted in this phase or deferred to Phase 8 (recommend: Phase 8, keep 7 focused on Day-28 only).
- Exact migration filename pattern.

</decisions>

<canonical_refs>
## Canonical References

Downstream planner + executor MUST read these before writing plans or code.

### Milestone research (authoritative)
- `.planning/research/SUMMARY.md` — §R1 (referrals storage), §R4 (anti-patterns), §"Reconciled Phase Order" (Phase 7 rationale for merge)
- `.planning/research/FEATURES.md` — Cycle 2 Transition + Milestone Badges sections (table stakes / differentiators / anti-features)
- `.planning/research/ARCHITECTURE.md` — §"Phase 7" integration notes
- `.planning/research/PITFALLS.md` — Pitfalls #1 (multi-device cycle race), #2 (silent fallback dead-end), #3 (timezone drift)

### Phase 6 outputs (direct dependencies)
- `src/lib/analytics/events.ts` — TypedEvent union includes `cycle_start` + `badge_unlock` variants (types already defined)
- `src/lib/analytics/server.ts` — `emitEvent()` helper (ANY server event in Phase 7 MUST go through this)
- `scripts/guards/analytics-privacy.js` — CI will block if a `track()` call lands in sacred paths; don't try to work around

### Project rules
- `CLAUDE.md` — RTL (rule #4), no new deps (rule #6), S-rules for safe edits
- `.planning/REQUIREMENTS.md` — RETURN-01..07 (7 REQs this phase must deliver)
- `.planning/ROADMAP.md` — Phase 7 section (goal + 5 success criteria + banned anti-patterns)
- `docs/analytics-event-catalog.md` — Phase 7 owns `cycle_start` + Day-28 `badge_unlock` (emit locations documented)

### Code touchpoints (will be modified/extended)
- `src/app/api/program/start-cycle/route.ts` — add optimistic concurrency + `emitEvent("cycle_start")`
- `src/components/DayExperience.tsx` — add Day-28 CTA inline, add badge unlock on cycle-start success
- `src/lib/taamun-content.ts` — `PROGRESSION_MILESTONES` already has day 28; no content change
- `supabase/migrations/20260419_v1_2_retention.sql` (NEW) — adds `badges` table + `progress.cycle_paused_at` column
- `src/components/badges/MilestoneBadge.tsx` (NEW) — Day-28 SVG variant (other 5 variants land in Phase 8)

</canonical_refs>

<specifics>
## Specific Ideas

- ROADMAP success criterion #3 is the race-condition test: "A user who taps the CTA on phone AND laptop within 5 seconds ends up with `current_cycle = 2` and exactly one `cycle_start` PostHog event — never duplicates." This is the single load-bearing automated test.
- Day 28 is the product's highest-stakes moment — any UI regression here breaks the "قلبي يتشرب معاني" validation. Treat copy changes with extreme care.
- The existing `start-cycle` route has a "graceful fallback" (CONTEXT-referenced) that silently resets to cycle 1 on DB error — Phase 7 must narrow this to only fire on `error.code === '42703'` (undefined column) per PITFALLS #2.

</specifics>

<deferred>
## Deferred Ideas

- Cycle 2 with AI-generated content (v1.1 Phase 3) — explicitly OUT of scope for Phase 7 per REQUIREMENTS.md decision #1. Applies only to cycles 4+.
- Cycle-completion badge for cycles 1/2/3 — deferred to Phase 8 (cleaner separation of concerns).
- Cycle pause feature (e.g., user can pause cycle on travel) — not in v1.2 scope.
- Cycle preview / "what's different in cycle 2?" screen — recommend deferral to v1.3.

</deferred>

---

*Phase: 07-cycle-2-transition*
*Context gathered: 2026-04-19 (milestone research is authoritative)*
