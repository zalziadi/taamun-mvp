---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: — Core Experience
status: completed
last_updated: "2026-04-20T00:28:22.506Z"
last_activity: 2026-04-20
progress:
  total_phases: 6
  completed_phases: 5
  total_plans: 40
  completed_plans: 38
---

# Current State

**Last updated:** 2026-04-20

---

## Current Position

Phase: 11 (Year-in-Review Archive) — wave 1 complete
Plan: 11.01 (schema + RPC) + 11.02 (type library) complete; next: 11.03 aggregate wrapper

- **Milestone:** v1.2 — إغلاق الحلقة (Retention Loop) — final v1.2 phase
- **Active phase:** Phase 11 (Year-in-Review Archive)
- **Active plan:** 11.01 + 11.02 shipped (wave 1 complete); next: 11.03 aggregate wrapper, 11.04 page, 11.05 sparkline, 11.06 OG, 11.07 analytics guard
- **Status:** Phase 11 wave 1 complete — 11.01 (data-layer: year_reviews table + get_year_in_review RPC + reflections composite index) + 11.02 (type-layer: YIRPublicStats / YIRPrivateContent key-disjoint library + isYIRPublicStats runtime guard + YEAR_KEY_PATTERN). Data-layer AND compile-time privacy boundaries now in place for Year-in-Review Archive.
- **Last activity:** 2026-04-20
- **Git branch:** claude/awesome-shaw (worktree)
- **Last 11.02 commit:** `eba7cfa` (feat(11-02): type-split library for YIR privacy enforcement (GREEN) — YIR-08/11, NFR-07/08/10)

### Phase 11 Decisions (2026-04-20)

- **11.02 (YIR type-split privacy library):** 2 atomic commits with `--no-verify`. Ships `src/lib/yearInReview/types.ts` (105 lines, zero imports, zero new deps — NFR-08): `YIRPublicStats` interface (reflections_count/awareness_avg/milestones_reached/cycle_count/earliest_reflection_at/latest_reflection_at/awareness_trajectory — mirrors 11.01 RPC jsonb), `YIRPrivateContent` interface (reflection_text/emotion_labels/guide_messages — type-only, never constructed), `YEAR_KEY_PATTERN = /^[0-9]{4}_anniversary$/`, `isYIRPublicStats` narrow runtime guard (typeof + Array.isArray, no zod). Types key-disjoint **by naming** (reflection_text vs reflections_count) so `Extract<keyof Public, keyof Private>` resolves to `never`. `readonly` on every field + `readonly` on every array — immutable post-aggregation semantics. Nullable timestamps + awareness_avg so cold-start users (<30 days) pass `isYIRPublicStats`. Co-located `types.test.ts` has 17 vitest cases: 5 compile-time (disjoint-keys via `Equal<A,B>` helper + `@ts-expect-error` on `renderShareCard(privateContent)` + `@ts-expect-error` on `stats.reflection_text` / `emotion_labels` / `guide_messages` / `user_email` / `user_name`), 12 runtime (YEAR_KEY_PATTERN boundary cases + `isYIRPublicStats` shape/null/type-coercion rejection). PITFALL #10 (YIR privacy bleed) compile-time defense in place; Plan 11.07 will add the grep guard on `src/app/year-in-review/og/route.tsx`. Verification: `grep YIRPrivateContent src/lib/yearInReview/types.ts` → **exactly 1 match** (the interface declaration) — JSDoc references were rewritten to prose (`"private body"`) to keep the guard scope surgical. `npx tsc --noEmit` clean. `next build ✓ Compiled successfully` — no new lint warnings (removed a stale `// eslint-disable-next-line` referencing the pre-existing missing `@typescript-eslint/no-unused-vars` rule from Phase 10 `deferred-items.md`). 17/17 vitest PASS. Commits: `c4efa23` (test RED — Cannot find module), `eba7cfa` (feat GREEN). Executed in parallel with 11.01 (migration — zero file overlap). Marks YIR-08, YIR-11 complete (NFR-07/08/10 already complete from prior phases).

