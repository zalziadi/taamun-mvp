# ذاكرة مشروع Taamun

## الهوية
- **الاسم**: Taamun (تمعّن) — تطبيق ويب Next.js 14 App Router
- **الهدف**: تمعّن قرآني خلال 28 يوماً في رمضان
- **Stack**: Next.js 14 · TypeScript · Tailwind · Supabase · Vercel

## المسارات الحية (لا تكسرها أبداً)
| المسار | الملف |
|--------|-------|
| `/` | `src/app/page.tsx` |
| `/auth` | `src/app/auth/page.tsx` + `AuthClient.tsx` |
| `/auth/callback` | `src/app/auth/callback/route.ts` — PKCE magic link |
| `/day` | `src/app/ramadan/day/page.tsx` |
| `/book` | `src/app/book/page.tsx` |
| `/account` | `src/app/account/page.tsx` |
| `/admin` | `src/app/admin/page.tsx` — يحتاج SUPABASE_SERVICE_ROLE_KEY |

## Supabase — القرارات المثبّتة
- **Auth**: Magic link (email OTP) فقط — لا password، لا phone
- **Client**: `src/lib/supabaseClient.ts` — للـ browser
- **Server (SSR)**: `src/lib/supabase/server.ts` — `createSupabaseServerClient()` مع cookies
- **Admin**: `src/lib/supabaseServer.ts` — `getSupabaseAdmin()` بـ service role key
- **Callback URL**: `/auth/callback?next=...` — يجب إضافته في Supabase Dashboard → Redirect URLs

## أنماط ثابتة يجب اتباعها
- كل Server Component أو Route Handler يحتاج session → استخدم `createSupabaseServerClient()`
- كل Client Component يحتاج Supabase → استخدم `supabase` من `supabaseClient.ts`
- LocalStorage → داخل `"use client"` فقط، مفتاح: `taamun.progress.v1`
- لا JSX في `src/lib/`، لا منطق في `src/components/`

## أوامر التحقق
```bash
npx tsc --noEmit          # TypeScript فقط (سريع)
npm run build             # بناء كامل
npm run guard:release     # كل شيء قبل الـ release
```

## مشاكل متكررة وحلولها
- **`npm run typecheck` غير موجود** → استخدم `npx tsc --noEmit`
- **cookies() في route handler** → `const cookieStore = await cookies()` (async في Next.js 14+)
- **`implicit any` في admin pages** → صرّح بالنوع صراحةً

## نظام التصميم — Desert Sanctuary (Stitch Export)
- **تاريخ الاعتماد**: 2026-03-23
- **المصدر**: 4 تصاميم Stitch (Google Labs) محوّلة إلى React + Tailwind
- **الألوان الأساسية**:
  - Background: `#15130f` | Surface: `#080705`
  - Primary Gold: `#e6d4a4` | Container: `#c9b88a`
  - On-Surface: `#e8e1d9` | On-Primary: `#3a2f0d`
  - Outline: `#969083` | Outline-Variant: `#4b463c`
- **الخطوط**: Amiri (قرآن/عناوين روحية) · Manrope (UI/labels) · Noto Serif (headlines)
- **القواعد البصرية**:
  - لا borders صلبة — استخدم surface shifts للفصل
  - Glassmorphism للعناصر الطافية (backdrop-blur-20px, 60% opacity)
  - ظلال دافئة فقط: `rgba(58, 47, 13, 0.4)` بـ blur ≥24px
  - مساحات فارغة كبيرة — "إذا بدت الشاشة فارغة فأنت على الطريق الصحيح"
- **المكوّنات المحوّلة** (`stitch-output/`):
  - `pages/HomePage.tsx` → صفحة الهبوط مع بطل الآية ومسار الرحلة
  - `pages/VersePage.tsx` → عرض الآية مع السياق والترجمة
  - `pages/BreathingPage.tsx` → جلسة التنفس مع أنيميشن الدوائر
  - `pages/JournalPage.tsx` → صفحة الكتابة والتأمل الوجداني
  - `components/TopBar.tsx` + `BottomNav.tsx` → مكوّنات مشتركة
  - `design-tokens.ts` → ألوان MD3 جاهزة لـ Tailwind
- **الصور**: 20 SVG في `stitch-output/images/day-01..20.svg` — رمز لكل يوم

## سياقات العمل مع Cursor
- عند إرسال كود لـ Cursor، جهّز برومبت محسّن بـ 4 خطوات: (1) دمج الملفات (2) تحديث Tailwind config (3) تحقق tsc+build (4) نشر Vercel
- حدد مسارات الملفات بالضبط — Cursor يعمل أفضل مع تعليمات ملفات محددة
- أضف قيود حماية صريحة (لا تكسر auth, لا مكتبات جديدة, لا تمس routes الموجودة)

## أنماط العمل مع زياد (Cowork)
- يفضّل التنفيذ المباشر على الاستفسارات المتكررة
- يعمل مع أدوات متعددة بالتوازي (Cursor, Stitch, Cowork, Vercel)
- يريد مخرجات جاهزة للإنتاج — لا مسودات أو placeholders
- عند طلب "حسّن البرومبت" → استخدم سكِل optimize-prompt
- عند طلب تصميم واجهة → استخدم سكِل stitch-design
- التسليم: ملفات في workspace + رابط computer:// + ملخص مختصر بدون شرح مطوّل

## المهارات المخصصة المُنشأة
| المهارة | الموقع | الغرض |
|---------|--------|-------|
| `optimize-prompt` | `.skills/skills/optimize-prompt/` | تحسين البرومبتات (عربي/إنجليزي) |

## آخر القرارات المهمة
- 2026-03-23: اعتماد نظام تصميم Desert Sanctuary من Stitch
- 2026-03-23: إنشاء سكِل optimize-prompt مخصص
- 2026-03-23: تحويل 4 صفحات Stitch إلى React + Tailwind (stitch-output/)
- 2026-03-23: توليد 20 صورة SVG لمحتوى الأيام
- 2026-03-02: تحويل Auth من password إلى magic link فقط
- الـ platform مفتوح (لا auth gates على المحتوى)
