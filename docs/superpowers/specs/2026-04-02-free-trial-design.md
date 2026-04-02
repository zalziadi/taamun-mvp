# Free Trial Design — "تذوّق ثم تعطّش"

**Date:** 2026-04-02
**Status:** Approved
**Author:** Ziad + Claude

---

## Overview

7-day free trial that gives users a taste of Taamun's core experience (daily contemplation + AI guide) while keeping the full journey, book, tasbeeh, and deep features locked. After 7 days, only the daily verse remains — everything else locks behind a spiritual-tone paywall that reminds users of what they experienced.

## User States

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Anonymous   │────▶│  Trial (7d)  │────▶│ Trial Expired│
│  (landing)   │     │  (limited)   │     │ (verse only) │
└─────────────┘     └──────────────┘     └──────────────┘
                           │                      │
                           ▼                      ▼
                    ┌──────────────┐        ┌──────────────┐
                    │  Subscriber  │◀───────│   Paywall    │
                    │  (full)      │        │  (convert)   │
                    └──────────────┘        └──────────────┘
```

## Trial Access Matrix

### During Trial (7 days)

| Feature | Access | Limit |
|---------|--------|-------|
| تنفّس وتهيّأ (Step 1) | OPEN | — |
| آية اليوم (Step 2) | OPEN | — |
| سؤال التأمل (Step 3) | OPEN | — |
| التمرين والتدوين (Step 4) | LOCKED | "سجّل تأملاتك في دفترك الخاص — مع الاشتراك" |
| الطبقة المخفية (Step 5) | LOCKED | "الطبقة الأعمق للمشتركين فقط" |
| المرشد الذكي | OPEN | 5 messages/day (localStorage counter, resets daily) |
| الرحلة (/program, 28 days) | LOCKED | "الرحلة الكاملة تنتظرك… ٢٨ يوماً من التحوّل" |
| الكتاب (/book) | LOCKED | "الكتاب هو الأساس الذي بُنيت عليه رحلتك" |
| السبحة (/tasbeeh) | LOCKED | "مسبحة الأسماء الحسنى تُفتح مع اشتراكك" |
| دفتر التأمل (/journal) | LOCKED | "دفترك الشخصي ينتظر أول تأمل" |

### After Trial Expires

| Feature | Access | Details |
|---------|--------|---------|
| آية اليوم (verse only) | OPEN | No question, no exercise, no guide — just the verse. The permanent hook. |
| Everything else | LOCKED | Paywall with spiritual + soft urgency tone |

## Paywall Messages

### Type: `trial_active_locked` (during trial, locked features)

Short contextual message per feature. No pricing. Just what's behind the door.

### Type: `trial_ended` (after 7 days, main paywall)

```
رحلتك بدأت… لكنها لم تكتمل

عشت {days_used} أيام مع المرشد والتأمل.
الرحلة الكاملة فيها ٢١ يوماً باقية —
٩ مجالات قرآنية، دفتر تأمل شخصي،
والكتاب الذي بُني عليه كل شيء.

مقعدك لا يزال محفوظاً.

[أكمل رحلتك — ١٩٩ ر.س]  [تواصل عبر واتساب]
```

### Type: `guide_limit_reached` (5 messages/day during trial)

```
وصلت لحد المرشد اليومي (٥ رسائل)

المرشد يرافقك بلا حدود مع الاشتراك الكامل.
نشوفك بكرة؟ أو…

[افتح المرشد بلا حدود — اشترك الآن]
```

## Technical Changes

### 1. `src/lib/subscriptionAccess.ts` (NEW)

Central access-check module. Single source of truth for what each tier can access.

```typescript
type Feature = 'day_steps_1_3' | 'day_steps_4_5' | 'guide' | 'journey' | 'book' | 'tasbeeh' | 'journal';
type AccessResult = { allowed: boolean; reason?: string; paywallType?: string };

function checkAccess(feature: Feature, profile: Profile): AccessResult
function isTrialActive(profile: Profile): boolean
function isTrialExpired(profile: Profile): boolean
function getTrialDaysUsed(profile: Profile): number
```

### 2. `src/components/DayExperience.tsx` (MODIFY)

- Import `checkAccess` from subscriptionAccess
- Steps 1-3: render normally for trial
- Steps 4-5: wrap in access check → show inline lock with message if trial
- After trial expires: show verse only (step 2 content) + Paywall

### 3. `src/app/guide/page.tsx` (MODIFY)

- Add daily message counter (localStorage key: `taamun.guide.daily.{YYYY-MM-DD}`)
- Before sending message: check counter < 5 for trial users
- At limit: show `guide_limit_reached` paywall inline
- Paid users: no limit

### 4. `src/components/Paywall.tsx` (MODIFY)

Add new paywall types:
- `trial_active_locked` — contextual lock message (no pricing)
- `trial_ended` — full spiritual paywall with pricing + WhatsApp
- `guide_limit_reached` — guide-specific limit message

All messages use the spiritual + soft urgency tone. Include `days_used` from profile.

### 5. `src/app/book/page.tsx` (VERIFY)

Current logic already gates on subscription tier. Verify that `trial` tier does NOT appear in the allowed tiers list. If it does, remove it.

### 6. `src/app/tasbeeh/page.tsx` (VERIFY)

Same — verify trial tier is excluded from access.

### 7. `src/app/day/page.tsx` (MODIFY)

- After trial expires: render only the verse block (no other steps)
- Show `trial_ended` paywall below the verse

### 8. Landing Page CTA Flow

Current: "ابدأ تجربتك المجانية" → WhatsApp
Target: "ابدأ تجربتك المجانية" → `/auth` (sign up) → auto-activate trial → `/day`

The trial activation already exists in `/api/checkout` with `tier="trial"`. Wire the landing page CTA to the signup flow, and auto-activate trial on first login.

### 9. Auto-activate Trial on First Login

In `/auth/callback/route.ts` or in the homepage (`page.tsx`):
- Check if user has no subscription (new user)
- If new: POST `/api/checkout` with `tier="trial"` automatically
- Redirect to `/day`

## Files Changed Summary

| File | Action | Priority |
|------|--------|----------|
| `src/lib/subscriptionAccess.ts` | CREATE | P0 |
| `src/components/Paywall.tsx` | MODIFY | P0 |
| `src/components/DayExperience.tsx` | MODIFY | P0 |
| `src/app/day/page.tsx` | MODIFY | P0 |
| `src/app/guide/page.tsx` | MODIFY | P1 |
| `src/app/book/page.tsx` | VERIFY | P1 |
| `src/app/tasbeeh/page.tsx` | VERIFY | P1 |
| `src/app/auth/callback/route.ts` | MODIFY | P1 |
| `src/app/EidiyaLanding.tsx` | MODIFY (CTA) | P2 |

## Success Criteria

1. New user signs up → trial auto-activates → sees steps 1-3 + guide (5 msg/day)
2. Steps 4-5, book, tasbeeh, journal, full journey = locked with contextual message
3. After 7 days → only verse shows → paywall with spiritual tone + pricing
4. Guide shows limit message at 5 msgs/day during trial
5. Paid subscriber sees everything, no limits
6. Admin bypasses all gates
