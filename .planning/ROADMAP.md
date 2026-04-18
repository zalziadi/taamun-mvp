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

Guide long-term memory (soul_summary), reflection theme clustering, `/insights` page, voice journaling, A11y CI gate.

---

## v1.3 — Reach & Distribution (planning)

**Goal:** v1.2 made it personal. v1.3 makes it **spreadable** — users invite others, the app surfaces publicly, insights turn into artifacts worth sharing.

### Candidate phases

#### Phase 1: PWA Polish + Install Prompt
- Service worker caching for offline verse reading
- `manifest.json` hardening (icons, splash, theme)
- Install prompt shown after day 7 (with dismiss logic)
- iOS Add-to-Homescreen guidance page
- **Depends on:** existing service worker (already shipped for push)

#### Phase 2: Invite Flow
- Unique invite link per user (`/invite/[code]`)
- Referrer gets 1 free month if invitee subscribes
- Landing page variant that shows "referred by {name}" context
- Tracks conversion in `referral_credits` table
- **Depends on:** decision on incentive type (month vs discount vs VIP trial)

#### Phase 3: "Year in Taamun" Recap
- Annual email / `/recap` page summarizing user's year
- Shows total reflections, top themes, soul_summary evolution
- Shareable image card (built server-side via OG image API)
- **Depends on:** v1.2 themes + soul_summary data accumulation (needs ≥ 6 months)

#### Phase 4: Public Shareable Insights
- Opt-in: user can share a theme or insight as an anonymous quote
- Public `/shared/[slug]` pages (static, SEO-indexed)
- Landing-page-quality design, Arabic typography, breathable
- **Depends on:** moderation policy + legal review (is anonymous sharing ok?)

#### Phase 5: Voice Tasbeeh (hands-free)
- Extends v1.2 voice infra
- Mic listens for "سبحان الله" / "الحمد لله" / "الله أكبر"
- Counts automatically during dhikr sessions
- **Depends on:** Munsit streaming mode or alternative lightweight VAD

---

## v1.4+ — Backlog

- In-app community (threaded discussions, without leaving the app)
- Creator mode: users publish their own 28-day journeys
- Arabic teachers/imams can embed Taamun widgets in their sites
- Mobile native wrapper (Capacitor or Tauri) if PWA hits limits

---

## v2.0 — Platform (far future)

- Multi-user accounts (family plans)
- Creator marketplace (monetized journeys)
- Taamun as a platform for any faith tradition (English + other languages)

---

## Principles

1. **No feature ships without real user validation.** "قلبي يتشرب معاني" remains the north star.
2. **Performance budget:** every new feature must maintain LCP < 6s on 3G mobile + pass the Lighthouse CI gate.
3. **Arabic-first:** no English-only flows. RTL throughout.
4. **Privacy:** no tracking pixels on prayer/reflection pages. Insights are user-only unless explicitly shared.
5. **Cost ceiling:** each milestone's operational cost must stay under $20/month total for first 1000 users.
