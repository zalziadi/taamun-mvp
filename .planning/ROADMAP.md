# Taamun Roadmap

---

## v1.0 — Core Experience (shipped 2026-04-18)

**Archived:** [v1.0-ROADMAP.md](./milestones/v1.0-ROADMAP.md) · [v1.0-REQUIREMENTS.md](./milestones/v1.0-REQUIREMENTS.md)

Complete 28-day program, AI guide, VIP tier, post-28 retention system, minimal UI.

---

## v1.1 — Growth & Retention (shipped 2026-04-18)

**Archived:** [v1.1-ROADMAP.md](./milestones/v1.1-ROADMAP.md) · [v1.1-REQUIREMENTS.md](./milestones/v1.1-REQUIREMENTS.md)

Email automation, web push, AI infinite cycles, DB book notes, WhatsApp broadcast infrastructure.

---

## v1.2 — Depth & Personalization (shipped 2026-04-18)

**Archived:** [v1.2-ROADMAP.md](./milestones/v1.2-ROADMAP.md) · [v1.2-REQUIREMENTS.md](./milestones/v1.2-REQUIREMENTS.md)

Guide long-term memory, reflection theme clustering, `/insights` page, voice journaling, A11y CI gate.

---

## v1.3 — Reach & Distribution (shipped 2026-04-18)

**Archived:** [v1.3-ROADMAP.md](./milestones/v1.3-ROADMAP.md) · [v1.3-REQUIREMENTS.md](./milestones/v1.3-REQUIREMENTS.md)

PWA install + offline, invite flow, voice tasbeeh, shareable insights, year recap.

---

## v1.4 — Community & Creators (planning)

**Goal:** v1.3 gave users **channels** to spread Taamun. v1.4 builds **places** where users come back together — community space inside the app + creator tools so trusted voices can publish their own journeys.

### Candidate phases

#### Phase 1: Reward Credit Application
- Apply +30 days to `expires_at` for both inviter and invitee on successful subscription
- Hook into existing Stripe / Salla / Tap webhook paths
- Idempotent against `invite_redemptions.rewarded` flag
- **Depends on:** product decision on which payment events trigger the credit

#### Phase 2: In-app Threads
- Public threads attached to a day or verse: `/threads/day/[id]` or `/threads/verse/[ref]`
- Lightweight: title + body + short replies, anonymized usernames
- No DMs (avoids moderation complexity)
- **Depends on:** moderation policy (auto-flag for profanity? URL blocking?)

#### Phase 3: Creator Mode (MVP)
- VIP-only feature: create a 7- or 14-day mini-journey
- Schema: `creator_journeys`, `creator_journey_days`
- Published journeys appear in `/discover` page
- Subscribers can join any creator's journey as a parallel track
- **Depends on:** creator onboarding flow + review/approval policy

#### Phase 4: OG Image Generation
- Server-generated Arabic calligraphy image for each shared insight
- Uses `@vercel/og` or Next.js OG image API
- Replaces plain text OG preview with beautiful shareable image
- **Depends on:** Arabic font asset (Amiri already loaded via `next/font`)

#### Phase 5: Calendar Year-end Recap Email
- Automated batch: every Dec 31 OR Hijri new year, email all 90+ day users
- Content: link to `/recap` + 3-sentence highlight
- Cron: once per year (or dispatch manually)
- **Depends on:** scheduler for annual-cadence crons

---

## v1.5+ — Backlog

- Moderation UI for shared_insights flagged queue
- Mobile native wrapper (Capacitor) if PWA gaps appear on iOS
- Arabic + English content (for Muslims in English-speaking countries)
- Family plan (multi-user subscription)

---

## v2.0 — Platform (far future)

- Multi-user accounts (family plans)
- Creator marketplace (monetized journeys, revenue share)
- Taamun as a platform for any faith tradition (English + other languages)

---

## Principles

1. **No feature ships without real user validation.** "قلبي يتشرب معاني" remains the north star.
2. **Performance budget:** every new feature must maintain LCP < 6s on 3G mobile + pass the Lighthouse CI gate.
3. **Arabic-first:** no English-only flows. RTL throughout.
4. **Privacy:** no tracking pixels on prayer/reflection pages. Insights are user-only unless explicitly shared.
5. **Cost ceiling:** each milestone's operational cost must stay under $20/month total for first 1000 users.
