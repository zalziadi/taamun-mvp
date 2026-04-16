# UX Improvements Design — Taamun MVP

**Date:** 2026-04-16
**Scope:** 3 improvements to raise UX score from 70 → ~85/100
**Approach:** B (Integrated Medium) — real improvements with contained risk

---

## Improvement 1: Onboarding — `/welcome` Page

### Purpose
New users land on `JourneyLanding` with no context about what Taamun is. A dedicated `/welcome` page explains the concept before they see pricing or program details.

### Design

**Visual theme:** Light background (`#fcfaf7`), dark text (`#2f2619`), gold-brown accents (`#8a6914`, `#5a4a35`). Contrasts with the dark app theme — the welcome page feels open and inviting, then the app itself feels like entering a deeper space.

**Content structure:**
1. **Logo + tagline:** "تمعّن — رحلة اكتشاف المعنى بلغة القرآن"
2. **Philosophical question:** "ماذا لو أن القرآن الكريم كُتب ليقرأك أنت قبل أن تقرأه؟" — "أنت" emphasized in gold, larger font
3. **Three points (white Arabic, each ending with a question):**
   - **ما هو تمعّن؟** — "ليس تفسيراً، ولا درساً، ولا حفظاً. ماذا لو كانت كل آية تحمل رسالة كُتبت لك وحدك؟"
   - **كيف يعمل؟** — "٢٨ يوماً — كل يوم آية واحدة، لحظة صمت، طبقة أعمق، وتأمل تكتبه بيدك. ومعك تمعّن — لكن هل سبق أن سألك أحد: ماذا تشعر حين تقرأ؟"
   - **ماذا ستجد؟** — "ليست معلومات — بل تجربة. متى كانت آخر مرة توقفت فيها عند آية... وسمعت ما تقوله لك؟"
4. **CTA:** "ابدأ الرحلة" button → `/auth`
5. **Sub-CTA:** "أول ٣ أيام مجانية بالكامل"

**Routing behavior:**
- Unauthenticated user with no `localStorage` flag `taamun.welcomed` → auto-redirect to `/welcome`
- After viewing `/welcome` → set `taamun.welcomed = true` in `localStorage`
- Subsequent visits → go to `JourneyLanding` (`/`) directly
- "ابدأ الرحلة" button → `/auth`
- Optional "اعرف أكثر" link at bottom → `/` (JourneyLanding)

### Files affected
- **New:** `src/app/welcome/page.tsx` — the welcome page (client component)
- **Modified:** `src/app/page.tsx` — add redirect logic for new unauthenticated users

---

## Improvement 2: Smart Paywall

### Purpose
Trial users currently hit 3 separate paywalls per day (hidden layer, exercise, journal), breaking the spiritual flow. Replace with a smarter system: first 3 days fully open, then 1 paywall at the end.

### Design

**Access rules:**

| User state | Day 1–3 | Day 4+ | Trial expired |
|------------|---------|--------|---------------|
| Trial (active) | Full access — no paywalls | Content open through BookQuote, then single SmartPaywall | Full-screen paywall (existing behavior) |
| Subscriber | Full access | Full access | N/A |

**SmartPaywall message (day 4+):**
> "عشت ٣ أيام كاملة مع تمعّن. الرحلة بدأت تتعمّق — هل تكمل؟"

- Single CTA to `/pricing`
- WhatsApp contact option (existing)
- `paywall_viewed` analytics event with reason `smart_paywall_day_4_plus`

**Logic:**
- `DayExperience.tsx`: check `dayNumber <= 3` → render all components without access gates
- `DayExperience.tsx`: check `dayNumber > 3 && !subscriber` → render content up to BookQuote, then single `SmartPaywall` component
- Remove the 3 separate `trial_active_locked` paywall instances
- Trial expired behavior remains unchanged

### Files affected
- **Modified:** `src/components/DayExperience.tsx` — replace 3 paywalls with smart logic
- **Modified:** `src/components/Paywall.tsx` — add `smart_paywall` type with custom message
- No new files needed

---

## Improvement 3: تمعّن Guide Personality

### Purpose
The AI guide is called "مرشد مدينة المعنى" — generic and impersonal. Give it the name "تمعّن" with a warm, friend-like personality that adapts its introduction based on the subscriber's journey stage.

### Design

**Identity:**

| Attribute | Value |
|-----------|-------|
| Name | تمعّن |
| Role | مرشدك الشخصي في رحلة اكتشاف المعنى |
| Tone | Warm friend, present, unhurried, non-judgmental |
| Language | Simple white Arabic (عربية بيضاء بسيطة) |

**Dynamic introduction based on journey stage:**

| Stage | تمعّن says |
|-------|-----------|
| First visit (no day completed) | "أهلاً، أنا تمعّن. سأكون معك في هذه الرحلة. لست هنا لأعطيك إجابات — بل لأسألك الأسئلة التي ربما لم يسألك إياها أحد من قبل." |
| Day 1–7 (Shadow phase) | "مرحباً من جديد. أنت الآن في أيام الظل — كل ما تحتاجه هو أن تنظر. هل هناك شيء شاغل بالك اليوم؟" |
| Day 8–14 (Gift phase) | "أحسّ إنك بدأت تشوف أشياء ما كنت تلاحظها. الآيات بدأت تتكلم — ماذا سمعت اليوم؟" |
| Day 15–28 (Best possibility) | "وصلت بعيد. الرحلة الآن ليست عن القرآن — بل عنك أنت. ماذا تريد أن تحمل معك من هذه التجربة؟" |
| Returning after gap | "رجعت. هذا بحد ذاته شيء جميل. لا تشغل بالك بما فاتك — خلينا نبدأ من هنا." |

**Updated quick prompts (questions, not informational):**
1. "ماذا أشعر حين أقرأ القرآن؟"
2. "كيف أبدأ أسمع ما تقوله لي الآية؟"
3. "ما الذي يمنعني من التوقف عند الآية؟"

**System prompt changes:**
- Replace identity block opening: "أنت مرشد وعي ذاتي" → "أنت تمعّن — المرشد الشخصي للمستخدم في رحلة اكتشاف المعنى بلغة القرآن. أنت صديق دافئ يثق فيه المستخدم."
- Add dynamic greeting selection based on `memory.current_day` and visit type
- Keep existing 6 conversation stages and rules unchanged

### Files affected
- **Modified:** `src/lib/guide-prompt.ts` — update identity block, add dynamic greeting logic
- **Modified:** `src/app/guide/page.tsx` — change initial message to dynamic greeting, update quick prompts

---

## Files Summary

| File | Action | Improvement |
|------|--------|-------------|
| `src/app/welcome/page.tsx` | New | 1 (Onboarding) |
| `src/app/page.tsx` | Modified | 1 (Onboarding redirect) |
| `src/components/DayExperience.tsx` | Modified | 2 (Smart Paywall) |
| `src/components/Paywall.tsx` | Modified | 2 (Smart Paywall type) |
| `src/lib/guide-prompt.ts` | Modified | 3 (Guide personality) |
| `src/app/guide/page.tsx` | Modified | 3 (Guide greeting + prompts) |

**Total:** 1 new file, 5 modified files.

---

## Out of Scope
- Wizard/multi-step onboarding
- Entitlement system rewrite
- Guide avatar or voice
- Guide long-term memory changes
- Pricing page redesign
- Accessibility improvements
