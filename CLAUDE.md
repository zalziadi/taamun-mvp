# CLAUDE.md — Taamun Project Law

هذا الملف هو القانون المطلق للمشروع. أي تعديل يخالفه مرفوض.

## المشروع
**Taamun (تمعّن)** — تطبيق ويب Next.js للتمعّن القرآني خلال 28 يوماً (رمضان).

## القواعد الصارمة (NON-NEGOTIABLE)

| # | القاعدة |
|---|--------|
| 1 | **Framework**: Next.js App Router فقط |
| 2 | **Language**: TypeScript |
| 3 | **Styling**: Tailwind (الموجود فقط، بدون مكتبات جديدة) |
| 4 | **Direction**: RTL افتراضي (`html dir="rtl" lang="ar"`) |
| 5 | **Storage**: LocalStorage (`taamun.progress.v1`) + Supabase (auth, بيانات المستخدمين) |
| 6 | **Dependencies**: لا مكتبات جديدة إلا بإذن صريح |
| 7 | **Breaking changes**: ممنوع التغييرات الصامتة المكسورة |
| 8 | **Refactors**: ممنوع التبسيط/إعادة الهيكلة التخمينية |

## هيكل الملفات

| المسار | الغرض |
|--------|-------|
| `CLAUDE.md` | قانون المشروع (هذا الملف) |
| `memory/MEMORY.md` | ذاكرة المشروع — أنماط Supabase والمشاكل المتكررة (اقرأه) |
| `docs/plan.md` | حدود التنفيذ |
| `docs/commands.md` | الأوامر المسموحة |
| `docs/verify.md` | خطوات التحقق |
| `docs/book.md` | قواعد اقتباس/تلخيص من الكتيّب |
| `src/lib/*` | منطق فقط (لا JSX) |
| `src/lib/supabase/*` | عملاء Supabase (server SSR) |
| `src/components/*` | مكوّنات واجهة فقط |
| `src/app/*` | التوجيه والصفحات فقط |
| `scripts/*` | سكربتات الحماية والإطلاق |

لا تخلط المسؤوليات.

## التخزين
### LocalStorage
- المفتاح الثابت: `taamun.progress.v1`
- الوصول داخل مكوّنات Client فقط (`"use client"`)
- التعامل مع JSON فاسد بأمان (إرجاع state فارغ)

### Supabase
- **Auth**: Magic link (email OTP) فقط — لا password
- **Browser client**: `src/lib/supabaseClient.ts`
- **Server (SSR)**: `src/lib/supabase/server.ts` → `createSupabaseServerClient()`
- **Admin**: `src/lib/supabaseServer.ts` → `getSupabaseAdmin()` بـ service role key

## التحقق الإجباري — حلقة ذاتية
بعد **كل تعديل على أي ملف**، قبل الإعلان عن الانتهاء:

```bash
npx tsc --noEmit          # أولاً: TypeScript
npm run build             # ثانياً: البناء الكامل
```

إذا فشل أحدهما → أصلحه فوراً قبل الانتقال لأي شيء آخر.

أمر التحقق الشامل (قبل الـ release):
```bash
npm run guard:release     # brand + runtime + metadata + tsc + build
```

## قواعد السلامة — منع الكسر
| # | القاعدة |
|---|--------|
| S1 | **اقرأ أولاً** — لا تعدّل ملفاً لم تقرأه بالكامل |
| S2 | **تغيير واحد في كل مرة** — لا تعدّل أكثر من ملفين في طلب واحد إلا عند الضرورة |
| S3 | **أقل ما يمكن** — إذا طُلب تعديل سطر، عدّل سطراً فقط. لا تُعيد هيكلة ما حولها |
| S4 | **checkpoint قبل التعديل الكبير** — نفّذ `git add -A && git commit -m "chore: checkpoint"` قبل أي تعديل يمس أكثر من 3 ملفات |
| S5 | **لا تحذف imports** — إلا إذا تأكدت أنها غير مستخدمة في كل الملفات |

## الصفحات الحية (لا تكسرها)
| المسار | الملف |
|--------|-------|
| `/` | `src/app/page.tsx` |
| `/day` | `src/app/ramadan/day/page.tsx` |
| `/book` | `src/app/book/page.tsx` |
| `/auth` | `src/app/auth/page.tsx` |
| `/auth/callback` | `src/app/auth/callback/route.ts` |
| `/account` | `src/app/account/page.tsx` |
| `/admin` | `src/app/admin/page.tsx` |
| `/progress` | `src/app/progress/` |
| `/city` | `src/app/city/` |
| `/guide` | `src/app/guide/` |
| `/journal` | `src/app/journal/` |
| `/journey` | `src/app/journey/` |
| `/reflection` | `src/app/reflection/` |
| `/program` | `src/app/program/` |
| `/pricing` | `src/app/pricing/` |

---

## Claude Code (كلاود كود)

- المستودع: `git@github.com:zalziadi/taamun-mvp.git`
- عند فتح المشروع اقرأ هذا الملف + `memory/MEMORY.md` للسياق الكامل
- دليل التثبيت للمطوّر: `docs/CLAUDE_CODE_SETUP.md`
