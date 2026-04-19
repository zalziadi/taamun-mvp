# Phase 11: Year-in-Review Archive — Context

**Gathered:** 2026-04-20
**Status:** Ready for planning (final v1.2 phase)
**Source:** Milestone research SUMMARY + REQUIREMENTS decisions #4-5.

<domain>
## Phase Boundary

A user with at least 30 days of reflections can visit `/year-in-review` and see a calm, archive-style retrospective of their Quranic journey — anchored to their **activation anniversary** (not Gregorian year). Eastern Arabic numerals on the page; Western Arabic on the `next/og` share card (broader compatibility). Type-enforced privacy on the share card — zero reflection text can leak outbound.

**Scope locked (REQUIREMENTS decision #4):** This phase is **archive-only**. The Ramadan annual moment (scarcity + push + seasonal design) is explicitly deferred to v1.3.

Phase deliverables:
- NEW `year_reviews` table — `user_id`, `year_key`, `payload jsonb`, `generated_at` — with UNIQUE (user_id, year_key). Stale-after-24h refresh (re-generate if `generated_at < now - 24h`).
- NEW Postgres RPC `get_year_in_review(user_id, year_key)` — aggregates from `reflections` + `awareness_logs` + `progress` + `badges`. Returns typed JSON.
- NEW `/year-in-review` page — Server Component, `requireUser()`. Calls RPC, caches snapshot in `year_reviews`.
- Graceful degradation for users with <365 days: label range by `earliest_to_latest` reflection dates.
- Hand-rolled SVG sparkline for awareness trajectory (NO chart library — CLAUDE rule #6).
- NEW `next/og` share card at `/year-in-review/og/route.tsx` — Latin numerals, zero personal content (type-enforced split).
- `year_review_opened` + `year_review_shared` events via Phase 6 emitEvent.
- Numerals: Eastern Arabic (٠١٢٣) on page body, Western (0123) on share card.
- TypeScript type split: `YIRPublicStats` (counts, averages, day numbers) vs `YIRPrivateContent` (reflection text, emotion labels, guide messages). Share card route TYPED to accept only `YIRPublicStats` — compiler enforces privacy.

</domain>

<decisions>
## Implementation Decisions

### Scope (locked in REQUIREMENTS.md)
- 12 YIR-* REQs. YIR-10 = documented deferral marker (Ramadan annual moment → v1.3).
- Minimum data threshold: 30 days of reflections (if fewer, page shows "ارجع لاحقاً" gentle message).
- "Year" anchored to **activation anniversary** — `year_key` is computed as `YYYY_anniversary` from `profiles.activation_started_at` (or fallback `created_at`). Hijri + Gregorian both displayed on page.

### Technical approach
- Snapshot cache pattern: on `/year-in-review` visit, check `year_reviews` row for `(user_id, current_year_key)`. If fresh (<24h) → render from payload. If stale → regenerate via RPC, upsert row.
- Payload shape (`YIRPublicStats`): `{ reflections_count, awareness_avg, milestones_reached, cycle_count, earliest_reflection_at, latest_reflection_at, awareness_trajectory: number[] }`. NO reflection text, NO emotion labels.
- RPC `get_year_in_review` runs in Postgres — much faster than client-side aggregation of 365 reflections.
- Index check: `reflections(user_id, created_at)` must exist for fast range queries. Verify via grep in existing migrations; if missing, add in this phase's migration.

### Privacy + analytics
- `year_review_opened` event fires server-side when page loads successfully with props `{ year_key, reflections_count }` — NEVER reflection content.
- `year_review_shared` fires when user taps share button.
- Share card content-free by policy (like Phase 10 OG): no user name, no reflection text, only aggregate numbers + verse quote.
- Type-split at compile time: `YIRPublicStats` and `YIRPrivateContent` live in separate exports; share card's `route.tsx` can only import `YIRPublicStats`.

### Banned anti-patterns (SUMMARY §R4)
- Spotify-Wrapped copycat (no "you listened to X more minutes than Y%")
- Ranked insights / "top 3" framing
- Public-by-default (must be opt-in share only)
- Reflection text aggregated into share card (privacy bleed — type-enforced block)
- "Your year was 🔥" gamification

### Claude's Discretion
- Exact visual layout of archive page (proposed: calm vertical scroll — hero anchor verse → reflections count → awareness sparkline → milestones list → badges grid → share link)
- Share card font stack (Latin-only — no Arabic via Satori, same reasoning as Phase 10 OG)
- Exact SVG sparkline dimensions + styling

</decisions>

<canonical_refs>
## Canonical References

### Milestone research
- `.planning/research/SUMMARY.md` — §"Table-Stakes" (YIR: dual-layer, Hijri anchor), §R4 (anti-patterns)
- `.planning/research/FEATURES.md` — §Year-in-Review (Reflection.app always-on + Spotify Wrapped annual moment; Ramadan anchor)
- `.planning/research/PITFALLS.md` — #10 YIR privacy bleed (type-enforced split), #8 Arabic glyph on OG (defer)

### Phase 6-10 dependencies
- `src/lib/analytics/events.ts` — `year_review_opened` + `year_review_shared` TypedEvents
- `src/lib/analytics/server.ts` — `emitEvent()`
- Phase 7 `badges` table + Phase 8 backfill — badges counted in YIR
- Phase 10 `/account/referral/og` — pattern for next/og share card (edge runtime, code-gated, zero personal)
- `src/lib/hijri.ts` (if exists — for Hijri date display)
- `src/lib/calendarDay.ts` — Asia/Riyadh helper

### Code touchpoints
- `supabase/migrations/{TIMESTAMP}_v1_2_year_reviews.sql` (NEW) — year_reviews table + get_year_in_review RPC + indexes
- `src/lib/yearInReview/types.ts` (NEW) — YIRPublicStats + YIRPrivateContent type split
- `src/lib/yearInReview/aggregate.ts` (NEW) — wrapper around RPC call + cache check
- `src/app/year-in-review/page.tsx` (NEW) — Server Component
- `src/app/year-in-review/og/route.tsx` (NEW) — next/og share card
- `src/components/YearInReviewArchive.tsx` (NEW) — main content component
- `src/components/AwarenessTrajectory.tsx` (NEW) — hand-rolled SVG sparkline
- `docs/analytics-event-catalog.md` — Phase 11 owns year_review_* events

</canonical_refs>

<specifics>
## Specific Ideas

- Activation anniversary is the key innovation — generic calendar years feel corporate; anniversary feels personal ("your year of Quranic practice started 2026-04-18").
- Minimum viable page: hero verse + big reflections_count + sparkline + badges grid + share button. Five sections vertical scroll.
- Share card: anchored verse + "سنتي مع القرآن" header + reflections_count (Western numerals) + zero personal content.

</specifics>

<deferred>
## Deferred Ideas

- **Ramadan annual moment** — out of scope per REQUIREMENTS decision #4; lands in v1.3
- **Full Arabic fonts on OG share card** — same Satori font-fetch latency reason as Phase 10; v1.3 evaluation
- **Push notification tying YIR to anniversary day** — deferred
- **Longitudinal comparison ("year 1 vs year 2")** — only viable after users hit 2 years; irrelevant for v1.2 cohort
- **Email digest of YIR** — deferred (avoid notification fatigue after v1.1 email automation)

</deferred>

---

*Phase: 11-year-in-review*
*Context gathered: 2026-04-20 (final v1.2 phase)*