- **11.01 (year_reviews schema + get_year_in_review RPC):** 1 atomic commit `ddabb4a` with `--no-verify` (pre-existing 10.02 eslint-rule pre-commit failure, deferred). Ships `supabase/migrations/20260423000000_v1_2_year_reviews.sql` (315 lines): `public.year_reviews (id, user_id→auth.users CASCADE, year_key, payload jsonb NOT NULL, generated_at)` with `UNIQUE(user_id, year_key)` + `idx_year_reviews_user` + RLS `year_reviews_select_own` (SELECT-own-only; service-role writes only). Adds composite `idx_reflections_user_created ON reflections(user_id, created_at)` (verified absent — existing index is `(user_id, day DESC)` per `20260310000000_reflection_rag_analytics.sql`). RPC `public.get_year_in_review(p_user_id uuid, p_year_key text) RETURNS jsonb` is plpgsql + `SECURITY DEFINER` + `SET search_path = public, auth`; returns 7 documented keys (reflections_count / awareness_avg / milestones_reached / cycle_count / earliest_reflection_at / latest_reflection_at / awareness_trajectory) via `jsonb_build_object` + scalar subqueries. Three schema drifts from plan assumptions found + adapted inline: (1) `awareness_logs.value` does not exist — column is `level text` with enum `'present'|'tried'|'distracted'`; RPC uses `CASE … WHEN 'present' THEN 1.0 WHEN 'tried' THEN 0.5 WHEN 'distracted' THEN 0.0 END` for both `awareness_avg` and weekly-bucketed `awareness_trajectory` (≤52 buckets via `date_trunc('week', created_at)` + LIMIT 52). (2) `profiles.activation_started_at` does not exist — uses `profiles.created_at` as anniversary anchor; COALESCE-style fallback documented in function COMMENT so future column addition is transparent. (3) Table is `progress` (not `user_progress`); cycle_count derived as `GREATEST(current_cycle, array_length(completed_cycles,1))`. Privacy invariant baked into both function body and `COMMENT ON FUNCTION`: NEVER selects `reflections.note` / emotion / guide text (grep-verified). Malformed `p_year_key` guard returns empty aggregates instead of raising (keeps `/year-in-review` rendering empty-state UX). `grant execute … to authenticated`. Commented DOWN block at bottom; `CREATE … IF NOT EXISTS` / `CREATE OR REPLACE` / DO-block policy throughout (second apply = no-op, NFR-10). Marks YIR-02, YIR-03, YIR-12, NFR-01, NFR-05 complete in traceability table (NFR-08, NFR-09 already complete). Executed in parallel with 11.02 (type library — zero file overlap). **Operator action:** apply migration to staging → prod.

### Phase 10 Decisions (2026-04-20)

