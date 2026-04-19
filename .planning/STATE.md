---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: — Core Experience
status: verifying
last_updated: "2026-04-19T01:25:25.017Z"
last_activity: 2026-04-19
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 18
  completed_plans: 17
---

# Current State

**Last updated:** 2026-04-19

---

## Current Position

Phase: 08 (Milestone Badges) — 08.04 complete; 08.01 executing in parallel
Plan: 08.04 of 08.01..06 shipped (pure-SQL retroactive backfill migration — PITFALL #4 mitigation)

- **Milestone:** v1.2 — إغلاق الحلقة (Retention Loop)
- **Active phase:** Phase 08 (Milestone Badges — multi-plan parallel execution)
- **Active plan:** 08.04 complete; 08.01 (SVG variants) running in parallel
- **Status:** Phase complete — ready for verification
- **Last activity:** 2026-04-19
- **Git branch:** claude/awesome-shaw (worktree)
- **Last commit (08.04):** pending this plan's atomic commit

### Phase 08 Decisions (2026-04-19)

- **08.04 (backfill migration):** Pure SQL, 5 INSERT sections (cycle-1 milestones from reflections, cycle-1 day_28 from reflections, cycle_complete from completed_cycles, day_28 for archived cycles, milestones for archived cycles). Every row has `notified=true` and `ON CONFLICT (user_id, badge_code, cycle_number) DO NOTHING`. Attributes historical reflections to cycle 1 because reflections table is keyed UNIQUE(user_id, day) — no cycle dimension.
- **08.04 Ziad-flag:** Section 5 could over-backfill users whose `completed_cycles` was populated via edge case without reaching day 21 of that cycle. In practice vanishingly rare (start-cycle route gates archival on completed_days.includes(28)). ON CONFLICT DO NOTHING means a corrective migration later is safe.

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

1. **Run `/gsd:plan-phase 6`** — Plan Phase 6 (PostHog Event Instrumentation)
   - Routing hint: SKIP `/gsd:research-phase` (research already covers it)
2. After Phase 6 ships → `/gsd:plan-phase 7` (RUN research-phase first for cycle-2 timezone spike)

---

## Active todos

None in session.

---

## Blockers

None technical for v1.2.

**Operational (carry-over, explicitly out of scope for v1.2):** WhatsApp community group (v1.1 Phase 5) still needs admin + moderation policy decision before production activation. Independent track.
