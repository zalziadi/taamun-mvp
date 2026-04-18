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

## Current Milestone: v1.2 إغلاق الحلقة (Retention Loop)

**Goal:** Transform the 28-day experience from a program that ends into a year-long relationship — by closing six retention gaps between Day 28 and Day 365.

**Target features:**
- Cycle 2 Transition UX — in-app CTA on Day 28 instead of a silent wall
- Milestone Badges — activate trigger logic on days 1 / 3 / 7 / 14 / 21 / 28
- Year-in-Review — annual retrospective page aggregating 365 reflections + awareness trajectory + insights
- Renewal Prompts In-App — 7-day-before-expiry reminder surfaced inside the product
- Referral Program — "ادع صديق، خذ شهر مجاني" to convert "قلبي يتشرب معاني" advocacy into growth
- PostHog Event Instrumentation — day_complete, cycle_start, badge_unlock, renewal_prompted (foundation for data-driven v1.3)

**Key context / constraints:**
- Budget: <10K SAR, solo founder, Instagram-focused organic distribution, target 1,500 customers
- No feature ships without real user validation (north star: "قلبي يتشرب معاني")
- Performance budget: LCP < 6s on 3G mobile — every feature respects it
- Arabic-first, RTL throughout, no tracking pixels on prayer/reflection pages
- v1.1 Phase 5 (WhatsApp community) is operationally-blocked and will NOT be unblocked in v1.2 — that's an independent operational decision
- v1.2 phase numbering continues from v1.1 → starts at Phase 6

---

## Shipped Milestones

- **v1.0** (shipped 2026-04-18) — Core 28-day program, AI guide, VIP, post-28 retention, minimal UI
- **v1.1** (shipped 2026-04-18) — Email automation · Web push · AI-generated cycles · Book highlights · WhatsApp infra (code)

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
