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

## Current State (v1.1 — Shipped 2026-04-18)

**Scale:**
- 376+ commits over 2 months
- 413+ TypeScript files · 53K+ LOC
- 57+ pages · 86+ API endpoints · 34 DB tables

**v1.0 shipped features (core):**
- ✅ 28-day program with 3 rotating cycles (الظل · النفس · السور)
- ✅ AI guide "تمعّن" with 6-stage conversation framework
- ✅ VIP experience: Gene Keys + BaZi + dynamic prompts
- ✅ Weekly challenges + daily verse rotation (post-28)
- ✅ Book reader with progress + bookmarks
- ✅ Streak protection (3 AM grace period)
- ✅ Minimal flat UI (user-requested)
- ✅ Lighthouse A11y: 100/100, SEO: 100/100
- ✅ First real customer validated: "قلبي يتشرب معاني" (day 9)

**v1.1 shipped features (retention):**
- ✅ Email automation: weekly digest + re-engagement emails via Saturday cron
- ✅ Web push notifications: service worker + VAPID + user-customizable time
- ✅ AI infinite cycles: cycles 4+ via Claude API (~$0.08/cycle shared pool)
- ✅ DB-backed book notes: bookmarks + quotes + reflective notes
- ✅ WhatsApp community infrastructure: broadcast endpoint + day-3 invite

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

See `ROADMAP.md` for v1.2 priorities. Focus shifts from retention to **depth**:

1. Reflection theme clustering (monthly ML analysis per user)
2. Guide long-term memory (soul_summary evolving weekly)
3. Voice journaling (extend Munsit beyond /guide/voice)
4. Arabic screen reader audit (VoiceOver + TalkBack)
5. Personal insight feed (/insights page)
