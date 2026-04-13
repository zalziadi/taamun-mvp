# Taamun — Real Architecture (Ground Truth)

**آخر تحديث:** 10 أبريل 2026
**مصدر البيانات:** فحص مباشر لكل ملف على الـ disk — لا تخمين، لا افتراضات.

> هذا الملف هو المرجع الوحيد المعتمد لأي Agent أو مطوّر يعمل على المشروع.
> أي ادعاء بوجود ملف غير مذكور هنا يجب التحقق منه قبل الاعتماد عليه.

---

## 1. نظرة عامة

Taamun (تمعّن) — تطبيق ويب Next.js 14 (App Router) لبرنامج تمعّن قرآني مدته 28 يوماً.

- **Framework:** Next.js 14 + TypeScript + Tailwind CSS
- **Auth:** Supabase Auth (Magic Link + Phone OTP عبر Twilio)
- **DB:** Supabase (PostgreSQL)
- **Payment:** Stripe + Salla + Tap (ثلاث بوابات)
- **AI Agents:** وردة + مسخّر + سمرا (Claude API — Twitter/Instagram فقط)
- **Analytics:** PostHog (مينيمالي)
- **Hosting:** Vercel

---

## 2. طبقة الذكاء (Intelligence Layer) — ما هو موجود فعلاً

هذه هي كل ملفات الذكاء الموجودة على الـ disk مع حجمها الحقيقي:

### 2.1 المُنسّق والدماغ (Core Decision)

| الملف | الأسطر | الوظيفة |
|-------|--------|---------|
| `src/lib/orchestrator.ts` | 540 | المُنسّق الموحّد — يجمع كل الإشارات ويُخرج قرار واحد |
| `src/lib/system/brain.ts` | 354 | System Brain (V8) — يكشف حالة المستخدم (new/lost/active/balanced) ويُرجع primaryAction |
| `src/lib/decisionEngine.ts` | 336 | محرك القرارات — DPOS structured decision |
| `src/lib/decisionLayer.ts` | 98 | طبقة القرارات (V2) — justification + context |
| `src/lib/nextStep.ts` | 241 | يحسب الخطوة التالية للمستخدم |
| `src/lib/cognitiveContext.ts` | 176 | سياق معرفي — يُغذّي الـ orchestrator |

### 2.2 الذاكرة والهوية (Memory & Identity)

| الملف | الأسطر | الوظيفة |
|-------|--------|---------|
| `src/lib/journey/memory.ts` | 408 | Journey Memory (V9) — حالة الرحلة عبر الجلسات |
| `src/lib/identity/reflection.ts` | 75 | انعكاس الهوية (V3) |
| `src/lib/identity/update.ts` | 67 | تحديث الهوية |
| `src/lib/identityTracker.ts` | 171 | تتبع الهوية عبر الزمن |
| `src/lib/narrative/memory.ts` | 98 | ذاكرة سردية |
| `src/lib/narrativeEngine.ts` | 79 | محرك السرد |
| `src/lib/journeyState.ts` | 74 | حالة الرحلة (legacy) |

### 2.3 الأنماط والسلوك (Patterns & Behavior)

| الملف | الأسطر | الوظيفة |
|-------|--------|---------|
| `src/lib/patterns/userPattern.ts` | 180 | تصنيف المستخدم: decisive/avoidant/explorer/balanced (V7) |
| `src/lib/patterns/predict.ts` | 109 | تنبؤ بالخطوة التالية |
| `src/lib/behavior/userBehavior.ts` | 165 | تتبع سلوك المستخدم عبر localStorage (V7) |
| `src/lib/adaptive/learn.ts` | 159 | محرك التعلم التكيفي (V4) |
| `src/lib/adaptive/model.ts` | 65 | نموذج تكيفي |
| `src/lib/scoring.ts` | 89 | نظام النقاط |
| `src/lib/streak.ts` | 15 | تتبع المتابعة اليومية |

### 2.4 التجربة والعرض (Experience Engines)

