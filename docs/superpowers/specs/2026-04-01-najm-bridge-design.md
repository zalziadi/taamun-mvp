# جسر تمعّن ↔ نجم الجنوب

**التاريخ:** ٣ رمضان ١٤٤٧ هـ
**الهدف:** ربط المحلل الليلي بداشبورد نجم الجنوب عبر تقارير مُجمَّعة ومهام تحسين دورية

---

## التدفق

```
المحلل الليلي (01:00) → يحلل كل مستخدم
  ↓
يُجمّع النتائج → najm_reports (تقرير الليلة)
  ↓
يكتشف فرص تحسين → najm_tasks (مهام pending)
  ↓
داشبورد /najm (أنت تراجع وتوافق)
  ↓
status = approved → CJ يستلم وينفذ
  ↓
status = completed → الحلقة تكمل
```

## الجداول (في Supabase تمعّن، prefix: najm_)

### najm_reports
```sql
id UUID PK,
hijri_date TEXT NOT NULL,           -- "٣ رمضان ١٤٤٧"
cycle_day INT NOT NULL,
total_users INT NOT NULL,
active_users INT NOT NULL,
district_distribution JSONB,        -- {"1": 3, "2": 5, ...}
state_distribution JSONB,           -- {"shadow": 6, "gift": 4, "potential": 2}
avg_depth_score INT,
shifts_count INT,
ai_summary TEXT NOT NULL,           -- ملخص AI بجملتين
raw_data JSONB,
created_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE(cycle_day)
```

### najm_tasks
```sql
id UUID PK,
title TEXT NOT NULL,
description TEXT NOT NULL,
type TEXT CHECK (type IN ('improvement', 'observation', 'alert')),
priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
status TEXT CHECK (status IN ('pending', 'approved', 'running', 'completed', 'rejected')) DEFAULT 'pending',
district INT CHECK (district BETWEEN 1 AND 9),
source TEXT DEFAULT 'analyzer',     -- analyzer | manual
metadata JSONB,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
```

## المكونات

### 1. مكتبة الجسر (`src/lib/najm-bridge.ts`)
- `generateNightlyReport(insights)` — يُجمّع نتائج التحليل في تقرير
- `detectImprovementTasks(insights)` — يكتشف فرص التحسين ويُنشئ مهام
- يستخدم AI لتوليد الملخص واكتشاف المهام

### 2. توسيع المحلل الليلي
- بعد تحليل جميع المستخدمين، يستدعي `generateNightlyReport` + `detectImprovementTasks`

### 3. صفحة داشبورد (`/najm`)
- تقارير: خط زمني بالتقارير اليومية
- مهام: قائمة مهام مع أزرار موافقة/رفض
- محمية بـ admin check

### 4. API للموافقة (`/api/najm/approve`)
- POST مع task_id → يغيّر status من pending إلى approved

## قواعد اكتشاف المهام

المحلل يُنشئ مهمة تلقائيًا عندما:
- ٧٠%+ من المستخدمين في نفس الحي → "تركّز في حي X — اقتراح تنويع"
- ٥٠%+ في حالة ظل → "أغلب المستخدمين في الظل — اقتراح تعديل الأسئلة"
- تحوّل مكتشف (shift) → "تحوّل في حي X — فرصة تعميق"
- متوسط depth_score < 30 → "عمق منخفض — اقتراح مراجعة المحتوى"
- متوسط depth_score > 80 → "عمق عالي — ملاحظة إيجابية"
