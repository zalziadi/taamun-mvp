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

## Next Milestone Goals

See `ROADMAP.md` for v1.1 priorities. Top candidates:

1. Real WhatsApp community (operational)
2. Push notifications (web push API)
3. Cycle 4+ infinite content via AI generation
4. Book comments/highlights
5. Email re-engagement automation (cron-driven)
