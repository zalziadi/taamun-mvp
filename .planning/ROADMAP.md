# Taamun Roadmap

---

## v1.0 — Core Experience (shipped 2026-04-18)

**Archived:** [v1.0-ROADMAP.md](./milestones/v1.0-ROADMAP.md) · [v1.0-REQUIREMENTS.md](./milestones/v1.0-REQUIREMENTS.md)

Complete 28-day program, AI guide, VIP tier, post-28 retention system, minimal UI.

---

## v1.1 — Growth & Retention (shipped 2026-04-18)

**Archived:** [v1.1-ROADMAP.md](./milestones/v1.1-ROADMAP.md) · [v1.1-REQUIREMENTS.md](./milestones/v1.1-REQUIREMENTS.md)

Email automation, web push, AI infinite cycles, DB-backed book notes, WhatsApp broadcast infrastructure.

---

## v1.2 — Depth & Personalization (planning)

**Goal:** transform retention machinery into personal, insightful companionship.

### Candidate phases

#### Phase 1: Reflection Theme Clustering
- Monthly ML analysis of user reflection text (no external AI — use embeddings)
- Surface top 3 recurring themes to the user ("laughter · solitude · gratitude")
- Guide references these themes in conversations
- **Depends on:** reflection text ≥ 20 entries per user (meaningful sample size)

#### Phase 2: Guide Long-term Memory
- Currently: guide uses recent context only (last 10 messages)
- Add: soul_summary that evolves over weeks (compressed narrative of user's journey)
- Stored in user_memory table, updated weekly by AI summarization
- Result: guide references events from months ago naturally
- **Depends on:** user reflection history (3+ months ideal)

#### Phase 3: Voice Journaling
- Extend Munsit integration (already wired for /guide/voice)
- Voice-recorded reflections → transcribed → stored alongside typed ones
- Tasbeeh counter via voice detection (count dhikr hands-free)
- **Depends on:** Munsit API quota allocation

#### Phase 4: Accessibility Audit (Arabic Screen Reader)
- Full VoiceOver/TalkBack audit in Arabic/RTL
- Fix any announced text that's misaligned or cut off
- Ensure all interactive elements have proper aria-labels in Arabic
- Validate with real blind user testing (if possible)
- **Depends on:** testing partner or audit service

#### Phase 5: Personal Insight Feed
- New `/insights` page — timeline of user's discoveries
- AI extracts key insights from reflections + surfaces them periodically
- "Looking back: on day 12 you wrote X. Today's verse echoes it."
- **Depends on:** Phase 1 (theme clustering) foundation

---

## v1.3+ — Backlog (unplanned)

- Community features inside app (not just WhatsApp)
- Sharing insights publicly (opt-in)
- Mobile app wrapper (PWA polish or native shell)

---

## v2.0 — Platform (far future)

- Multi-user accounts (family plans)
- Content creators publish their own 28-day journeys
- Embeddable widget for imams/teachers

---

## Principles

1. **No feature ships without real user validation.** "قلبي يتشرب معاني" is the north star.
2. **Performance budget:** every new feature must maintain LCP < 6s on 3G mobile.
3. **Arabic-first:** no English-only flows. RTL throughout.
4. **Privacy:** no tracking pixels on prayer/reflection pages.
5. **Cost ceiling:** each milestone's operational cost must stay under $20/month total for first 1000 users.
