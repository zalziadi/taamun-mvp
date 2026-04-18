# Requirements — v1.2

Fresh requirements for the next milestone.
v1.1 archived at [milestones/v1.1-REQUIREMENTS.md](./milestones/v1.1-REQUIREMENTS.md).

---

## Mission

Transform Taamun from "retention machine" into "personal companion" — the user should feel the app *knows* them, not just remembers them.

---

## User personas for v1.2

1. **Long-term user (3+ months)** — has 60+ reflections, wants depth
2. **Returning VIP** — expects the guide to remember past conversations
3. **Heavy journaler** — writes long reflections, wants themes surfaced
4. **Accessibility-dependent user** — uses screen reader, needs Arabic RTL audit
5. **Voice-first user** — prefers speaking to typing (morning dhikr, voice reflections)

---

## Must-have requirements

- [ ] Monthly reflection theme extraction (top 3 recurring themes per user)
- [ ] Guide long-term memory: `soul_summary` that evolves weekly
- [ ] Voice reflection recording (in addition to typed)
- [ ] Arabic screen reader audit with fixes (VoiceOver + TalkBack)

## Should-have

- [ ] Personal insight feed (`/insights` page)
- [ ] Guide references insights in conversations ("على ذكر الصبر — كتبت قبل شهر...")
- [ ] Voice tasbeeh counter (hands-free dhikr)

## Nice-to-have

- [ ] Insight sharing (opt-in, anonymous)
- [ ] "Year in Taamun" end-of-year recap email
- [ ] PWA install prompt after day 7

---

## Non-functional requirements (carried forward)

- Performance: LCP < 6s on 3G mobile
- Accessibility: Lighthouse A11y ≥ 95 + validated with real Arabic SR testing
- SEO: Lighthouse SEO = 100
- Cost: v1.2 feature work < 3000 SAR total (includes theme ML + voice transcription)
- Privacy: zero tracking on prayer/reflection pages · insight extraction is user-only

---

## Decisions (resolved 2026-04-18)

User answered "yes to all":

1. **Theme clustering:** ✅ OpenAI embeddings (text-embedding-3-small, cheap + project already has `OPENAI_API_KEY`)
2. **soul_summary cadence:** ✅ Both — weekly updates + milestone-triggered deeper refresh (day 14/28/60)
3. **Voice storage:** ✅ Keep audio + transcription by default, user can delete (most flexible)
4. **Insights visibility:** ✅ Both — inline card on home + dedicated `/insights` page
5. **Accessibility audit:** ✅ Automated tools first (axe-core + Lighthouse CI), beta feedback layered on

All 5 answered. Phase planning can proceed.

---

## Success criteria

- At least 3 users with 60+ reflections each provide explicit positive feedback on "the guide remembered me"
- Arabic screen reader audit identifies ≤ 5 issues (the product should mostly work already)
- Voice reflection adoption ≥ 20% of active users who try it
- Theme clustering surfaces non-obvious connections in ≥ 80% of eligible users