| الملف | الأسطر | الوظيفة |
|-------|--------|---------|
| `src/lib/prism/engine.ts` | 358 | Prism Engine — طبقة تجربة بين البيانات والمُنسّق |
| `src/lib/cityEngine.ts` | 274 | City of Awareness — 9 مناطق وعي مرتبطة بالتقدم |
| `src/lib/awareness-engine.ts` | 137 | محرك الوعي |
| `src/lib/city-of-meaning.ts` | 130 | خريطة مدينة المعنى |
| `src/lib/ritualEngine.ts` | 219 | تحويل الاستخدام اليومي إلى طقس |
| `src/lib/personalityEngine.ts` | 216 | محرك الشخصية + مكافآت مصغرة |
| `src/lib/guidanceEngine.ts` | 208 | صوت المرشد الحي |
| `src/lib/progressEngine.ts` | 137 | محرك التقدم |

### 2.5 النبرة والتفاعل (Tone & Engagement)

| الملف | الأسطر | الوظيفة |
|-------|--------|---------|
| `src/lib/tone/index.ts` | 82 | نبرة ديناميكية |
| `src/lib/tone/pressure.ts` | 104 | ضغط تكيفي |
| `src/lib/engagement/anticipation.ts` | 64 | حلقة الترقب |
| `src/lib/actionGenerator.ts` | 107 | توليد أفعال مقترحة |
| `src/lib/events.ts` | 49 | نظام الأحداث |
| `src/lib/decision/justification.ts` | 122 | تبرير القرارات للمستخدم |

### 2.6 التأمل والربط (Reflection & Linking)

| الملف | الأسطر | الوظيفة |
|-------|--------|---------|
| `src/lib/reflection/generateReflection.ts` | 108 | توليد تأمل بـ AI |
| `src/lib/reflectionLinker.ts` | 140 | ربط التأملات ببعض |

### 2.7 المحتوى الثابت

| الملف | الأسطر | الوظيفة |
|-------|--------|---------|
| `src/lib/taamun-content.ts` | 386 | محتوى الـ 28 يوم (DayContent[]) |
| `src/lib/taamun-daily.ts` | 33 | محتوى يومي |
| `src/lib/ramadan-28.ts` | — | محتوى رمضان |
| `src/lib/design-tokens.ts` | 139 | نظام تصميم |

**إجمالي طبقة الذكاء: ~6,200 سطر كود حقيقي** — هذا نظام حقيقي وقوي.

---

## 3. الوكلاء الذكيون (AI Agents)

### ما هو موجود:

| الملف | الأسطر | الوظيفة |
|-------|--------|---------|
| `src/lib/agents/prompts.ts` | 233 | System prompts لوردة + مسخّر + سمرا (لكل platform) |
| `src/lib/agents/router.ts` | 69 | Smart Router — يصنّف الرسائل بـ keyword scoring |
| `src/lib/agents/claude.ts` | 69 | Claude API integration (claude-sonnet-4) |
| `src/lib/agents/twitter.ts` | 148 | Twitter DM + mentions |
| `src/lib/agents/instagram.ts` | 147 | Instagram DM + comments |
| `src/lib/agents/types.ts` | 34 | Types: AgentName, Platform, IncomingMessage, AgentResponse |

### حالة القنوات:

| القناة | الكود | التفعيل |
|--------|-------|---------|
| Twitter | ✅ موجود | ❌ يحتاج TWITTER_BEARER_TOKEN |
| Instagram | ✅ موجود | ❌ يحتاج INSTAGRAM_PAGE_TOKEN |
| **WhatsApp** | **❌ غير موجود** | — القناة الأساسية لتمعّن غير مدعومة |

### ما هو غير موجود:

- ❌ لا يوجد conversation history storage (كل رسالة مستقلة)
- ❌ لا يوجد WhatsApp integration
- ❌ لا يوجد agent dashboard حي
- ❌ لا يوجد ربط بين الوكلاء وتجربة المستخدم على الموقع

---

## 4. API Routes — كل ما هو موجود

### 4.1 البرنامج الأساسي

| Endpoint | Method | الوظيفة |
|----------|--------|---------|
| `/api/program/progress` | GET/POST | تقدم المستخدم (currentDay, completedDays) |
| `/api/program/day/[id]` | GET | محتوى اليوم + cognitive + city + orchestrator |
| `/api/progress` | GET | تقدم عام |
| `/api/progress/complete` | POST | إكمال يوم |
| `/api/reflections` | GET/POST | التأملات (حفظ + قراءة) |
| `/api/day/[dayId]` | GET | محتوى يوم (بديل) |

