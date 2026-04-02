# نظام تحليل الأنماط — تمعّن

**التاريخ:** ٣ رمضان ١٤٤٧ هـ (1 أبريل 2026)
**الحالة:** جاهزة للمراجعة النهائية
**مستوحى من:** [AutoResearch](https://github.com/karpathy/autoresearch) — حلقة بحث ذاتي مستقلة

---

## الهدف

بناء وكيل ذكي يشتغل كل ليلة — يقرأ إجابات تمعّن المستخدمين، يكتشف أنماط التحول الروحي، ويُغذّي التجربة بملاحظات شخصية. مثل ما AutoResearch يحسّن نموذج ML تلقائيًا، هذا النظام يحسّن فهم رحلة كل مستخدم تلقائيًا.

## السياق

- **المستخدمون الحاليون:** 12 (دورة جديدة تبدأ الليلة)
- **البيانات المتاحة:** جدول `user_answers` في Supabase (4 حقول يومية: observe, insight, contemplate, rebuild)
- **البنية الموجودة:** Awareness Engine يحسب 4 مقاييس أسبوعية (clarity, responsibility, trust, surrender)
- **التقنية:** Next.js 14 + Supabase + Tailwind CSS

## التاريخ الهجري

النظام يعمل بالتاريخ الهجري بالكامل — عرضًا وداخليًا.

### المكتبة

استخدام `Intl.DateTimeFormat('ar-SA', { calendar: 'islamic-umalqura' })` — مدمجة في المتصفح وNode.js 18+ بدون أي مكتبة خارجية (التزامًا بقاعدة 6 في CLAUDE.md: لا مكتبات جديدة).

### التخزين

- جميع حقول التاريخ في الجداول الجديدة تُخزّن كهجري: `hijri_year`, `hijri_month`, `hijri_day`
- صيغة العرض: "٣ رمضان ١٤٤٧"

### التحويل

- utility واحدة `src/lib/hijri.ts` تتولى كل التحويلات
- تُستخدم في كل مكان بدل `new Date()`

---

## المكونات

### 1. المحلل الليلي

**المسار:** `/api/cron/analyze-patterns`
**الجدولة:** Vercel Cron Job — كل ليلة الساعة 1:00 صباحًا (يُضاف في `vercel.json`)
**الحماية:** التحقق من `CRON_SECRET` في الـ header لمنع الاستدعاء غير المصرح
**تحديد المستخدم النشط:** كل مستخدم لديه إجابة في `user_answers` لنفس اليوم (cycle_day الحالي)
**الآلية:**

```
لكل مستخدم نشط:
  1. اقرأ إجابات اليوم من user_answers
  2. اقرأ أنماط الأيام السابقة من pattern_insights (سياق تراكمي)
  3. أرسل للـ AI:
     - إجابات اليوم
     - ملخص الأنماط السابقة
     - رقم اليوم في الدورة (1-28)
     - الآية اليومية للسياق
  4. AI يُرجع:
     - themes[]: المواضيع المكتشفة (توكل، صبر، شكر، خوف...)
     - depth_score: عمق التمعّن (0-100)
     - shift_detected: هل في تحوّل عن الأيام السابقة؟
     - shift_description: وصف التحوّل إن وُجد
     - daily_hint: تلميح شخصي لليوم التالي
     - weekly_summary: ملخص أسبوعي (كل 7 أيام)
  5. احفظ في pattern_insights
```

**نموذج AI:** OpenAI (نفس المستخدم حاليًا في AI Guide)
**البرومبت:** عربي، يركّز على الأبعاد الروحانية والتمعّنية، لا يُصدر أحكامًا

### 2. جدول `pattern_insights` (Supabase)

```sql
CREATE TABLE pattern_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  hijri_year INT NOT NULL,
  hijri_month INT NOT NULL,
  hijri_day INT NOT NULL,
  cycle_day INT NOT NULL,          -- اليوم في الدورة (1-28)
  week_number INT NOT NULL,        -- الأسبوع (1-4)
  themes TEXT[] NOT NULL,          -- المواضيع المكتشفة
  depth_score INT NOT NULL,        -- 0-100
  shift_detected BOOLEAN DEFAULT FALSE,
  shift_description TEXT,
  daily_hint TEXT NOT NULL,        -- تلميح اليوم التالي
  weekly_summary TEXT,             -- يُملأ كل 7 أيام
  raw_ai_response JSONB,          -- الاستجابة الكاملة للتتبع
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, hijri_year, hijri_month, hijri_day)
);

  CHECK (depth_score BETWEEN 0 AND 100)
);

-- RLS: كل مستخدم يرى أنماطه فقط
ALTER TABLE pattern_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_insights" ON pattern_insights
  FOR ALL USING (auth.uid() = user_id);
```

> **ملاحظة:** جدول `pattern_insights` بيانات خادم (server-side) مثل `user_answers` الموجود. لا يتعارض مع قاعدة 5 في CLAUDE.md (LocalStorage للـ progress فقط).

### 3. صفحة "أنماطي" (`/patterns`)

**المسار:** `src/app/patterns/page.tsx`

**المحتوى:**
- **خط زمني هجري** — شريط أفقي يعرض أيام الدورة (١-٢٨) مع مؤشر عمق التمعّن لكل يوم
- **المواضيع المتكررة** — tags ملونة تُظهر المواضيع الأكثر تكرارًا (الحجم يعكس التكرار)
- **رسم بياني** — منحنى عمق التمعّن عبر الأيام (SVG مرسوم يدويًا بدون مكتبة خارجية)
- **لحظات التحوّل** — بطاقات تُبرز الأيام التي حصل فيها تحوّل ملحوظ مع وصفه
- **ملخص أسبوعي** — بطاقة لكل أسبوع من الأسابيع الأربعة

**التصميم:** يتبع ثيم تمعّن الحالي (داكن، RTL) — نفس الألوان المستخدمة في `DayExperience.tsx`

**اشتقاق cycle_day:** يُحسب من `taamun-content.ts` / `ramadan-28.ts` — نفس منطق تحديد اليوم الحالي في الدورة المستخدم في `/day`

### 4. تلميحات يومية (داخل `DayExperience`)

**الموقع:** أعلى صفحة التمعّن اليومية، قبل الآية

**المنطق:**
```
عند فتح صفحة اليوم:
  1. اقرأ daily_hint من pattern_insights لليوم السابق
  2. إذا موجود → اعرض بطاقة تلميح ناعمة
  3. إذا لا (اليوم الأول أو ما اشتغل المحلل) → لا تعرض شيء
```

**شكل التلميح:**
- بطاقة صغيرة بخلفية شفافة
- أيقونة ✦ + نص التلميح
- قابلة للإخفاء (dismiss)
- مثال: "في الأيام الماضية، تعمّقت في معنى الصبر — اليوم الآية تفتح لك بابًا جديدًا"

### 5. مكتبة التاريخ الهجري (`src/lib/hijri.ts`)

**الوظائف:**
- `getHijriDate()` — التاريخ الهجري الحالي
- `formatHijri(date)` — تنسيق "٣ رمضان ١٤٤٧"
- `getHijriMonthName(month)` — اسم الشهر بالعربي
- `hijriToGregorian(y, m, d)` — للتحويل عند الحاجة
- `gregorianToHijri(date)` — للتحويل من ميلادي

**التنفيذ:** `Intl.DateTimeFormat('ar-SA', { calendar: 'islamic-umalqura' })`

---

## تدفق البيانات

```
المستخدم يكتب تمعّنه
        ↓
  user_answers (Supabase)
        ↓
  المحلل الليلي (1:00 صباحًا)
        ↓
  pattern_insights (Supabase)
        ↓
   ┌────┴────┐
   ↓         ↓
صفحة     تلميح يومي
"أنماطي"  في DayExperience
```

## حدود النظام

- **لا يُصدر أحكامًا** — "لاحظنا" وليس "يجب عليك"
- **خصوصية** — كل مستخدم يرى أنماطه فقط
- **RLS** — سياسات Supabase تمنع الوصول غير المصرح
- **تكلفة AI** — ~12 استدعاء/ليلة حاليًا (يزيد مع المستخدمين)
- **فشل المحلل** — إذا فشل لمستخدم، يتخطاه ويكمل الباقي، يسجل الخطأ في Vercel Logs (console.error)
- **اختبار DayExperience** — أي تعديل على `DayExperience.tsx` يُختبر ضد `/day` لضمان عدم كسر الصفحة الحية

## الملفات المتأثرة

### ملفات جديدة:
- `src/lib/hijri.ts` — مكتبة التاريخ الهجري
- `src/app/api/cron/analyze-patterns/route.ts` — المحلل الليلي
- `src/app/patterns/page.tsx` — صفحة أنماطي
- `src/components/PatternTimeline.tsx` — الخط الزمني
- `src/components/ThemeCloud.tsx` — سحابة المواضيع
- `src/components/DepthChart.tsx` — رسم عمق التمعّن
- `src/components/DailyHint.tsx` — بطاقة التلميح

### ملفات تُعدَّل:
- `src/components/DayExperience.tsx` — إضافة DailyHint
- `src/components/Nav.tsx` — إضافة رابط "أنماطي"
- تحويل التواريخ الموجودة في الواجهات إلى هجري تدريجيًا

## خارج النطاق (للمراحل القادمة)

- تحسين ذاتي للمحتوى (النظام الثاني)
- استكشاف قرآني ذاتي (النظام الثالث)
- تحويل كامل النظام الداخلي من ميلادي لهجري (تدريجي)