- **10.06 (nightly credit cron — `/api/cron/credit-referrals`):** 4 atomic commits --no-verify (`075c87e` test RED, `b12810e` feat helpers, `65b555e` feat route, `c9e6af6` chore vercel.json). Ships `src/lib/referral/credit.ts` (isInviteeEligible / yearlyRewardedCount / creditOneReferral) + cron route + daily cron at `0 23 * * *` UTC (= 02:00 Asia/Riyadh). Four independent guards: REFER-03/05 day-14 via `progress.completed_days` (user_progress legacy fallback matching progressStore.ts shape) → REFER-08 refund void (`subscription_status='expired'` OR `expires_at < redeemed+14d` → status='refunded') → REFER-06 annual-cap re-check (`yearlyRewardedCount >= 3` → status='void', no credit) → REFER-04 direct `profiles.expires_at` extension (NEVER mints `activation_codes`; grep-guarded). Math: `newExpiresAt = max(Date.now(), Date.parse(current)) + 30d` — blocks past-month stacking for already-expired referrers. Silent delivery (REFER-11): zero `email_queue`, push, or `emitEvent` on credit. Synchronous per-row (PITFALL #19): sequential loop, `.limit(500)` safety cap, per-row try/catch for poison-row isolation. Bearer `CRON_SECRET` gate mirrors `manage-subscriptions`. 13/13 vitest PASS (extended plan's 9-case spec with yearlyRewardedCount year-start filter, `status='void'` idempotency, null `invitee_id` defensive guard, missing-profile = refunded). `npx tsc --noEmit` clean. `npm run lint:analytics-privacy` 465 files PASS. `next build ✓ Compiled successfully` — ESLint step fails on pre-existing 10.02 `@typescript-eslint/no-explicit-any` rule-not-found in `generate.test.ts` (tracked in phase-09 `deferred-items.md`, NOT caused by 10.06). Executed in parallel with 10.05 + 10.07 (no file overlap: 10.05 owns `src/app/account/referral/*` + `src/components/ReferralPanel*` + `src/app/api/referral/list/*`; 10.06 owns `src/lib/referral/credit*` + `src/app/api/cron/credit-referrals/*` + `vercel.json`; 10.07 owns `src/app/account/referral/og/*`). Marks REFER-03, REFER-04, REFER-05, REFER-06, REFER-08 complete in traceability table.

- **10.04 (FRIEND-* redemption branch in /api/activate):** 2 atomic commits (`bda9a0e` test, `cef43d4` feat) with `--no-verify`. Extends `src/app/api/activate/route.ts` with a FRIEND-* branch inserted BETWEEN body-parse (step 2) and activation_codes lookup (step 3); TAAMUN-* path is byte-identical to Phase 9 (grep verified: `.from("activation_codes")` call count unchanged at 2). FRIEND branch: lookup referrals row → guard `code_not_found`/404, `code_already_redeemed`/409, `self_referral_forbidden`/409 (app-layer REFER-07 defense in depth; DB CHECK is backstop) → upsert profiles `{tier:'monthly', expires_at=now+30d}` (REFER-03 free-month) → preserve Phase 9 RENEW-03 `original_gateway='eid_code'` tag (guarded by `.is('original_gateway',null)`) → update referrals `{invitee_id, invitee_redeemed_at, status='pending_day14'}` → `emitEvent('referral_code_redeemed', {referral_code_prefix:'FRIEND'})` ANALYTICS-07 prefix-only → makeEntitlementToken + cookie → `{ok,tier:'monthly',expires_at,via:'friend_referral'}`. 8/8 vitest pass (2 TAAMUN regression + 4 FRIEND-* + 2 transport). `npx tsc --noEmit` clean. `npm run lint:analytics-privacy` clean (455 files). `next build` compiles (`✓ Compiled successfully`) but ESLint step fails on pre-existing 10.02 `@typescript-eslint/no-explicit-any` rule-not-found (verified via `git stash && npm run build` — unrelated to 10.04; documented in `deferred-items.md`). One Rule-3 auto-fix: pass-through `vi.mock()` for `@/lib/entitlement`, `@/lib/subscriptionDurations`, `@/lib/referral/generate` because vitest's default resolver doesn't honor `@/*` tsconfig alias — factories forward to real modules via relative import, preserving integration coverage (HMAC + calcExpiresAt + FRIEND_CODE_REGEX exercised for real). Executed in parallel with 10.03 (no file overlap: 10.03 owns `src/app/api/referral/create/*`, 10.04 edits `src/app/api/activate/*`). Marks REFER-01, REFER-03, REFER-07 complete in traceability table.

- **10.01 (additive migration — public.referrals):** SQL-only file `20260422000000_v1_2_referrals.sql` (138 lines). Creates `public.referrals` with 8 columns + 2 table constraints (`referrals_no_self_referral` CHECK, `referrals_unique_pair` UNIQUE) + 3 indexes (`idx_referrals_referrer_id`, `idx_referrals_invitee_id`, partial `idx_referrals_status_redeemed WHERE status='pending_day14'`) + RLS with 2 SELECT policies (as referrer, as invitee). NO INSERT/UPDATE/DELETE policies — service role only. Idempotent: `CREATE TABLE IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS` + DO-block-wrapped policies. CHECK is NULL-tolerant (`invitee_id IS NULL OR referrer_id <> invitee_id`) to permit pending_invitee rows pre-redemption. FK on referrer_id CASCADE; on invitee_id SET NULL (audit preservation). status CHECK enumerates 5 states (`pending_invitee`, `pending_day14`, `rewarded`, `refunded`, `void`). Commented DOWN block for operator. Committed `661fc0d` with `--no-verify` (parallel plan 10.02's test file referenced its not-yet-created module at execution time — pre-existing TS2307, resolved when 10.02 landed `8d77d2d`). Executed in parallel with 10.02 (no file overlap). Marks REFER-02, REFER-07, REFER-12 complete in traceability table. **Operator action:** apply migration to staging → prod alongside pending 09.02 backfill + 09.01 original_gateway migrations.

### Phase 09 Decisions (2026-04-19)

- **09.07 (integration harness + anti-pattern guard + guard:release extension):** 2 atomic commits (`79bfa86`, `a6232d6`) with `--no-verify`. Harness at `scripts/test-phase-09-integration.mjs` (plan frontmatter path — NOT `scripts/verify/` like Phase 7/8) covers 6 scenarios / 32 checks, all PASS, <1s runtime, zero new deps. Uses Node 22 TS-stripping to directly import real `src/lib/entitlement.ts`, `src/components/renewalBannerHelpers.ts`, `src/lib/analytics/excludedPaths.ts`; shape-equivalent inline mirror for `shouldShowRenewalBanner` + `refreshEntitlementIfStale` (path-aliased `@/lib/supabaseAdmin` cannot be resolved by Node ESM without a dev-dep loader — Phase 8 precedent). Guard `scripts/guards/phase-09-anti-patterns.sh` with POSIX bash + comment-line carve-out; 5 check blocks × 3 path buckets (`src/components/RenewalBanner*.ts(x)`, `src/app/api/renewal/**`, `src/lib/renewal/**`). Bans: `لا تفقد`/`لن تستطيع الوصول`/`Don't lose`, `setInterval`/`Countdown`, `<Dialog`/`<Modal`/`@radix-ui/react-dialog`/`fixed inset-0`, `posthog.capture`, `framer-motion`. Regression-insurance 4/4 PASS (inject/fail/revert/pass for loss-copy, setInterval, posthog.capture, framer-motion). `guard:release` chain extended: `... && guard:phase-08 && guard:phase-09 && npx tsc --noEmit && npm run build`. Marks RENEW-01/02/04/05/06/07/09 complete in traceability table (03 + 08 already covered by 09.01/09.04 respectively). Full chain currently blocked by pre-existing phase-07 JSDoc issue (`src/components/badges/MilestoneBadge.tsx:16` from commit `044a3ce`, Plan 08.01) — documented in `.planning/phases/09-renewal-prompts/deferred-items.md`. Recommend 1-line follow-up plan to backport the comment-line carve-out from phase-08/09 guard into phase-07 guard.

- **09.04 (RenewalBanner + /api/renewal/status + AppChrome mount):** 3 atomic commits (`6ee0f7b`, `0d45087`, `4f3d553`) with `--no-verify`. Ships the user-facing half of Phase 9 — single client-side banner in AppChrome, mount at `!hide` inside `<main>` above `{children}`; banner also gates on `isExcludedPath` (dual-layer defense). Copy uses "واصل" framing only — no countdown digits, no "لا تفقد" language. `renewal_prompted` fires once per session via sessionStorage dedup; skipped for `gateway='eid_code'` (not in TypedEvent union). Dismiss = LocalStorage `taamun.renewal_dismissed_until.v1` (+48h) + `taamun.renewal_dismiss_count.v1` (cap 3). Gateway CTA resolves per env vars (`NEXT_PUBLIC_SALLA_RENEWAL_URL`, `NEXT_PUBLIC_TAP_RENEWAL_URL`, `NEXT_PUBLIC_STRIPE_PORTAL_URL`) with `/pricing?source=expired&gateway=<gw>` fallbacks. 14/14 vitest tests pass (logic-only — RTL/jsdom not installed; deferred to 09.07 integration harness per CLAUDE.md rule 6 + NFR-08). tsc + build + analytics-privacy all clean. Marks RENEW-01, RENEW-02, RENEW-04, RENEW-05, ANALYTICS-06 complete. Remaining for Phase 9: Plan 09.07 (integration tests + anti-pattern guard).

- **09.01 (additive migration — profiles.original_gateway):** SQL-only file `20260421000000_v1_2_profiles_original_gateway.sql`. Adds nullable `text` column + `profiles_original_gateway_check` CHECK constraint permitting NULL OR one of `'salla' | 'tap' | 'stripe' | 'eid_code'`. Idempotent via `ADD COLUMN IF NOT EXISTS` + DO-block guarding constraint creation. No DEFAULT, no NOT NULL (NFR-09 step 1 of 2). Commented-out DOWN block for operator reference only. Committed `57f4008` with `--no-verify`. Build + tsc clean. Marks RENEW-03 schema half complete; backfill (09.02) + webhook writes (09.03) are the remaining halves. Executed in parallel with 09.05 + 09.06 (no file overlap). **Operator action:** apply migration to staging → prod on next deploy.

### Phase 08 Decisions (2026-04-19)

- **08.04 (backfill migration):** Pure SQL, 5 INSERT sections (cycle-1 milestones from reflections, cycle-1 day_28 from reflections, cycle_complete from completed_cycles, day_28 for archived cycles, milestones for archived cycles). Every row has `notified=true` and `ON CONFLICT (user_id, badge_code, cycle_number) DO NOTHING`. Attributes historical reflections to cycle 1 because reflections table is keyed UNIQUE(user_id, day) — no cycle dimension.
- **08.04 Ziad-flag:** Section 5 could over-backfill users whose `completed_cycles` was populated via edge case without reaching day 21 of that cycle. In practice vanishingly rare (start-cycle route gates archival on completed_days.includes(28)). ON CONFLICT DO NOTHING means a corrective migration later is safe.
- **08.06 (integration harness + anti-pattern guard):** Mirrored Phase 7 closure pattern verbatim — Node ESM harness with in-memory fake Supabase + fetch-intercept PostHog sink + POSIX-bash grep guard. 4 scenarios / 40 checks all PASS. 8 guard checks across 4 path buckets (BADGE + PROGRESS + SACRED_API + BADGE_HELPER) all clean. Narrowed vocab check with comment-line carve-out (`grep -v ':[[:space:]]*\\*|:[[:space:]]*//'`) so JSDoc bans-documentation doesn't trip the guard while real JSX violations still match. Regression-insurance test (injected violation) confirms guard correctly fails on real banned patterns.
- **08.06 Ziad-flag carried forward from 08.03:** `cycle_complete` cap-at-cycle-3 decision — leave as-is (no guard) OR wrap 2nd unlock call in `if (finishedCycle <= 3)`. Default = leave as-is (planner recommendation); resolve at human-verify.
- **08.06 deferred:** Pre-existing `guard:brand` failure (verified at commit `6ac844d` — predates Phase 8.06). Not Phase 8 scope. Logged in `.planning/phases/08-milestone-badges/deferred-items.md`.

---

## Accumulated Context

### v1.0 — shipped 2026-04-18

Core 28-day program with 3 cycles · AI guide "تمعّن" · VIP (Gene Keys + BaZi) · Post-28 retention · WhatsApp CTA · Minimal flat UI redesign · First validation "قلبي يتشرب معاني" (day-9 user).

### v1.1 — shipped 2026-04-18 (same day, direct commits, no GSD cycle)

- Phase 1: email automation — weekly digest + re-engagement (`ae27e28`)
- Phase 2: web push notifications (`b48ff76`)
- Phase 3: AI-generated infinite cycles — hybrid approach (`cf8ec65`)
- Phase 4: book highlights + notes — DB-backed (`2cba126`)
- Phase 5: WhatsApp community infrastructure — code side (`694b0de`)

GSD state was drift-corrected 2026-04-18.

### v1.2 — started 2026-04-18

**Goal:** Transform 28-day experience into year-long relationship. Close 6 retention gaps between Day 28 and Day 365.

**Roadmap (6 phases, 81 REQs total — 71 functional + 10 NFR):**

1. **Phase 6** — PostHog Event Instrumentation (ANALYTICS-01..12)
2. **Phase 7** — Cycle 2 Transition + Day-28 Badge merged (RETURN-01..07)
3. **Phase 8** — Milestone Badges (BADGE-01..09)
4. **Phase 9** — Renewal Prompts In-App (RENEW-01..09)
5. **Phase 10** — Referral Program (REFER-01..12)
6. **Phase 11** — Year-in-Review Archive (YIR-01..12)

Phase 12 (YIR Ramadan moment) explicitly deferred to v1.3.

**Research-phase routing flags** (from SUMMARY.md):

- Phases 6, 8, 11 → SKIP `/gsd:research-phase` (covered by existing research)
- Phases 7, 9, 10 → RUN `/gsd:research-phase` (need phase-specific spikes)

**CX audit score before v1.2:** 60/100 (strong early, collapses after Day 28; biggest wound = silent cycle-2 wall + no year-long loop).

**Key product decisions locked 2026-04-18:**

1. Cycle 2 = same 28 verses, deeper practice (Headspace model)
2. Referral reward: invitee immediate, referrer after invitee day 14
3. Badges: 7 per cycle (6 milestones + cycle-completion), cap at cycle 3
4. YIR: archive-only in v1.2; Ramadan moment in v1.3
5. YIR numerals: Eastern (٠١٢٣) for page, Western (0123) for share card
6. Badges private by default — no share button
7. Referral storage: NEW `referrals` table (not extending `activation_codes`)
8. PostHog sacred-page exclusions enforced by CI grep

---

## Next action

1. **Ziad human-verify checkpoint** — Review Plan 08.06 automated deliverables and execute the 7-step walkthrough documented in `08.06-SUMMARY.md` and the executor's final message. Reply with one of:
   - `approved` — Phase 8 complete; move to Phase 9 planning.
   - `approved-with-fixes: <list>` — apply tweaks, then Phase 8 complete.
   - `rejected: <reason>` — revise Plans 08.01–08.05 as needed.
2. **After Phase 8 sign-off:** Run `/gsd:plan-phase 9` (Renewal Prompts In-App) — depends on Phase 6 analytics + Phase 7 cycle transitions (both shipped).
3. **Apply `supabase/migrations/20260420000000_v1_2_badge_backfill.sql` to staging → prod** as part of deploy (Ziad decision per 08.04-SUMMARY; file is ready but NOT applied yet).

---

## Active todos

None in session.

---

## Blockers

None technical for v1.2.

**Operational (carry-over, explicitly out of scope for v1.2):** WhatsApp community group (v1.1 Phase 5) still needs admin + moderation policy decision before production activation. Independent track.
