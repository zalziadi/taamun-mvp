# Requirements — v1.3

Fresh requirements for the next milestone.
v1.2 archived at [milestones/v1.2-REQUIREMENTS.md](./milestones/v1.2-REQUIREMENTS.md).

---

## Mission

v1.2 made Taamun personal. v1.3 makes it **spreadable**. A user in their 90th day should generate new users without the founder spending a riyal on paid acquisition.

---

## User personas for v1.3

1. **Grateful user (60+ days)** — would share but has no easy way
2. **Curious prospect** — receives a shared insight link from a friend
3. **Annual user (365+ days)** — earned a recap they want to share
4. **Mobile-first user** — wants install-like experience without the App Store friction
5. **VIP advocate** — brought 3 friends to the platform, wants recognition

---

## Must-have requirements

- [ ] PWA install prompt (opt-in) shown after day 7, once per session, dismissable
- [ ] Offline reading for today's verse (service worker caches last 3 days)
- [ ] Invite link system (`/invite/[code]`) with referral tracking
- [ ] "Year in Taamun" recap page + email (for users with ≥ 90 days history)

## Should-have

- [ ] Shareable themes/insights (opt-in, anonymous, static pages)
- [ ] Voice tasbeeh (hands-free dhikr counter)
- [ ] Referral reward: 1 free month for both parties on successful subscription

## Nice-to-have

- [ ] OG image generation for shareable quotes (Arabic calligraphy aesthetic)
- [ ] Leaderboard-free progress sharing ("I finished day 28 of تمعّن")
- [ ] Mobile native wrapper (Capacitor) if PWA gaps appear on iOS

---

## Non-functional requirements (carried forward)

- Performance: LCP < 6s on 3G mobile (keep Lighthouse CI gate passing)
- Accessibility: Lighthouse A11y ≥ 0.95 (already enforced in CI)
- SEO: `/shared/*` pages fully indexable + structured data
- Cost: v1.3 feature work < 3000 SAR total
- Privacy: sharing is opt-in only; no PII in shared pages
- Content moderation: one-line text content in shared pages review-able by founder

---

## Open questions

1. **Invite reward type:** free month for both, VIP trial, or % discount?
2. **Recap trigger:** at day 365, at Hijri new year, or at calendar year-end?
3. **PWA install prompt timing:** day 7, day 14, or on milestone day 28?
4. **Share moderation:** instant (auto-approve) or queued for founder review?
5. **Voice tasbeeh acoustic model:** Munsit streaming, Web Speech API, or lightweight custom VAD?

Resolve before phase planning.

---

## Success criteria

- At least 10% of active users ≥ day 30 install the PWA after the prompt
- Invite → signup conversion ≥ 5%
- At least 20 shared insight pages generate ≥ 5 visits each
- Year-in-Taamun recap opens ≥ 40% of eligible users
- Zero content moderation incidents in shared pages
