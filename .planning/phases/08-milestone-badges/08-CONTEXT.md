# Phase 8: Milestone Badges (days 1/3/7/14/21 + cycle-completion) — Context

**Gathered:** 2026-04-19
**Status:** Ready for planning
**Source:** Milestone research (SUMMARY.md §"Research-Phase Flags" — Phase 8 → ⏭️ SKIP) + Phase 7 foundation.

<domain>
## Phase Boundary

Five private milestone badges (days 1, 3, 7, 14, 21) plus one cycle-completion badge per cycle become visible on `/progress` as the user crosses each threshold — and existing customers (the day-9 advocate, for example) see their already-earned badges retroactively on deploy day **WITHOUT** 5 push notifications firing, without animations, without retroactive PostHog events.

Phase 7 shipped Day-28 (the final milestone). Phase 8 backfills the rest.

Phase deliverables:
- 5 new `MilestoneBadge` SVG variants: `day_1`, `day_3`, `day_7`, `day_14`, `day_21`
- 1 new variant: `cycle_complete` (for cycles 1/2/3)
- Server-side unlock trigger evaluated on `reflections` save — fires `unlockBadge(userId, "day_N", currentCycle, N)` when the user completes a milestone day
- Cycle-completion badge fires when user finishes day 28 (same moment as start-cycle transition in Phase 7 — add `cycle_complete_N` call alongside `day_28`)
- **Retroactive backfill migration** for existing users — on deploy day, seed `badges` rows for every user whose `reflections.day_number` crosses a milestone in their current/past cycles, with `notified=true` and `unlocked_at` reconstructed from `MIN(reflections.created_at)`. ZERO PostHog events fire on backfill.
- `/progress` page shows badge grid (unlocked + locked states, no modal on click)

</domain>

<decisions>
## Implementation Decisions

### Scope (locked in REQUIREMENTS.md)
- All 9 BADGE-* REQs (BADGE-01..09) — note: BADGE-01 decision #3 locked "7 badges per cycle (6 milestones + cycle-completion)". Phase 7 shipped day_28; Phase 8 ships days 1/3/7/14/21 + cycle_complete = 6 more badges per cycle.
- Cap at cycle 3 for v1.2 (BADGE-01 scope).

