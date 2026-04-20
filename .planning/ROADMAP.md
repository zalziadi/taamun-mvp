# Taamun Roadmap

---

## v1.0 — Core Experience (shipped 2026-04-18)

**Archived:** [v1.0-ROADMAP.md](./milestones/v1.0-ROADMAP.md)

Complete 28-day program, AI guide, VIP tier, post-28 retention system, minimal UI.

---

## v1.1 — Growth & Retention (shipped 2026-04-18)

**Archived:** [v1.1-ROADMAP.md](./milestones/v1.1-ROADMAP.md)

Email re-engagement automation, web push notifications, AI-generated infinite cycles (hybrid), book highlights + notes (DB-backed), WhatsApp community infrastructure.

> Shipped directly via focused commits same-day — no full GSD discuss→plan→execute cycle was produced. WhatsApp community remains pending operational activation (group admin, moderation policy).

---

## v1.2 — إغلاق الحلقة (Retention Loop) (shipped 2026-04-20)

**Archived:** [v1.2-ROADMAP.md](./milestones/v1.2-ROADMAP.md) · [v1.2-REQUIREMENTS.md](./milestones/v1.2-REQUIREMENTS.md) · [v1.2-MILESTONE-AUDIT.md](./v1.2-MILESTONE-AUDIT.md)

6 phases · 44 plans · 70/71 active REQs · 219 integration assertions · 700+ unit tests · zero new deps · Ta'ammun DS site-wide · 2 real bugs caught (Asia/Riyadh timezone fixed, HMAC colon-split documented) · 6 migrations pending apply. Retention gaps closed: Cycle 2 CTA · Milestone badges · Renewal prompts · Referral program · Year-in-Review archive · PostHog analytics foundation.

## v1.3 — Depth & Personalization (backlog)

Originally planned as v1.2 backlog; pushed to v1.3 once v1.2 reframed around the Retention Loop.

- Reflection themes ML clustering (semantic search over user reflections)
- Long-term guide memory beyond session scope
- Voice journaling (Munsit STT integration for dhikr/reflection)
- Arabic screen reader quality audit
- **Year-in-Review Ramadan annual moment** (deferred from v1.2 Phase 12 — scarcity + annual push, Satori Arabic-font spike required)
- **Subscription pause feature** (deferred — needs Salla/Tap capability spike)
- **Family plan** (multi-user)

---

## v2.0 — Platform (far future)

- Multi-user accounts (family plans)
- Content creators publish their own 28-day journeys
- Embeddable widget for imams/teachers

---

## Principles

1. **No feature ships without real user validation.** The "قلبي يتشرب معاني" feedback is the north star.
2. **Performance budget:** every new feature must maintain LCP < 6s on 3G mobile.
3. **Arabic-first:** no English-only flows. RTL throughout.
4. **Privacy:** no tracking pixels on prayer/reflection pages — enforced by CI grep, not documentation.
5. **Tonal guardrails:** every v1.2 phase explicitly bans Duolingo/Headspace/Strava gamification patterns. Badges are private by default. Renewal copy never uses scarcity.
6. **DB is source of truth:** entitlement HMAC cookie is a cache; renewal/badge/cycle logic always reads the DB.
7. **Two-step migrations:** every schema addition is additive-then-enforce to avoid prod outages.
