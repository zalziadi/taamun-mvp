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

## Decisions (resolved 2026-04-18)

1. **Push notification timing:** ✅ Default 6 AM local + user can customize in `/account`
2. **WhatsApp community:** ✅ Founder admin + 2-3 co-admins + auto-moderation bot (for spam)
3. **AI content generation:** ✅ Hybrid — shared pool baseline + per-user personalization on top
4. **Weekly digest:** ✅ Saturday (Arabic week start)

All 4 answered. Phase planning can proceed.
