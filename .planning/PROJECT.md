# Taamun (تمعّن) — Project State

**Domain:** spiritual-wellness · Quranic contemplation
**Tagline:** رحلة اكتشاف المعنى بلغة القرآن

---

## What Taamun Is

A 28-day program that transforms the user's relationship with the Quran from reading into lived experience. Built on three pillars:

1. **Silence → Verse → Reflection** — daily ritual, 5 minutes
2. **Shadow → Gift → Highest Potential** — three-phase transformation arc
3. **Personal AI Guide ("تمعّن")** — companion that knows the user's journey

---

## Tech Stack

```
Frontend    Next.js 14 App Router · React 18 · TypeScript · Tailwind CSS
Backend     Next.js API Routes · Supabase (PostgreSQL + Auth + RLS)
AI          Anthropic Claude · OpenAI embeddings · Munsit STT
Payment     Stripe · Salla · Tap (3 gateways)
Comms       Twilio SMS · Resend · WhatsApp Business
Analytics   PostHog · Meta Pixel
Hosting     Vercel (static + Fluid Compute)
```

---

## Current State (v1.0 — Shipped 2026-04-18)

**Scale:**
- 354+ commits over 2 months
- 398 TypeScript files · 52K LOC
- 54 pages · 77 API endpoints · 30 DB tables

**Shipped features:**
- ✅ 28-day program with 3 rotating cycles (الظل · النفس · السور)
- ✅ AI guide "تمعّن" with 6-stage conversation framework
- ✅ VIP experience: Gene Keys + BaZi + dynamic prompts
- ✅ Weekly challenges + daily verse rotation (post-28)
- ✅ Community pulse + WhatsApp integration
- ✅ Book reader with progress + bookmarks
- ✅ Streak protection (3 AM grace period)
- ✅ Minimal flat UI (user-requested, 2026-04-18)
- ✅ Lighthouse A11y: 100/100, SEO: 100/100
- ✅ First real customer validated: "قلبي يتشرب معاني" (day 9)

**Current subscription tiers:**
- Free 7-day trial
- Quarterly 199 SAR · Yearly 699 SAR · VIP 4,999 SAR

---

## Team

- Solo founder: Ziad (zalziadi.ads@gmail.com)
- Budget constraint: <10K SAR
- Distribution: Organic-first, Instagram-focused

---

## Current State: v1.2 shipped (2026-04-20)

**No active milestone.** Ready to scope v1.3 via `/gsd:new-milestone` when founder chooses.

**Operational TODO before v1.2 user-visible:** 6 SQL migrations pending `supabase db push` (see [MILESTONES.md](./MILESTONES.md) v1.2 row). Staging walkthrough checklist in [v1.2-MILESTONE-AUDIT.md](./v1.2-MILESTONE-AUDIT.md).

**Next milestone candidate: v1.3 — Depth & Personalization (backlog).** Deferred items ready for inclusion:
- Reflection themes ML clustering
- Long-term memory across sessions
- Voice journaling (Munsit integration)
- Arabic screen reader a11y audit
- YIR Ramadan annual moment (deferred from v1.2 decision #4)
- HMAC entitlement colon-split bug fix (discovered v1.2 Phase 9)
- BaZi VIP integration (promised in PROJECT.md, not yet shipped)
- Phase-07 anti-pattern guard comment-line carve-out patch

**Key context / constraints (carry-over):**
- Budget: <10K SAR, solo founder, Instagram-focused organic distribution, target 1,500 customers
- No feature ships without real user validation (north star: "قلبي يتشرب معاني")
- Performance budget: LCP < 6s on 3G mobile
- Arabic-first, RTL throughout, no tracking pixels on prayer/reflection pages
- v1.1 Phase 5 (WhatsApp community operational activation) remains independent track

---

## Shipped Milestones

- **v1.0** (shipped 2026-04-18) — Core 28-day program, AI guide, VIP, post-28 retention, minimal UI
- **v1.1** (shipped 2026-04-18) — Email automation · Web push · AI-generated cycles · Book highlights · WhatsApp infra (code)
- **v1.2** (shipped 2026-04-20) — إغلاق الحلقة · 6 phases · 70/71 REQs · CX 60→91 · zero new deps · 2 bugs caught · Ta'ammun DS site-wide · [audit](./v1.2-MILESTONE-AUDIT.md)

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

**Last updated:** 2026-04-18 — v1.2 milestone started
