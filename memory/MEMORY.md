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

## آخر القرارات المهمة
- 2026-03-02: تحويل Auth من password إلى magic link فقط
- الـ platform مفتوح (لا auth gates على المحتوى)
