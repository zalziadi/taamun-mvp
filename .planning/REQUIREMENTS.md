# Requirements — v1.1

Fresh requirements for the next milestone. Previous v1.0 requirements archived at [milestones/v1.0-REQUIREMENTS.md](./milestones/v1.0-REQUIREMENTS.md).

---

## User personas for v1.1

1. **New user (day 1-7)** — needs habit building, low friction
2. **Engaged user (day 8-28)** — needs depth, continuation
3. **Post-completion user (day 29+)** — needs reasons to return
4. **Dormant user (3+ days inactive)** — needs re-engagement
5. **VIP user** — needs exclusive depth, community access

---

## Must-have requirements

- [ ] Daily push notification (opt-in) sent at user's chosen morning time
- [ ] Auto-triggered completion email when user marks day 28 complete
- [ ] Auto-triggered re-engagement email after 3 days inactive
- [ ] Weekly digest email for all active subscribers
- [ ] Real WhatsApp community group (operational) — active admin
- [ ] Book highlights persist per-user in DB (not localStorage)

## Should-have

- [ ] AI-generated verse content for cycle 4+ (with cost cap)
- [ ] Private per-chapter book comments
- [ ] Reflection theme clustering (monthly insight)

## Nice-to-have

- [ ] Voice-based dhikr counter (tasbeeh via voice)
- [ ] Arabic screen reader audit (VoiceOver RTL)
- [ ] Family plan (multi-user subscription)

---

## Non-functional requirements (carried forward)

- Performance: LCP < 6s on 3G mobile
- Accessibility: Lighthouse A11y ≥ 95
- SEO: Lighthouse SEO = 100
- Cost: v1.1 feature work < 2000 SAR total (API calls, services)
- Privacy: zero tracking on prayer/reflection pages

---

## Open questions

1. **Push notification timing:** default to 6 AM local or let user pick?
2. **WhatsApp community:** admin = founder, co-admins, or auto-moderated?
3. **AI content generation:** per-user personalized or shared pool?
4. **Weekly digest:** Sunday (start of Arabic week) or Saturday?

Resolve these before phase planning.
