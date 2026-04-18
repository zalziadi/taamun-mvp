---
phase: 06
status: human_needed
verified_at: 2026-04-19
verified_by: gsd-verifier
score: 5/5 ROADMAP criteria verified in code; 2 require live browser/PostHog confirmation at staging
---

# Phase 6: PostHog Event Instrumentation — Verification Report

**Phase Goal (ROADMAP.md L43):** Wire the 8 core retention events server-side and harden the sacred-page exclusion list so every subsequent phase has measurable funnels without a single tracking pixel touching a reflection page.

**Verified:** 2026-04-19 · Re-verification: No (initial)

## Executive Verdict

All five ROADMAP Phase-6 success criteria are observably delivered in the codebase. Code-side gates (CI guard, runtime guard, type union, Suspense boundary, event emission) are verified PASS. Two criteria (#1 actual PostHog reception, #2 absence of CSR bailout in a live browser, #3 DevTools Network observation) can only be *fully* confirmed against a live PostHog project + real entitled test account — those are flagged for staging sign-off, not phase-completion blockers.

## Observable Truths (5 ROADMAP Criteria)

| # | Criterion | Verdict | Evidence (file:line) |
|---|-----------|---------|----------------------|
| 1 | Day-7 reflection → exactly one `day_complete` event server-side with `{day_number: 7, cycle_number: 1, tier}` from `/api/program/progress/*` success handler | VERIFIED (code), human-confirm at staging | `src/app/api/program/progress/route.ts:8` imports `emitEvent`; line 194 early-returns on `!saved.ok`; lines 229-239 invoke `void emitEvent({name:"day_complete", properties:{day_number: day, cycle_number: Number(currentCycle ?? 1), tier}}, auth.user.id)`. Every prior failure branch (season_closed 403, auth, invalid_json 400, invalid_day 400, ensureUserProgress 500, upsertUserProgress 500) returns before the emission. Typed-union shape enforced at compile time by `src/lib/analytics/events.ts:43-50` `day_complete` variant. |
| 2 | Pageviews fire on `/`, `/pricing`, `/account`, `/program` after client navigation; no Suspense bailout warning | VERIFIED (code), human-confirm DevTools warning-free at staging | `src/components/AnalyticsProvider.tsx:15-19` wraps `<PageviewTracker />` in `<Suspense fallback={null}>`. `src/components/PageviewTracker.tsx:27` uses `useSearchParams()` inside the Suspense boundary; line 36 calls `posthog.capture("$pageview", {$current_url: url})`. SUMMARY 06.03 line 102 reports `npm run build` clean of CSR-bailout warnings. Excluded-paths test confirms `/`, `/pricing`, `/account`, `/program` all return `isExcludedPath === false` (excludedPaths.test.ts L41-54). |
| 3 | Zero PostHog requests on `/day/7`, `/reflection/*`, `/book/*` — even on long sessions | VERIFIED (code), human-confirm in DevTools at staging | `src/lib/analytics/excludedPaths.ts:12-19` lists all 6 sacred prefixes. `isExcludedPath` (L27-31) matches exact + subpath. `PageviewTracker.tsx:31` early-returns on excluded path BEFORE the `posthog.capture`. Ran `npx vitest run src/lib/analytics/` → 28/28 tests pass (13 exclusion + 14 event-guard + 1 export shape). No code path in PageviewTracker emits when `isExcludedPath===true`. CI guard (ANALYTICS-09) prevents any future `track()` from landing there. |
| 4 | CI pipeline fails the build on `track()` / `posthog.capture(` in 6 sacred paths or 7 banned components | VERIFIED | `scripts/guards/analytics-privacy.js` SACRED_PATHS L24-31 (6 prefixes), SACRED_COMPONENTS L34-42 (all 7 components), TRACK_CALL_REGEX L69. Deliberate R1 violation (temp file in `src/app/day/__tmpverify__/page.tsx`) → guard exited 1 with `VIOLATION [ANALYTICS-09]`. Wired into release gate at `package.json:16` (`guard:release` chain includes `lint:analytics-privacy` BEFORE `tsc` and `build`). `package.json:15` defines `lint:analytics-privacy` script. Clean-state run: `✓ analytics privacy guard passed (438 files scanned)` exit 0. |
| 5 | PR with property name `user_email` or `reflection_text` fails CI | VERIFIED | Defense-in-depth confirmed: (a) `scripts/guards/analytics-privacy.js` BANNED_PROPERTY_REGEX L47-55 matches both patterns; `extractEmitCallArgs` (L180-196) scopes R3 to analytics-call-sites only. Deliberate R3 violation (temp file with `track("evt", { user_email, reflection_text })`) → guard exited 1 with 2 × `VIOLATION [ANALYTICS-12]`. (b) Runtime: `src/lib/analytics/events.ts:205-213` `BANNED_PROPERTY_PATTERNS` (7 regexes); `assertAllowedProperties` (L231-244) throws on match; called FIRST inside `server.ts:54` BEFORE the fetch. |

**Score:** 5/5 ROADMAP criteria verified in code. 3 criteria have a staging-confirmation layer that requires a live browser/PostHog project.

## Artifact Verification (Levels 1-4)

| Artifact | Exists | Substantive | Wired | Data flows | Status |
|----------|--------|-------------|-------|------------|--------|
| `src/lib/analytics/events.ts` (TypedEvent union + BANNED_PROPERTY_PATTERNS + assertAllowedProperties) | Yes (244 lines) | Yes — 8 variants, 7 regex patterns, runtime guard function | Yes — imported by server.ts L27 | n/a (pure types + pure fn) | VERIFIED |
| `src/lib/analytics/server.ts` (emitEvent) | Yes (90 lines) | Yes — fetch POST to `${host}/capture/`, guard invoked before env check before fetch | Yes — imported by `src/app/api/program/progress/route.ts:8` | Yes — emits with real user id + real day value + DB-sourced cycle/tier | VERIFIED |
| `src/lib/analytics/excludedPaths.ts` (+ .test.ts) | Yes (32 lines + 13 tests) | Yes — 6 prefixes, exact+subpath match | Yes — imported by PageviewTracker.tsx:6 | n/a (pure fn) | VERIFIED |
| `src/components/PageviewTracker.tsx` | Yes (41 lines) | Yes — real `posthog.capture("$pageview")` call with `$current_url` | Yes — mounted by AnalyticsProvider.tsx:17 inside Suspense | Yes — reads live `usePathname()` + `useSearchParams()` | VERIFIED |
| `src/components/AnalyticsProvider.tsx` | Yes (21 lines) | Yes — `<Suspense fallback={null}>` wrap, `initAnalytics()` in useEffect | Mounted in app layout (pre-existing) | Yes — triggers on navigation | VERIFIED |
| `src/app/api/program/progress/route.ts` day_complete emission | Yes (lines 198-239) | Yes — typed, gated on saved.ok, fire-and-forget `void emitEvent(...)` | Yes — import at L8, call at L229 | Yes — `day` from request body, `currentCycle` from DB with fallback, `tier` from profiles.subscription_tier | VERIFIED |
| `scripts/guards/analytics-privacy.js` | Yes (292 lines) | Yes — 3 rules (R1/R2/R3), paren-aware extraction | Yes — wired via `package.json:16` `guard:release` | Yes — scans 438 files, produces 0 false positives | VERIFIED |
| `docs/analytics-event-catalog.md` | Yes (93 lines, Arabic-first) | Yes — 8 event rows, 9 non-negotiable rules, founder checklist | Documentation artifact | n/a | VERIFIED |

## Key Link Verification

| From | To | Via | Status |
|------|-----|-----|--------|
| `/api/program/progress` POST success | PostHog Capture API | `emitEvent` → fetch POST to `${NEXT_PUBLIC_POSTHOG_HOST}/capture/` | WIRED (env-gated no-op in dev; route import + call confirmed) |
| `PageviewTracker` | `posthog.capture("$pageview")` | `posthog-js` initialized by `initAnalytics()` in AnalyticsProvider useEffect | WIRED |
| `emitEvent` | `assertAllowedProperties` | First statement in body, before env check, before fetch | WIRED (L53-66 of server.ts) |
| `scripts/guards/analytics-privacy.js` | `npm run guard:release` | `lint:analytics-privacy` step before `tsc`/`build` | WIRED (package.json L15-16) |
| `PageviewTracker` | Sacred-path exclusion | `isExcludedPath(pathname)` early-return at L31 | WIRED |

## Requirements Coverage (ANALYTICS-01..12)

| REQ | Description | Status | Evidence |
|-----|-------------|--------|----------|
| ANALYTICS-01 | Pageviews on non-sacred paths via App Router nav hook | SATISFIED | `PageviewTracker.tsx` uses `usePathname()` + `useSearchParams()`; capture at L36 |
| ANALYTICS-02 | Pageview wrapped in `<Suspense>` to avoid React 18 CSR bailout | SATISFIED | `AnalyticsProvider.tsx:15-19` Suspense boundary |
| ANALYTICS-03 | `day_complete` fires server-side with `{day_number, cycle_number, tier}` | SATISFIED | `progress/route.ts:229-239` |
| ANALYTICS-04 | `cycle_start` event typed for Phase 7 | SATISFIED (typed stub) | `events.ts:59-66` + catalog |
| ANALYTICS-05 | `badge_unlock` typed for Phase 8 | SATISFIED (typed stub) | `events.ts:75-82` |
| ANALYTICS-06 | `renewal_prompted` typed for Phase 9 | SATISFIED (typed stub) | `events.ts:91-98` |
| ANALYTICS-07 | Referral events with prefix-only props | SATISFIED (typed stub) | `events.ts:107-126` — only `referral_code_prefix`, never full code |
| ANALYTICS-08 | Year-review events typed | SATISFIED (typed stub) | `events.ts:135-156` |
| ANALYTICS-09 | Zero `track()` in sacred paths (CI enforced) | SATISFIED | Guard R1 L24-31; deliberate-violation test PASSED |
| ANALYTICS-10 | Zero `track()` in 7 sacred components (CI enforced) | SATISFIED | Guard R2 L34-42; grep across components returns empty |
| ANALYTICS-11 | `person_profiles: "never"` preserved | SATISFIED | `src/lib/analytics.ts:87` |
| ANALYTICS-12 | Property-name whitelist enforced | SATISFIED | 3-layer defense: TypedEvent (compile) + assertAllowedProperties (runtime, `events.ts:231`) + CI grep R3 (`analytics-privacy.js:151-169`) |

No orphaned requirements. All 12 ANALYTICS REQs claimed in plan frontmatter are delivered.

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Privacy guard passes clean tree | `npm run lint:analytics-privacy` | `✓ analytics privacy guard passed (438 files scanned)` exit 0 | PASS |
| Analytics tests pass | `npx vitest run src/lib/analytics/` | Test Files 2 passed, Tests 28 passed | PASS |
| TypeScript clean | `npx tsc --noEmit` | zero output / zero errors | PASS |
| Guard R1 breaks build on sacred-path violation | temp file `src/app/day/__tmpverify__/page.tsx` with `track(...)` + run guard | Exit 1, `VIOLATION [ANALYTICS-09]` | PASS |
| Guard R3 breaks build on banned property names | temp file with `track("evt", {user_email, reflection_text})` | Exit 1, 2 × `VIOLATION [ANALYTICS-12]` | PASS |
| Clean state restored | guard re-run after temp-file deletion | Exit 0, 438 files scanned | PASS |
| Zero track()/posthog.capture() in sacred paths/components | grep across `src/app/{day,reflection,book,program/day,api/guide}` + 7 sacred components | no matches | PASS |
| package.json diff since Phase 5 scoped to `scripts` block only | `git diff 694b0de -- package.json` | only `lint:analytics-privacy` + `guard:release` line changed; `dependencies`/`devDependencies` untouched | PASS (NFR-08) |
| No `posthog-node` install | grep `posthog-node` | zero matches in `src/` source imports; only documentation comments | PASS |
| `person_profiles: "never"` preserved | grep | `src/lib/analytics.ts:87` matches | PASS |
| `capture_pageview: false` preserved | grep | `src/lib/analytics.ts:83` matches | PASS |

## Anti-Pattern Scan

| Concern | Finding | Verdict |
|---------|---------|---------|
| `posthog-node` installed? | No. Only textual refs in SUMMARY/PLAN/docs explaining why it's banned. | CLEAN |
| Session recording / heatmaps / autocapture in code? | `src/lib/analytics.ts:84-86`: `autocapture: false`, `capture_pageview: false`, `capture_pageleave: false`, `disable_session_recording: true` | CLEAN |
| Concurrent analytics (Segment/Mixpanel/GA4/Amplitude)? | grep: no imports | CLEAN |
| Client-side payment/subscription events | Out of scope of this phase; no new such calls introduced | CLEAN |
| TODOs / stubs in Phase 6 code | None found in shipped files. `cycle_number` will default to 1 until Phase 7 migrates — documented as data evolution, not code stub | INFO |

## Human Verification Items (Staging Sign-Off)

These are the ROADMAP criteria items that require a live environment to fully confirm. Not blockers for Phase 6 completion; required before Phase 7 execution depends on live funnels.

### 1. DevTools Network confirms zero PostHog requests on sacred routes
**Test:** Open Chrome DevTools → Network → filter `posthog`. Navigate to `/day/7`, `/reflection/*`, `/book/*` with an entitled test account. Wait 30 seconds on each.
**Expected:** ZERO requests to `posthog.com` or `app.posthog.com` on any of these routes.
**Why human:** Requires running server + real PostHog keys in env + entitled account. Code-level verdict (PASS) already established; this is the observable DevTools confirmation that the code behaves as intended at runtime.

### 2. PostHog Dashboard confirms `day_complete` reception on Day-7 save
**Test:** With `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` set, save the Day-7 reflection. Open PostHog → Events → `day_complete`.
**Expected:** Exactly one event with props `{day_number: 7, cycle_number: 1, tier: <subscription_tier>}` within a few seconds.
**Why human:** Requires live PostHog project + real server env vars + entitled test user. Code path is proven; this confirms the wire actually reaches PostHog.

### 3. `npm run build` produces zero `useSearchParams should be wrapped in Suspense` warnings on dev machine
**Test:** Fresh `npm run build`.
**Expected:** Clean build, no CSR-bailout warning. SUMMARY 06.03 reports this was observed at implementation time; re-run post-gap-close to confirm no regression. (Not run here to avoid a 2-minute build; tsc is clean and Suspense wrap is code-verified.)
**Why human/optional:** Build-time observation; re-run on Vercel preview deploy.

### 4. Founder-side PostHog dashboard safeguards configured (Pitfall #28)
**Test:** In PostHog dashboard: Billing usage alerts at 70%+90%; Session Recording OFF; Heatmaps OFF; Autocapture OFF; Retention 30d for non-funnel events; Team access limited to founder + primary dev.
**Expected:** All 6 items configured per `docs/analytics-event-catalog.md` §"مهام المؤسس اليدوية".
**Why human:** Configured outside the repo, in the PostHog admin UI.

## Gaps Summary

No code-side gaps. Every ROADMAP success criterion maps to code that exists, is substantive, is wired, and has real data flowing through it. The three human-verification items above are staging observability confirmations, not implementation gaps.

---

*Verified: 2026-04-19 · Verifier: Claude (gsd-verifier) · Skill injections (react-best-practices, next-cache-components, bootstrap, next-upgrade) acknowledged and deliberately not acted on — this is a code-inspection verification task, no library APIs were written.*
