---
gsd_state_version: 1.0
milestone: v1.3
milestone_name: العمق (Depth & Personalization)
status: defining_requirements
last_updated: "2026-04-21T00:00:00.000Z"
last_activity: 2026-04-21
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Current State

**Last updated:** 2026-04-21

---

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements for v1.3
Last activity: 2026-04-21 — v1.3 milestone started

- **Milestone:** v1.3 — العمق (Depth & Personalization)
- **Git branch:** claude/awesome-shaw (worktree)

---

## v1.3 Goals

Transform Taamun from "same experience for every user" into "experience that understands and remembers the user" via 4 target features:

1. **Reflection Themes ML Clustering** — monthly digest of recurring themes
2. **Long-Term Memory for AI Guide** — cross-session memory via extended RAG
3. **Voice Journaling (Munsit STT)** — record → transcribe → reflection (no audio storage)
4. **Arabic Screen Reader A11y Audit** — VoiceOver + TalkBack + Lighthouse A11y ≥ 98

Expected CX impact: 91 → ~96 (+5)

---

## Accumulated Context

### Shipped milestones
- **v1.0** (2026-04-18) — Core 28-day program + AI guide + VIP + post-28 retention + minimal UI
- **v1.1** (2026-04-18) — Email automation · web push · AI-generated cycles · book highlights · WhatsApp infra
- **v1.2** (2026-04-20) — إغلاق الحلقة · 6 phases · 70/71 REQs · CX 60→91 · zero new deps

### Carry-over technical debt (tracked, handled outside v1.3 scope)
- Phase-07 guard false-positive on `MilestoneBadge.tsx:16` JSDoc — 1-line patch
- HMAC colon-split bug in `src/lib/entitlement.ts` — ISO-timestamp tokens fail verification
- Pre-existing 10.02 ESLint rule-not-found blocks full `guard:release` chain

---

## Next action

1. Research decision — investigate ML clustering + long-term memory patterns before requirements
2. Define REQUIREMENTS.md with REQ-IDs for 4 feature categories (THEMES, MEMORY, VOICE, A11Y)
3. Spawn gsd-roadmapper — continues numbering from Phase 12

---

## Active todos

None in session — milestone just started.

---

## Blockers

None. v1.2 migrations pending apply are separate operational track.