### 4.2 الرحلة والذكاء

| Endpoint | Method | الوظيفة |
|----------|--------|---------|
| `/api/journey/state` | GET/POST | حالة الرحلة (V9 memory) |
| `/api/journey/analytics` | GET | تحليلات الرحلة |
| `/api/awareness` | GET | حالة الوعي |
| `/api/awareness-log` | POST | تسجيل الوعي |
| `/api/awareness-tracker` | GET | تتبع الوعي |
| `/api/identity` | GET | بيانات الهوية |
| `/api/decision` | POST | محرك القرارات |
| `/api/meaning-engine` | POST | محرك المعنى |
| `/api/memory` | GET | الذاكرة |
| `/api/history` | GET | التاريخ |
| `/api/scan` | POST | مسح |
| `/api/actions/feedback` | POST | تغذية راجعة |
| `/api/growth-trigger` | POST | محفزات النمو |

### 4.3 المرشد الذكي (Guide)

| Endpoint | Method | الوظيفة |
|----------|--------|---------|
| `/api/guide` | POST | المرشد الأساسي |
| `/api/guide/chat` | POST | محادثة مع المرشد |
| `/api/guide/ingest` | POST | استيعاب محتوى (Admin) |
| `/api/guide/prompts` | GET | prompts المرشد |

### 4.4 المصادقة والدفع

| Endpoint | Method | الوظيفة |
|----------|--------|---------|
| `/api/auth/phone/send` | POST | إرسال OTP |
| `/api/auth/phone/verify` | POST | تحقق OTP |
| `/auth/callback` | GET | OAuth/Magic Link callback |
| `/api/activate` | POST | تفعيل بكود |
| `/api/checkout` | POST | بدء الدفع |
| `/api/subscription/status` | GET | حالة الاشتراك |
| `/api/tap/checkout` | POST | Tap checkout |
| `/api/tap/verify` | POST | Tap verify |
| `/api/tap/webhook` | POST | Tap webhook ⚠️ بدون signature verification |
| `/api/stripe/webhook` | POST | Stripe webhook ✅ آمن |
| `/api/salla/webhook` | POST | Salla webhook ✅ آمن |
| `/api/salla/oauth/start` | GET | Salla OAuth |
| `/api/salla/oauth/callback` | GET | Salla OAuth callback |

### 4.5 الأدمن

| Endpoint | الوظيفة |
|----------|---------|
| `/api/admin/login` | تسجيل دخول الأدمن |
| `/api/admin/verify` | تحقق الأدمن |
| `/api/admin/dashboard` | لوحة القيادة |
| `/api/admin/activations` | الأكواد |
| `/api/admin/bulk-codes` | أكواد بالجملة |
| `/api/admin/instant-activate` | تفعيل فوري |
| `/api/admin/export` | تصدير |
| `/api/admin/activate-book` | تفعيل الكتاب |
| `/api/admin/activate-tasbeeh` | تفعيل التسبيح |
| `/api/admin/vip-gifts` | هدايا VIP |
| `/api/admin/migrate-cognitive` | ترحيل معرفي |
| `/api/admin/ramadan/*` | (4 endpoints) إدارة رمضان |

### 4.6 Cron Jobs

| Endpoint | الجدولة | الوظيفة |
|----------|---------|---------|
| `/api/cron/send-emails` | يومياً 6 صباحاً | إرسال إيميلات |
| `/api/cron/manage-subscriptions` | يومياً 5 صباحاً | إدارة الاشتراكات |
| `/api/cron/analyze-patterns` | يومياً 10 مساءً | تحليل الأنماط |

### 4.7 متفرقات

| Endpoint | الوظيفة |
|----------|---------|
| `/api/agents/test` | اختبار الوكلاء (محمي بـ ADMIN_KEY) |
| `/api/health` | health check |
| `/api/diagnostics` | تشخيص |
| `/api/answers` | إجابات |
| `/api/book-url` | رابط الكتاب |
| `/api/book/chapters` | فصول الكتاب |
| `/api/najm/approve` | موافقة نجم |
| `/api/slack/test` | اختبار Slack |
| `/api/webhooks/instagram` | Instagram webhook |
| `/api/webhooks/twitter` | Twitter webhook |

