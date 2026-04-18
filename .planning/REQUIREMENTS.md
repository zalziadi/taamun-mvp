# Requirements — v1.4

Fresh requirements for the next milestone.
v1.3 archived at [milestones/v1.3-REQUIREMENTS.md](./milestones/v1.3-REQUIREMENTS.md).

---

## Mission

v1.3 gave users channels to spread Taamun. v1.4 builds **places to come back together** — a community space inside the app and tools for trusted voices to publish their own journeys. Close the loop: acquisition (v1.3) → retention (v1.1) → depth (v1.2) → **belonging**.

---

## User personas for v1.4

1. **Invited user who subscribed** — deserves their free-month credit applied
2. **Engaged user** — wants to discuss today's verse without leaving Taamun
3. **VIP / teacher / imam** — wants to publish a guided mini-journey
4. **Prospect clicking a shared insight** — sees a beautifully rendered OG image
5. **Year-anniversary user** — gets an email with their recap

---

## Must-have requirements

- [ ] Apply +30-day credit to inviter and invitee on first successful subscription
- [ ] In-app threads attached to days or verses, moderated via auto-flag + founder review
- [ ] Creator mode (VIP): publish a 7- or 14-day mini-journey
- [ ] OG image for shared insights — Arabic calligraphy aesthetic

## Should-have

- [ ] `/discover` page showing all published creator journeys
- [ ] Thread reply notifications (via push)
- [ ] Year-end recap email (Dec 31 or Hijri new year)

## Nice-to-have

- [ ] Moderation dashboard for flagged insights + threads
- [ ] Creator revenue share (pending monetization model decision)
- [ ] English translation for creator journeys (opt-in)

---

## Non-functional requirements (carried forward)

- Performance: LCP < 6s on 3G mobile (Lighthouse CI gate enforced)
- Accessibility: Lighthouse A11y ≥ 0.95
- SEO: creator pages + thread pages indexable
- Cost: v1.4 feature work < 3000 SAR total
- Privacy: threads are public; user chooses anon or attributed display name
- Moderation: founder-review queue, no automated bans

---

## Open questions

1. **Credit event trigger:** apply credit on first successful payment, or after 30 days of active use (to prevent immediate-cancellation fraud)?
2. **Thread identity:** allow real name, pseudonym only, or both?
3. **Creator approval:** any VIP can publish, or does founder review first draft?
4. **OG image fonts:** Amiri only, or offer a few calligraphy variants?
5. **Year-end recap:** calendar Dec 31 (familiar) or Hijri new year (contextually appropriate)?

Resolve before phase planning.

---

## Success criteria

- ≥ 50% of invited subscribers receive their credit within 48h of subscription
- ≥ 20% of daily active users visit a thread page at least once per week
- ≥ 5 published creator journeys with ≥ 3 subscribers each
- Shared insight OG images generate ≥ 3× click-through vs text-only
- Zero moderation escalations that require public apology
