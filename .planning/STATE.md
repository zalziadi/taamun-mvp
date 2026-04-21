---
gsd_state_version: 1.0
milestone: v1.3
milestone_name: العمق (Depth & Personalization)
status: roadmap_complete
last_updated: "2026-04-21T00:00:00.000Z"
last_activity: 2026-04-21
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
active_phase: 12
active_phase_name: A11y Audit (cross-cutting foundation)
active_phase_status: planning
---

# Current State

**Last updated:** 2026-04-21

---

## Current Position

Phase: **12 — A11y Audit (cross-cutting foundation)**
Plan: —
Status: Planning (awaiting `/gsd:research-phase 12` — research flag ▶️ RUN)
Last activity: 2026-04-21 — v1.3 roadmap created (5 phases · 66/66 REQs mapped)

- **Milestone:** v1.3 — العمق (Depth & Personalization)
- **Git branch:** claude/awesome-shaw (worktree)
- **Ship blocker note:** Phase 12 must land before any other v1.3 UI work (A11Y-01 decision locked).

---

## v1.3 Milestone Snapshot

**Phases** (numbering continues from v1.2 → Phase 12):

| # | Name | REQs | Research | Status |
|---|---|---|---|---|
| 12 | A11y Audit (cross-cutting foundation) | A11Y-01..12 + NFR | ▶️ RUN | Active · planning |
| 13 | Voice Journaling | VOICE-01..13 + NFR | ⏭️ SKIP | Blocked by 12 |
| 14 | Long-Term Memory (Path A) | MEMORY-01..12 + NFR | ⏭️ SKIP | Blocked by 12 |
| 15 | Monthly رسالة (Themes) | THEMES-01..12 + NFR | ▶️ RUN | Blocked by 12, 14 |
| 16 | Memory Path B (OPTIONAL) | MEMORY-B-01..07 + NFR | ⏭️ SKIP | Blocked by 12, 14, 15 |

**Coverage:** 66 / 66 REQs mapped (56 functional + 10 NFR cross-cutting). Zero orphans.

**Expected CX impact:** 91 → ~96 (+5).

**Zero new runtime dependencies** across the milestone.

---

## v1.3 Goals

Transform Taamun from "same experience for every user" into "experience that understands and remembers the user" via 4 depth features + a11y audit, with `ذكر` (Quranic remembrance) as the tonal frame:

1. **A11y Audit** — VoiceOver + TalkBack full coverage across v1.0–v1.2 components; Lighthouse A11y ≥ 98; iOS Safari SVG fix; migration reconciliation pre-flight.
2. **Voice Journaling (Munsit STT)** — wire existing `VoiceInput.tsx` into `ReflectionJournal`; `مسودة` framing; no audio storage.
3. **Long-Term Memory (Path A)** — extend existing `guide_memory.soul_summary`; first-use `ذكر` modal; opt-out; right-to-forget cascade.
4. **Monthly رسالة (Themes)** — 10 Sufi stations dictionary · Hijri cron · `رسالة` letter surface (NO sidebar, NO heatmap, NO push).
5. **Memory Path B** — vector column + granular `/account/memory` delete + `خاص` privacy flag (OPTIONAL · splittable to v1.4).

---

## Accumulated Context

### Shipped milestones
- **v1.0** (2026-04-18) — Core 28-day program + AI guide + VIP + post-28 retention + minimal UI
- **v1.1** (2026-04-18) — Email automation · web push · AI-generated cycles · book highlights · WhatsApp infra
- **v1.2** (2026-04-20) — إغلاق الحلقة · 6 phases · 70/71 REQs · CX 60→91 · zero new deps

### Key decisions locked for v1.3 (2026-04-21)
1. Memory default at launch: ON with first-use `ذكر` disclosure modal.
2. Themes dictionary: 10 Sufi stations (`صبر · توكّل · شكر · رضا · ورع · زهد · توبة · خوف · رجاء · محبة`).
3. Themes first appearance: 1st of Hijri month + ≥7 reflections threshold.
4. A11y audit = ship blocker (Phase 12 lands before any v1.3 UI).
5. Voice max session: 5-min silent cap with gentle UX.
6. A11y expert: hire 1 blind Arabic VoiceOver expert (<10K SAR).
7. Memory Path B: start in Phase 16; splittable to v1.4.
8. Theme labels: tradition-sourced dictionary, NOT ML auto-generation.
9. Themes surface: Monthly `رسالة` only — NO sidebar, NO heatmap, NO push.
10. Retroactive memory: opt-in only for existing users.

### Carry-over technical debt (tracked, handled outside v1.3 scope)
- Phase-07 guard false-positive on `MilestoneBadge.tsx:16` JSDoc — 1-line patch
- HMAC colon-split bug in `src/lib/entitlement.ts` — ISO-timestamp tokens fail verification
- Pre-existing 10.02 ESLint rule-not-found blocks full `guard:release` chain

### Pre-flight task (inside Phase 12)
- Reconcile duplicate migrations: `20260323_guide_memory.sql` (user_memory) vs `20260324000000_guide_sessions_memory.sql` (guide_memory + guide_sessions). Commit reconciliation BEFORE Phase 14 opens (PITFALL #30).

---

## Next action

1. `/gsd:research-phase 12` — A11y audit research (iOS SVG spike + blind Arabic VoiceOver expert planning).
2. `/gsd:plan-phase 12` — decompose A11y Audit into plans.
3. Reconcile duplicate `guide_memory` / `guide_sessions` migrations inside Phase 12 pre-flight.

---

## Active todos

None in session — roadmap just created.

---

## Open questions (captured, non-blocking)

- Phase 12: confirm blind-Arabic-expert hiring timing (post-audit-draft vs pre-release-gate).
- Phase 15: finalize `رسالة` template spike — who vets Qushayri / Ibn al-Qayyim gloss attributions?
- Phase 16: decide split trigger — timeline pressure threshold for moving MEMORY-B-04/05/06 to v1.4.

---

## Blockers

None. v1.2 migrations pending apply remain on separate operational track.