---

## 5. الصفحات (Pages) — كل ما هو موجود

### الأساسية:
`/` (home) · `/program` · `/program/day/[id]` · `/pricing` · `/auth` · `/login` · `/account` · `/book` · `/progress` · `/about` · `/privacy`

### التجربة:
`/breathing` · `/city` · `/city/classic` · `/daily` · `/day/[dayId]` · `/decision` · `/guide` · `/journal` · `/journey` · `/patterns` · `/reflection` · `/scan` · `/sources` · `/taamun` · `/tasbeeh`

### الدفع:
`/pricing/success` · `/pricing/cancel` · `/payment/success` · `/subscribe` · `/success`

### خاصة:
`/eid` · `/kahfi` · `/landing-2` · `/najm` · `/stitch` · `/ramadan` · `/ramadan/day` · `/ramadan/insight`

### أدمن:
`/admin` · `/admin/activations` · `/admin/instant-activate` · `/admin/vip-gifts` · `/admin/ramadan` · `/admin/test` · `/auth/test`

---

## 6. المكونات (Components) — كل ما هو موجود

### مكونات أساسية (65 ملف):
`DayExperience` · `AppShell` · `AppChrome` · `NavAuth` · `MobileBottomNav` · `RequireAuth` · `Paywall` · `BookViewer` · `SearchBox` · `OnboardingOverlay`

### تجربة اليوم:
`CompanionVerse` · `CustomQuestion` · `DailyHint` · `Day1Gate` · `VerseCard` · `DepthChart` · `GrowthPrompt` · `ThemeCloud` · `PatternTimeline`

### قرارات وهوية:
`DecisionCTA` · `DecisionInput` · `DecisionOutput` · `IdentityReflectionCard` · `NextStepPanel` · `StatusCard` · `SmartGuide` · `JourneyGuideRail`

### رحلة:
`journey/DailyJourney` · `journey/BreathingRings` · `journey/JourneyAtmosphere` · `journey/WordReveal`

### مدينة:
`city/InteractiveCityMap` · `city/motion/LivingCityMap` · `city/motion/AmbientLayer` · `city/motion/ZoneNode` · `city/motion/RewardBurst`

### هبوط:
`landing/Hero` · `landing/Navbar` · `landing/Footer` · `landing/Section` · `landing/Sections` · `landing/Reveal` · `landing/TaamunV2Landing` · `landing/TaamunLanding2` · `landing/LandingMerged` · `landing/StitchLanding`

### برنامج:
`program/ProgramDaysGrid` · `program/ProgramProgressBar`

### تسبيح:
`TasbeehExperience`

### Stitch (prototype):
`stitch/HomePage` · `stitch/VersePage` · `stitch/BreathingPage` · `stitch/JournalPage` · `stitch/TopBar` · `stitch/BottomNav`

### UI:
`ui/Alert` · `ui/Badge` · `ui/Button` · `ui/Card` · `ui/Input`

### أخرى:
`AnalyticsProvider` · `CheckoutButton` · `ChoiceChips` · `HomeLinks` · `StartTodayButton` · `CurrentYear` · `admin/AdminRagIngestCard`

---

## 7. البنية التحتية (Infrastructure)

### المصادقة:
- `src/lib/authz.ts` (73 سطر) — `requireUser()` + `requireAdmin()`
- `src/lib/supabaseClient.ts` (16) — Browser client
- `src/lib/supabaseAdmin.ts` (16) — Service role client
- `src/lib/supabase/server.ts` (35) — Server client
- `src/lib/entitlement.ts` (80) — HMAC-SHA256 token

### الدفع:
- `src/lib/stripe.ts` (24) + `src/lib/salla.ts` (46) + `src/lib/tap.ts` (46)
- `src/lib/checkoutProvider.ts` (18) — اختيار البوابة
- `src/lib/subscriptionAccess.ts` (206) — صلاحيات الاشتراك
- `src/lib/tapSubscriptionSync.ts` (49) + `src/lib/tapWebhookVerify.ts` (24)