### Technical approach
- Badge schema already exists (Phase 7 migration: `badges` table with `UNIQUE(user_id, badge_code, cycle_number)`).
- Reuse Phase 7's `unlockBadge()` helper from `src/lib/badges/unlock.ts` — idempotent on unique violation.
- Reuse Phase 7's `MilestoneBadge.tsx` component — add 6 new SVG variants.
- Unlock trigger location: `src/app/api/reflections/route.ts` (POST handler where user saves a day's reflection). On save success, check if `day ∈ {1, 3, 7, 14, 21}` and call `unlockBadge(userId, "day_N", currentCycle, day)`.
- Cycle-completion badge: wire into Phase 7's `/api/program/start-cycle` success path, alongside the existing `unlockBadge(... "day_28" ...)` call. Add `unlockBadge(userId, "cycle_complete", finishedCycle, 28)`.

### Retroactive backfill (the hard part)
- New migration file: `supabase/migrations/{TIMESTAMP}_v1_2_badge_backfill.sql`.
- Uses a SQL statement that INSERTs into `badges` from a SELECT over `reflections + progress` — computes every (user_id, "day_N", cycle) combination the user already completed.
- `notified = true` + `unlocked_at` = `MIN(reflections.created_at)` for that (user, day, cycle) tuple.
- `ON CONFLICT DO NOTHING` to be idempotent.
- CRITICAL: the backfill MUST NOT call `emitEvent()` — it's a raw SQL insert, server-side, zero code path.
- Migration is two-step: additive INSERT only, no destructive changes.

### Privacy + analytics
- `badge_unlock` event fires from `unlockBadge()` ONLY on fresh insert (Phase 7 contract preserved).
- Backfill inserts with `notified=true` → future `unlockBadge()` calls on the same (user, badge, cycle) are no-ops (idempotent).
- NO push notification fires retroactively. Existing push subscription logic in v1.1 Phase 2 only triggers on explicit API calls, not migration inserts.

### Banned anti-patterns (subset of SUMMARY.md R4)
- Badge unlock modal / toast when user crosses a milestone mid-cycle (silent reveal on `/progress` only)
- "Unlocked!" / "Achievement" English-loan vocabulary
- Animated unlock celebration (no framer-motion confetti; a subtle fade-in on first view of `/progress` after unlock is acceptable)
- Share button on badge (private-by-default per REQUIREMENTS.md decision #6)
- Rarity tiers / progress bars ("3 of 6 unlocked — 50%!")
- Retroactive `badge_unlock` events for existing users (backfill MUST set `notified=true`)

### Claude's Discretion
- Exact SVG artwork for each badge variant (6 icons — planner proposes visual direction; minimalist SVG only, no external asset)
- Whether `cycle_complete` badge fires for cycle 0 (the trial) — recommend: NO (only cycles 1/2/3)
- Exact naming for the backfill migration file

</decisions>

<canonical_refs>
## Canonical References

### Milestone research (authoritative for Phase 8)
- `.planning/research/SUMMARY.md` — §"Table-Stakes · Differentiators · Anti-Features" → Milestone Badges section
- `.planning/research/FEATURES.md` — §Milestone Badges (private by default, Headspace model, no share)
- `.planning/research/PITFALLS.md` — #4 retroactive badge event-spam on deploy (load-bearing for backfill)

### Phase 7 outputs (direct dependencies)
- `src/lib/badges/unlock.ts` — `unlockBadge()` helper (reuse, do not modify)
- `src/components/badges/MilestoneBadge.tsx` — pure SVG component (add 6 new variants)
- `src/app/api/badges/unlock/route.ts` — thin wrapper (reuse if needed for client-triggered unlocks; Phase 8 uses server-side triggers only)
- `src/app/api/program/start-cycle/route.ts` — cycle-completion call site (Phase 7 file; Phase 8 adds ONE line to invoke cycle_complete unlock)
- `supabase/migrations/20260419000000_v1_2_badges_and_cycle_guard.sql` — badges table shape (reuse; no schema change in Phase 8)

### Project rules
- `CLAUDE.md` — RTL, no new deps, S-rules
- `.planning/REQUIREMENTS.md` — BADGE-01..09 (9 REQs this phase must deliver)
- `.planning/ROADMAP.md` — Phase 8 section (goal + success criteria + banned anti-patterns)
- `docs/analytics-event-catalog.md` — Phase 8 owns `badge_unlock` emissions for the 6 new badge codes

### Code touchpoints
- `src/app/api/reflections/route.ts` — POST handler gets badge-trigger logic (milestone day check)
- `src/app/api/program/start-cycle/route.ts` — add `cycle_complete` unlock alongside day_28
- `src/components/badges/MilestoneBadge.tsx` — 6 new SVG variants
- `src/app/progress/page.tsx` or equivalent — badge grid display (unlocked + locked states)
- `supabase/migrations/{TIMESTAMP}_v1_2_badge_backfill.sql` (NEW)
- `src/lib/taamun-content.ts` — `PROGRESSION_MILESTONES` already exports [1, 3, 7, 14, 21, 28] — use this as source of truth

</canonical_refs>

<specifics>
## Specific Ideas

- **The day-9 customer ("قلبي يتشرب معاني") test**: on deploy day, she opens the app. She should see days 1, 3, 7 badges already unlocked, zero notifications, zero toasts, zero unlock animations. She keeps her existing session state. The grid on `/progress` just reveals three more icons compared to yesterday.
- Silent reveal over time: when a user unlocks a new badge mid-cycle (e.g., day 14), the badge is silently inserted into the `badges` table — the user sees it next time they visit `/progress`. No interruption, no push, no modal. The badge grid itself can have a first-view subtle fade-in animation on previously-unseen badges (framer-motion, ≤ 600ms, no particles).
- Milestone list: `[1, 3, 7, 14, 21, 28]` — but 28 is Phase 7's. This phase handles `[1, 3, 7, 14, 21]` + cycle_complete.

</specifics>

<deferred>
## Deferred Ideas

- Badge sharing (permanently out — private by default)
- Badge rarity / tiers (permanently out — anti-gamification)
- Cross-cycle badge variations (e.g., "day_7" looks different in cycle 2) — recommend defer to v1.3
- Badge descriptions / hover states with philosophical content — recommend defer (scope creep)

</deferred>

---

*Phase: 08-milestone-badges*
*Context gathered: 2026-04-19*
