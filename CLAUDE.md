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
| 5 | **Storage**: LocalStorage فقط — المفتاح: `taamun.progress.v1` |
| 6 | **Dependencies**: لا مكتبات جديدة إلا بإذن صريح |
| 7 | **Breaking changes**: ممنوع التغييرات الصامتة المكسورة |
| 8 | **Refactors**: ممنوع التبسيط/إعادة الهيكلة التخمينية |

## هيكل الملفات

| المسار | الغرض |
|--------|-------|
| `CLAUDE.md` | قانون المشروع (هذا الملف) |
| `docs/plan.md` | حدود التنفيذ |
| `docs/commands.md` | الأوامر المسموحة |
| `docs/verify.md` | خطوات التحقق |
| `docs/book.md` | قواعد اقتباس/تلخيص من الكتيّب |
| `src/lib/*` | منطق فقط (لا JSX) |
| `src/components/*` | مكوّنات واجهة فقط |
| `src/app/*` | التوجيه والصفحات فقط |

لا تخلط المسؤوليات.

## التخزين المحلي
- المفتاح الثابت: `taamun.progress.v1`
- الوصول لـ LocalStorage داخل مكوّنات Client فقط (`"use client"`)
- التعامل مع JSON فاسد بأمان (إرجاع state فارغ)

## التحقق الإجباري
قبل اعتبار أي مهمة منجزة:
1. `npm run typecheck` ينجح
2. `npm run build` ينجح
3. `npm run verify` ينجح
4. الصفحات `/` و `/day` و `/progress` و `/subscribe` و `/book` تعمل بدون crash
