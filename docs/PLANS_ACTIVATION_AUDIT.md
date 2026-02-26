# تقرير تدقيق نظام الباقات والتفعيل — Taamun MVP

**التاريخ:** 2026-02-16  
**الحالة:** ✅ جاهز للإطلاق بعد الإصلاحات

---

## 1️⃣ النتيجة النهائية

| التصنيف | الحالة |
|---------|--------|
| ✅ **Architecture Clean** | تم |
| ⚠️ **Minor Issues** | تم إصلاحها |
| ❌ **Critical Risk** | لا يوجد |

---

## 2️⃣ الإصلاحات المنفذة

### plans.ts
- **RAMADAN_ENDS_AT_ISO**: يُستمد من `RAMADAN_START_DATE_UTC` في `ramadan-28.ts` — مصدر واحد فقط، لا تكرار.
- **normalizePlan**: إضافة `ramadan28`, `80`, `220` لدعم جميع الـ legacy aliases.
- **isPlan820Alias**: دالة مركزية جديدة — entitlement.ts يستخدمها بدل المقارنات المباشرة.

### entitlement.ts
- إزالة جميع `plan === "base"` و `plan === "plan820"` المباشرة.
- استخدام `isPlan820Alias(planKey)` و `normalizePlan(planKey)` من plans.ts فقط.
- `PlanKey` يحتوي على الأسماء الموحدة فقط.

### migration SQL
- إضافة `docs/sql/migrate_plans_to_canonical.sql` لتوحيد البيانات القديمة في activation_codes و entitlements.

---

## 3️⃣ التحقق من الملفات

### src/lib/plans.ts ✅
- `normalizePlan()` — يغطي base, plan_280, plan820, 820, trial, ramadan28, 80, 220.
- `getEndsAtForPlan()` — جميع الخطط الأربعة + ramadan_ended + unknown_plan.
- `getPlanLabel()` — التسميات العربية للأربعة.
- `RAMADAN_ENDS_AT_ISO` — مستمد من ramadan-28، مصدر وحيد.

### src/app/api/activate/route.ts ✅
- `activation.plan` لا يُستخدم مباشرة — يمر عبر `normalizePlan(rawPlan)`.
- `unknown_plan` → 400.
- `ramadan_ended` → 400.
- entitlements: `plan` الموحد فقط، `starts_at = now()`، `ends_at` من `getEndsAtForPlan()`.

### src/lib/entitlement.ts ✅
- لا يوجد منطق hardcoded — يستخدم `isPlan820Alias` و `normalizePlan` من plans.ts.

### /activate/page.tsx ✅
- `getPlanLabel(activatedPlan)` لعرض التسمية.
- لا يوجد switch على أسماء الخطط — فقط على `errorCode` (ramadan_ended, unknown_plan) لرسائل الخطأ.
- الرسائل واضحة للمستخدم.

---

## 4️⃣ سيناريوهات الاختبار

| السيناريو | HTTP | UI | entitlements |
|-----------|------|-----|--------------|
| كود قديم plan=base | 200 | "باقة 280 الشهرية" | plan_280_monthly ✓ |
| كود قديم plan=plan820 | 200 | "باقة 820 السنوية" | plan_820_full ✓ |
| كود جديد plan=ramadan_28 | 200 | "باقة رمضان 28" | ramadan_28 ✓ |
| كود trial_24h | 200 | "تجربة 24 ساعة" | trial_24h ✓ |
| كود منتهي (expires_at) | 400 | "الكود غير صالح" | — |
| كود بعد رمضان (ramadan_28) | 400 | "انتهى رمضان" | — |
| كود unknown_plan | 400 | "خطأ في نوع الباقة" | — |

---

## 5️⃣ قاعدة البيانات

- **activation_codes**: قد تحتوي plan قديم (base, plan820). الـ API يعمل عبر normalizePlan. للمرونة يُنصح بتشغيل migration.
- **entitlements**: يُحفظ فيها plan موحد فقط (من API). أي بيانات قديمة يمكن توحيدها عبر migration.
- **Migration**: `docs/sql/migrate_plans_to_canonical.sql`

---

## 6️⃣ هل النظام آمن للإطلاق؟

**نعم.** جميع الأكواد القديمة تعمل عبر normalizePlan. لا يوجد plan غير معروف يمكن أن يكسر التفعيل — يُعاد 400 مع رسالة واضحة.

---

## 7️⃣ خطر تضارب رمضان؟

**لا.** `RAMADAN_ENDS_AT_ISO` مستمد من `RAMADAN_START_DATE_UTC` في ملف واحد. تحديث رمضان-28.ts يحدث نهاية رمضان تلقائياً.

---

## 8️⃣ منطق مكرر؟

**لا.** plans.ts هو المصدر الوحيد لـ:
- أسماء الخطط
- حساب ends_at
- التسميات العربية
- تحديد plan 820
