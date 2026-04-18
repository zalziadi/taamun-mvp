# Taamun Roadmap

---

## v1.0 — Core Experience (shipped 2026-04-18)

**Archived:** [v1.0-ROADMAP.md](./milestones/v1.0-ROADMAP.md)

Complete 28-day program, AI guide, VIP tier, post-28 retention system, minimal UI.

---

## v1.1 — Growth & Retention (planning)

**Goal:** convert existing users to long-term subscribers + activate dormant accounts.

### Candidate phases (to be scoped):

#### Phase 1: WhatsApp Community Integration
- Create real WhatsApp community group
- Auto-post daily verse from server (webhook)
- Onboard new subscribers into the group
- **Depends on:** operational decision (group admin, moderation policy)

#### Phase 2: Push Notifications
- Web Push API setup (VAPID keys)
- Service worker for notifications
- Morning reminder ("آية اليوم جاهزة") — opt-in only
- Streak-at-risk nudge (last 4 hours before day end)
- **Depends on:** service worker + HTTPS (already available)

#### Phase 3: Infinite Content via AI
- Generate cycle 4+ content dynamically using Claude API
- User-specific verse selection based on reflection history
- Cost control: cap at 1 cycle per user per month
- **Depends on:** Anthropic API budget allocation

#### Phase 4: Book Enhancements
- Highlight text in book viewer
- Private user comments per chapter
- "Recommended sections" based on current reflection themes
- **Depends on:** DB migration for book_highlights table

#### Phase 5: Email Re-engagement Automation
- Cron: detect 3+ days inactive → send "we miss you" email
- Cron: detect day 28 completion → auto-send celebration email (already coded, needs activation)
- Weekly digest email: "your week in Taamun" (reflection count, streak, insights)
- **Depends on:** Resend quota

---

## v1.2 — Depth & Personalization (backlog)

- Reflection themes analysis (ML clustering on user reflections)
- Guide remembers user across sessions (long-term memory beyond session scope)
- Voice journaling (Munsit integration for dhikr/reflection)
- Arabic screen reader quality audit

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
4. **Privacy:** no tracking pixels on prayer/reflection pages.
