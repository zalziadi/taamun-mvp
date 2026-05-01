# لمة وفرة — Lammah Wafrah

تطبيق ويب تفاعلي لرحلة وعي مالي عبر **١٤ يوماً**، من الوعي البدائي إلى التوسّع.
مشروع مستقل تماماً — لا يتشارك أي شيء مع تطبيق "تمعّن" الموجود في نفس الـ repo.

## المراحل الأربع

1. **الوعي** (يوم 1 — 3): علاقتك بالمال، مصدر معتقداتك، المال كطاقة.
2. **الفكّ** (يوم 4 — 7): التسريبات، الاستهلاك اللاواعي، الخوف، أوّل إعادة برمجة.
3. **إعادة البناء** (يوم 8 — 11): دخل واعٍ، مهارتك، عقلية التوسّع، نظام مالي.
4. **التوسّع** (يوم 12 — 14): المال كأثر، الاستمراريّة، نسختك المالية الجديدة.

## الـ Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Framer Motion
- Zustand (state management)
- Supabase (اختياري — يعمل بدونه)

## التشغيل المحلّي

```bash
cd wafrah-app
npm install
npm run dev
```

التطبيق على `http://localhost:3001` (منفذ مختلف عن Taamun لتفادي التعارض).

### المتغيّرات البيئيّة

`Supabase` اختياري كلّياً. إذا تركت المتغيّرات فارغة، التطبيق يحفظ التقدّم في `localStorage` فقط (مفتاح `wafrah.progress.v1`).

```bash
cp .env.example .env.local
```

## البنية

```
wafrah-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # RTL + Inter + IBM Plex Arabic
│   │   ├── page.tsx          # Landing
│   │   ├── journey/page.tsx  # Dashboard (14 day cards)
│   │   ├── day/[id]/page.tsx # صفحة اليوم — قراءة/تمرين/إجابة
│   │   ├── progress/page.tsx # نظرة على التقدّم
│   │   ├── reflection/page.tsx # كل التأمّلات في صفحة واحدة
│   │   └── api/
│   │       ├── save-answer/route.ts
│   │       └── get-progress/route.ts
│   ├── components/
│   │   ├── DayCard.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── QuestionBox.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── HydrateGate.tsx
│   ├── lib/
│   │   ├── days.ts          # محتوى الـ 14 يوم
│   │   ├── types.ts
│   │   ├── utils.ts         # LocalStorage + helpers
│   │   └── supabase.ts
│   ├── store/
│   │   └── useProgressStore.ts  # Zustand
│   └── styles/globals.css
├── supabase/schema.sql      # SQL اختياري للمزامنة
├── tailwind.config.ts
├── next.config.mjs
├── tsconfig.json
└── package.json
```

## نظام التقدّم

- كل يوم = 100% عند الإكمال.
- اليوم التالي يُفتح فقط بعد إكمال السابق.
- **الإكمال** يتطلّب كتابة إجابة لا تقلّ عن ١٢ حرفاً.
- الحفظ تلقائي (auto-save) أثناء الكتابة.
- إعادة الزيارة متاحة لأي يوم سابق.

## النشر على Vercel

1. `git push` لفرع المشروع.
2. في Vercel: **Import** → اختر **Root Directory = `wafrah-app`**.
3. أضف المتغيّرات البيئيّة (اختياري).
4. Deploy.

## الفلسفة

> هذا التطبيق ليس تعليمياً فقط — بل نظام تحويل وعي مالي تدريجي + تجربة تفاعليّة يوميّة.
