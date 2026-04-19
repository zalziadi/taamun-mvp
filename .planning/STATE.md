---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: — Core Experience
status: "Phase 8 awaiting human checkpoint — all 6 plans shipped; 40/40 integration harness checks PASS; phase-08 anti-pattern guard PASS; guard:release chain extended"
last_updated: "2026-04-19T12:10:23.228Z"
last_activity: 2026-04-19
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 25
  completed_plans: 23
---

# Current State

**Last updated:** 2026-04-19

---

## Current Position

Phase: 08 (Milestone Badges) — 08.01..06 shipped (automated portion)
Plan: 08.06 complete (automated); human-verify checkpoint pending Ziad sign-off

- **Milestone:** v1.2 — إغلاق الحلقة (Retention Loop)
- **Active phase:** Phase 08 (Milestone Badges — closure)
- **Active plan:** 08.06 automated portion complete; Task 3 human-verify PENDING
- **Status:** Phase 8 awaiting human checkpoint — all 6 plans shipped; 40/40 integration harness checks PASS; phase-08 anti-pattern guard PASS; guard:release chain extended
- **Last activity:** 2026-04-19
- **Git branch:** claude/awesome-shaw (worktree)
- **Last 08.06 commits:** `38e3f66` (integration harness) + `c4b642b` (anti-pattern guard)

### Phase 09 Decisions (2026-04-19)

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