### التحليلات:
- `src/lib/analytics.ts` (48) — PostHog (مينيمالي)

### أخرى:
- `src/lib/appConfig.ts` (15) + `src/lib/appOrigin.ts` (56) — ثوابت
- `src/lib/rateLimiter.ts` (53) — Rate limiter (**موجود كملف لكن يحتاج تحقق من الاستخدام**)
- `src/lib/guide-prompt.ts` (96) + `src/lib/rag.ts` (214) — RAG system للمرشد
- `src/lib/slack.ts` (39) — إشعارات Slack
- `src/lib/storage.ts` (136) — localStorage wrapper
- `src/lib/routes.ts` (22) — مسارات
- `src/lib/hijri.ts` (48) + `src/lib/calendarDay.ts` (24) + `src/lib/season.ts` (7)

---

## 8. ❌ ما هو غير موجود (كان مذكوراً في تقارير سابقة)

> هذه الملفات والمجلدات ذُكرت في تقارير سابقة لكنها **غير موجودة على الـ disk**:

| ما ذُكر | الحقيقة |
|---------|---------|
| `src/lib/ai/` (مجلد كامل) | ❌ غير موجود — لا signals.ts ولا patterns.ts ولا feedbackLoop.ts ولا memoryEvolution.ts ولا awarenessLayer.ts ولا orchestrate.ts ولا analyzeReflection.ts |
| `src/lib/journey/serverGuard.ts` | ❌ غير موجود |
| `src/lib/journey/continuity.ts` | ❌ غير موجود |
| `src/lib/journey/navigation.ts` | ❌ غير موجود |
| `src/lib/journey/stack.ts` | ❌ غير موجود |
| `src/lib/journey/safeLoad.ts` | ❌ غير موجود |
| `/api/journey/intelligence` | ❌ غير موجود |
| `/api/journey/orchestrate` | ❌ غير موجود |
| `/api/journey/timeline` | ❌ غير موجود |
| `/api/ai/reflection` | ❌ غير موجود |
| `src/components/journey/ReflectionInsight.tsx` | ❌ غير موجود |
| `src/components/journey/WhyYouAreHereCard.tsx` | ❌ غير موجود |
| `src/components/journey/DecisionExplainer.tsx` | ❌ غير موجود |
| `src/components/journey/ResumeNotice.tsx` | ❌ غير موجود |
| `src/components/journey/JourneyLink.tsx` | ❌ غير موجود |
| `ProgramPageClient.tsx` | ❌ غير موجود |
| `DayPageClient.tsx` | ❌ غير موجود |
| `src/app/debug/journey/page.tsx` | ❌ غير موجود |
| `supabase/migrations/20260410000000_reflections_ai_fields.sql` | ❌ غير موجود |

---

## 9. Git State

- **آخر commit:** `27ca0b6 feat: Journey Memory Engine (V9) — continuity system`
- **Stash:** `stash@{0}: WIP on main: 122ad55 chore: remove ramadan dependency`
- **Build:** `npx tsc --noEmit` → صفر أخطاء

---

## 10. مشاكل أمنية معروفة

1. **Tap webhook** (`/api/tap/webhook`) — لا يوجد signature verification
2. **Instagram webhook** (`/api/webhooks/instagram`) — لا يوجد signature verification على POST
3. **Twitter webhook** (`/api/webhooks/twitter`) — لا يوجد signature verification على POST
4. **Rate limiting** — ملف `rateLimiter.ts` موجود لكن يحتاج تحقق من التطبيق الفعلي
5. **لا يوجد conversion tracking** — لا Meta Pixel، لا GA4

---

## 11. ملاحظة للـ Agent القادم

> **لا تثق بأي تقرير سابق لهذا الملف.** تقارير سابقة ذكرت ملفات وهمية وأعطت تقييمات 10/10 لطبقات غير موجودة.
>
> قبل أي تعديل: **اقرأ الملف أولاً وتأكد من وجوده.**
>
> هذا الملف تم بناؤه بفحص مباشر لكل ملف على الـ disk في 10 أبريل 2026.
