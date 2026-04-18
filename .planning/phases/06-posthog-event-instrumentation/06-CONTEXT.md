# Phase 6: PostHog Event Instrumentation — Context

**Gathered:** 2026-04-19
**Status:** Ready for planning
**Source:** Milestone-level research (no phase-specific discuss needed — see SUMMARY.md §"Research-Phase Flags": Phase 6 → ⏭️ SKIP).

<domain>
## Phase Boundary

Wire the 8 core retention events server-side so every subsequent v1.2 phase (Cycle 2, Badges, Renewal, Referral, YIR) has measurable funnels without a single tracking pixel touching a reflection page. Foundation phase — no product-facing UI changes, only instrumentation plumbing + CI guardrails + pageview wiring.

Phase deliverables:
- Server-side event emission helpers that wrap the existing `src/lib/analytics.ts` PostHog client
- 8 core events: `day_complete`, `cycle_start`, `badge_unlock`, `renewal_prompted`, `referral_code_generated`, `referral_code_redeemed`, `year_review_opened`, `year_review_shared`
- App Router pageview tracker — Suspense-wrapped `usePathname()` + `useSearchParams()` hook — with privacy exclusion list
- CI grep lint rule banning `track()` / `posthog.capture(` in sacred paths and property names on the banned list
- Event property type definitions (TypeScript)
- Property whitelist enforcement

</domain>

<decisions>
## Implementation Decisions

### Scope
- All 12 ANALYTICS-* REQs from REQUIREMENTS.md are in scope for this phase.
- No UI work. No new product features. Pure instrumentation + CI.
- Events fire **server-side** from existing `/api/program/*` success handlers (not client-side from inside DayExperience etc.).

### Technical approach (locked in milestone research)
- **No new dependencies** — `posthog-js@1.278.0` and `src/lib/analytics.ts` already exist.
- **Server-side emission model:** use `fetch` to PostHog Capture API (`POST https://app.posthog.com/capture/`), NOT `posthog-node`.
- **Pageview tracker:** new `src/components/PageviewTracker.tsx` wrapped in `<Suspense>` (React 18 CSR bailout constraint); mounted inside `src/components/AnalyticsProvider.tsx`.
- **Privacy exclusions enforced by CI grep**, not just documentation (PROJECT.md principle #4).

### Privacy exclusions (paths)
Zero `track()` / `posthog.capture(` calls inside:
- `src/app/day/**`
- `src/app/reflection/**`
- `src/app/book/**`
- `src/app/program/day/**`
- AI guide routes (`/api/guide/**`, `/guide/**`)

### Privacy exclusions (components)
Zero `track()` calls inside:
- `DayExperience.tsx`
- `ReflectionJournal.tsx`
- `AwarenessMeter.tsx`
- `BookQuote.tsx`
- `VerseBlock.tsx`
- `HiddenLayer.tsx`
- `SilenceGate.tsx`

### Property whitelist
Banned property-name patterns: `*_email`, `*_phone`, `reflection_*`, `verse_*`, `journal_*`, `message_*`, `prayer_*`.
Allowed: `day_number`, `cycle_number`, `milestone_code`, `badge_code`, `referral_code_prefix`, `renewal_days_remaining`, `gateway`, `tier`.

### PostHog config constraints
- `person_profiles: "never"` must be preserved in `src/lib/analytics.ts`.
- `capture_pageview: false` must be preserved (pageview handled by our custom tracker with exclusion list).
- Zero session recording, zero heatmaps, zero autocapture on intimate components.

### Claude's Discretion
- Exact wrapper signature for the server-side emit helper (proposed: `emitEvent(eventName, userId, properties)`).
- Test file naming + location for CI guard tests.
- Whether pageview exclusions live in `src/lib/analytics.ts` or a separate config file.

</decisions>

<canonical_refs>
## Canonical References

Downstream planner + executor MUST read these before writing plans or code.

### Milestone research (authoritative for Phase 6)
- `.planning/research/SUMMARY.md` — reconciled research, §R5 "PostHog exclusions (concrete list)"
- `.planning/research/STACK.md` — §"PostHog Event Instrumentation" (SDK already installed, wrapper already in `src/lib/analytics.ts`, pageview tracker needs `<Suspense>` per React 18)
- `.planning/research/ARCHITECTURE.md` — §"PostHog instrumentation integration"
- `.planning/research/PITFALLS.md` — pitfalls #24 (PII leakage), #25 (sacred-page tracking), #28 (quota exhaustion)

### Project rules
- `CLAUDE.md` — rule #4 (RTL), rule #6 (no new deps), S-rules for safe edits
- `.planning/PROJECT.md` — principle #4 (no tracking on prayer/reflection pages — non-negotiable)
- `.planning/REQUIREMENTS.md` — ANALYTICS-01..12 (12 REQs this phase must deliver)
- `.planning/ROADMAP.md` — Phase 6 section (goal + success criteria + banned anti-patterns)

### Code touchpoints (will be modified/extended)
- `src/lib/analytics.ts` — existing PostHog wrapper; add server-side emit helper + property whitelist check
- `src/components/AnalyticsProvider.tsx` — existing init component; mount new PageviewTracker
- `src/app/api/program/progress/route.ts` — will emit `day_complete` on success

</canonical_refs>

<specifics>
## Specific Ideas

- Success criterion #3 is load-bearing: "Opening DevTools Network tab on `/day/7`, `/reflection/*`, `/book/*` shows ZERO requests to posthog.com — even on long sessions." The CI grep rule must be build-breaking, not advisory.
- PostHog free tier: 1M events/month. Budget: <10 events/user/day × 1,500 users × 30 days = 450K/month — fits with headroom.
- The 4 v1.2 events that will exist before later phases emit them (`cycle_start`, `badge_unlock`, `renewal_prompted`, `referral_code_*`, `year_review_*`) are defined here as typed interfaces but their actual call sites will land in Phases 7-11. This phase wires only `day_complete` as proof-of-emission.

</specifics>

<deferred>
## Deferred Ideas

- Server-side PostHog via `posthog-node` package — rejected in STACK.md (no new deps; `fetch` suffices).
- PostHog session recording / heatmaps — permanently out of scope (PROJECT.md privacy principle).
- Cookie consent banner — not required for KSA-first audience; revisit in v1.3 if EU traffic becomes material.

</deferred>

---

*Phase: 06-posthog-event-instrumentation*
*Context gathered: 2026-04-19 (milestone research is authoritative — no phase-specific discuss needed)*
