# تسليم للمصمم — ترقية منصة تمعّن (City of Meaning)

هذا المستند جاهز للإرسال للمصمم (UI/UX) لتطوير شكل عالمي احترافي مع الحفاظ على روح المنتج: هادئ، روحاني، عربي أولاً.

---

## 1) هوية المنتج واتجاه التصميم

- **المنتج:** منصة رحلة وعي تفاعلية مستوحاة من كتاب *City of Meaning*.
- **الفلسفة:** القرآن كنظام تحويل داخلي (وليس قراءة نصية فقط).
- **النبرة:** ساكنة، متأملة، قليلة الضجيج البصري، عميقة.
- **اللغة:** عربية (RTL) بشكل أساسي.
- **الجمهور:** مستخدم يريد جلسة يومية قصيرة لكنها مؤثرة.

### المتطلبات البصرية (Professional Global)

- **Visual language:** Minimal spiritual UI (soft gradients, muted surfaces, restrained gold accents).
- **Hierarchy:** Typographic hierarchy قوية وواضحة (title / subtitle / body / caption).
- **Component discipline:** تصميم موحد للبطاقات، الأزرار، الحالات، الرسوم.
- **Accessibility:** تباين جيد، أحجام touch targets مناسبة، حالات focus واضحة.
- **Motion:** انتقالات هادئة قصيرة (micro-interactions، بدون مبالغة).
- **Responsive:** Mobile-first ثم tablet/desktop.

---

## 2) ما تم إنجازه فعليًا (تقنيًا)

## 2.1 City Map + Awareness Tracker
- صفحة المدينة: `src/app/city/page.tsx`
- نموذج المجالات التسعة + حالات الوعي: `src/lib/city-of-meaning.ts`
- API تتبع الوعي: `src/app/api/awareness-tracker/route.ts`

### مقتطف كود (حالات الوعي)
```ts
export const AWARENESS_STATES = [
  { value: "shadow", label: "الظل" },
  { value: "gift", label: "الهدية" },
  { value: "best_possibility", label: "أفضل احتمال" },
] as const;
```

---

## 2.2 Reflection System + Journal
- صفحة التأمل الثلاثي: `src/app/reflection/page.tsx`
- API حفظ/قراءة التأملات: `src/app/api/reflections/route.ts`
- صفحة دفتر التأملات: `src/app/journal/page.tsx`

### ممارسات التأمل الثلاث
```ts
export const PRACTICES = [
  { key: "observe", label: "الملاحظة" },
  { key: "insight", label: "الإدراك" },
  { key: "contemplate", label: "التمعّن" },
] as const;
```

---

## 2.3 RAG AI Guide
- واجهة المرشد: `src/app/guide/page.tsx`
- API المحادثة: `src/app/api/guide/chat/route.ts`
- API ingest وفهرسة الكتاب: `src/app/api/guide/ingest/route.ts`
- مكتبة chunking/embedding/chat: `src/lib/rag.ts`
- زر الأدمن للفهرسة: `src/components/admin/AdminRagIngestCard.tsx`

### تدفق RAG
1. قراءة نص الكتاب من:
   - `src/content/book/chapters/muraqabah.md`
   - `src/content/book/chapters/idrak.md`
   - `src/content/book/chapters/best-potential.md`
2. تقسيم النص chunks
3. توليد embeddings
4. تخزينها في `book_chunks` (Supabase vector)
5. استرجاع أقرب chunks للإجابة

---

## 2.4 Meaning Engine API
- API جديد: `src/app/api/meaning-engine/route.ts`
- المدخلات:
  - `ayah`
  - `emotion`
  - `awareness_state`
  - `reflection`
- المخرجات:
  - `insight`
  - `suggested_question`
  - `suggested_contemplation_practice`

---

## 2.5 Journey Analytics
- API التحليلات: `src/app/api/journey/analytics/route.ts`
- صفحة التصور: `src/app/journey/page.tsx`
- تحتوي:
  - completion metrics
  - awareness average
  - timeline 28 يوم
  - line chart (SVG)

---

## 2.6 توسيع قاعدة البيانات (Migration)
- ملف الهجرة: `supabase/migrations/20260310000000_reflection_rag_analytics.sql`

تمت إضافة:
- أعمدة في `reflections`:
  - `surah`
  - `ayah`
  - `emotion`
  - `awareness_state`
- جدول `book_chunks` مع `VECTOR(1536)`
- دالة SQL:
  - `match_book_chunks(query_embedding, match_count)`

---

## 3) الصفحات الأساسية الحالية للمصمم

- `/` الصفحة الرئيسية
- `/program` البرنامج
- `/city` خريطة مدينة المعنى (Interactive SVG)
- `/reflection` نظام التأمل
- `/journal` دفتر التأملات
- `/journey` تصور الرحلة والتحليلات
- `/guide` المرشد الذكي
- `/auth` تسجيل الدخول

---

## 4) نظام التصميم الحالي (للانطلاق)

الملف: `src/app/globals.css`

- **Dark base:** `bg-bg`, `text-text`, `bg-panel`, `border-border`
- **Accent:** `gold`
- **Typography:**
  - Arabic UI: `Noto Sans Arabic`
  - Quran/verse style: `Amiri`
- **Direction:** `dir="rtl"` مفعل في `src/app/layout.tsx`

### مقتطف مرجعي
```css
.h1 { @apply text-2xl sm:text-3xl font-bold text-text; }
.focus-ring { @apply focus:outline-none focus:ring-2 focus:ring-gold ...; }
```

---

## 5) المطلوب من المصمم الآن (UI/UX Scope)

1. **تصميم عالمي احترافي** للشاشات الست الأساسية:  
   `/city`, `/reflection`, `/journal`, `/journey`, `/guide`, `/program`
2. **Interactive Map polish**
   - شكل مدينة أكثر رمزية (paths/quarters/center)
   - حالات hover/active/locked
3. **Journey visualization**
   - إعادة تصميم timeline + chart كـ premium data story
4. **AI chat UI**
   - message bubbles, typing state, source chips (RAG context refs)
5. **Reflection editor UX**
   - خطوة بخطوة، أو بطاقة واحدة ثلاثية sections
   - CTA واضح: Save / Run Meaning Engine
6. **Design tokens**
   - Colors / spacing / radius / elevation / motion durations
7. **Responsive behavior**
   - mobile-first patterns واضحة

---

## 6) API Contracts مختصرة للمصمم/الفرونت

### `POST /api/meaning-engine`
```json
{
  "ayah": "البقرة/286",
  "emotion": "قلق",
  "awareness_state": "shadow",
  "reflection": "..."
}
```
Response:
```json
{
  "ok": true,
  "insight": "...",
  "suggested_question": "...",
  "suggested_contemplation_practice": "...",
  "mode": "ai"
}
```

### `GET /api/journey/analytics`
Response:
```json
{
  "ok": true,
  "metrics": {
    "completion_percent": 43,
    "completed_days": 12,
    "total_days": 28,
    "awareness_avg": 2.1,
    "awareness_entries": 11
  },
  "timeline": [
    { "day": 1, "completed": true, "awareness_state": "gift", "awareness_score": 2, "recorded_at": "..." }
  ]
}
```

---

## 7) ملاحظة تنفيذية

- التصميم جاهز الآن للتطوير دون تغيير الـ backend contracts.
- أي تحسين بصري يمكن تنفيذه مباشرة على نفس المسارات والمكوّنات بدون إعادة بناء من الصفر.

