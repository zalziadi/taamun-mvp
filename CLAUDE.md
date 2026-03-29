# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

هذا الملف هو القانون المطلق للمشروع. أي تعديل يخالفه مرفوض.

## المشروع
**Taamun (تمعّن)** — تطبيق ويب Next.js للتمعّن القرآني خلال 28 يوماً مستوحاة من كتاب "مدينة المعنى بلغة القرآن".

## الأوامر

```bash
npm run dev            # خادم التطوير (localhost:3000)
npm run build          # بناء الإنتاج
npm run lint           # فحص ESLint
npx tsc --noEmit       # فحص TypeScript
npm run guard:release  # brand + runtime + metadata + tsc + build (قبل كل release)
npm run setup:admin    # إعداد حساب الأدمن الأولي
```

**التحقق الإجباري بعد كل تعديل — قبل الإعلان عن الانتهاء:**
```bash
npx tsc --noEmit && npm run build
```

## بعد كل عملية ناجحة (إلزامي)

1. **ذكّر المستخدم يدفع من Cursor:**
   ```
   ✅ تم! الحين ادفع التحديثات من Cursor:
   Terminal → git push (أو Cmd+Shift+P → Git: Push)
   ```
2. **احفظ المهارة في CJ:** أنشئ ملف في `~/.claude/skills/cj-supervisor/` يوثّق الخطوات للرجوع لها لاحقاً

## القواعد الصارمة (NON-NEGOTIABLE)

| # | القاعدة |
|---|--------|
| 1 | **Framework**: Next.js 14 App Router فقط |
| 2 | **Language**: TypeScript |
| 3 | **Styling**: Tailwind (الموجود فقط، بدون مكتبات جديدة) |
| 4 | **Direction**: RTL افتراضي (`html dir="rtl" lang="ar"`) |
| 5 | **Storage**: LocalStorage فقط للتقدم — المفتاح: `taamun.progress.v1` |
| 6 | **Dependencies**: لا مكتبات جديدة إلا بإذن صريح |
| 7 | **Breaking changes**: ممنوع التغييرات الصامتة المكسورة |
| 8 | **Refactors**: ممنوع التبسيط/إعادة الهيكلة التخمينية |

## قواعد السلامة — منع الكسر

| # | القاعدة |
|---|--------|
| S1 | **اقرأ أولاً** — لا تعدّل ملفاً لم تقرأه بالكامل |
| S2 | **تغيير واحد في كل مرة** — لا تعدّل أكثر من ملفين في طلب واحد إلا عند الضرورة |
| S3 | **أقل ما يمكن** — إذا طُلب تعديل سطر، عدّل سطراً فقط |
| S4 | **checkpoint قبل التعديل الكبير** — `git add -A && git commit -m "chore: checkpoint"` قبل أي تعديل يمس أكثر من 3 ملفات |
| S5 | **لا تحذف imports** — إلا إذا تأكدت أنها غير مستخدمة في كل الملفات |

## الصفحات الحية (لا تكسرها)
`/` و `/day` و `/progress` و `/pricing` و `/book` و `/auth` و `/program` و `/account`

## البنية المعمارية

### طبقات المشروع
```
src/lib/*          منطق فقط (لا JSX)
src/components/*   مكوّنات واجهة فقط
src/app/*          التوجيه والصفحات فقط
```
لا تخلط المسؤوليات.

### المصادقة — Supabase Auth
- **Magic link فقط** — لا كلمة مرور. `supabase.auth.signInWithOtp({ email })`
- Callback: `src/app/auth/callback/route.ts` — يعالج magic link وOAuth/PKCE ويعيد التوجيه إلى `/program`
- **Client**: `src/lib/supabaseClient.ts` — `createBrowserClient` للمكوّنات Client فقط
- **Server**: `src/lib/supabase/server.ts` — `createServerClient` للـ Route Handlers وServer Components
- **Admin**: `src/lib/supabaseAdmin.ts` — `createClient` بـ service role، للعمليات الحساسة فقط
- حماية Route Handlers: `src/lib/authz.ts` — دالتا `requireUser()` و`requireAdmin()`

### نظام الـ Entitlement
- **الرمز**: HMAC-SHA256 مُشفّر، يُخزَّن في cookie باسم `taamun_entitled`
- **السر**: متغير بيئة `ENTITLEMENT_SECRET` (مطلوب على الخادم)
- **المنطق**: `src/lib/entitlement.ts` — `makeEntitlementToken()` و`verifyEntitlementToken()`
- **أنواع الأكواد**: باقة 280 (TAAMUN-XXX) أو باقة 820 (TAAMUN-820-XXX)
- **التحقق على الخادم**: `src/app/api/activate/route.ts` يكتب cookie بعد التحقق

### محتوى الـ 28 يوم
- `src/lib/taamun-content.ts` — `DayContent` interface + مصفوفة `DAYS` (28 يوم) + `getDay(n)` + `PROGRESSION_MILESTONES`
- المحتوى مستوحى من كتاب "مدينة المعنى بلغة القرآن" (`public/book/City_of_Meaning_Quran_AR_EN_v0.pdf`)
- الكتاب: مقيّد بالـ entitlement (pending/active أو Admin)

### مكوّن تجربة اليوم
- `src/components/DayExperience.tsx` — يجمع: `SilenceGate` → `VerseBlock` → `HiddenLayer` → `BookQuote` → `ReflectionJournal` (auto-save إلى جدول `reflections`) → `AwarenessMeter` (save إلى `awareness_logs`) → `ShareCard` → `ProgressionBadge`
- الأيام المحورية للـ badge: 1, 3, 7, 14, 21, 28

### التخزين المحلي
- المفتاح الثابت: `taamun.progress.v1`
- الوصول لـ LocalStorage داخل مكوّنات Client فقط (`"use client"`)
- التعامل مع JSON فاسد بأمان (إرجاع state فارغ)

### لوحة الأدمن
- الوصول: `/admin?admin=<KEY>` — التحقق عبر `/api/admin/verify`
- متغير البيئة: `ADMIN_KEY` (سري، بدون NEXT_PUBLIC)
- التحقق البديل: `ADMIN_EMAIL` أو role="admin" في جدول `profiles` أو `admins`

### الـ Brand والإعدادات الثابتة
- كل ثوابت البراند في `src/lib/appConfig.ts` — **لا تكتبها يدوياً في أي مكان آخر**
- `APP_NAME`, `APP_DOMAIN`, `RAMADAN_ENDS_AT_ISO`, إلخ.
- `src/lib/appOrigin.ts` — `getAppOriginClient()` للمكوّنات، `getAppOriginServer()` للخادم

### متغيرات البيئة المطلوبة
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_ORIGIN       # رابط الإنتاج الكامل (مثل https://taamun-mvp.vercel.app)
ENTITLEMENT_SECRET           # سر HMAC للـ entitlement token
SUPABASE_SERVICE_ROLE_KEY    # للعمليات الإدارية
ADMIN_KEY                    # مفتاح لوحة الأدمن
ADMIN_EMAIL                  # (اختياري) بريد الأدمن للتحقق المباشر
```

## مصادر أخرى
- `docs/plan.md` — نطاق الـ MVP وتفاصيل الأكواد
- `docs/book.md` — قواعد اقتباس/تلخيص من الكتيّب
