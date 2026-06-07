# فهرس n8n Brains — منظومة الأتمتة

17 workflow لتشغيل المنظومة آلياً. كل brain له دور محدد ومرتبط بشخصية واحدة على الأقل من الفريق (وردة · مسخّر · مستشار · سمرا · ذئب الشمال).

> **ملاحظة:** الحقل `active` فارغ في كل الملفات — يعني هذي blueprints جاهزة للاستيراد في n8n، مش instances نشطة. لتشغيلها، استورد الملف في n8n ثم فعّل من واجهة n8n.

---

## 🎯 طبقة الاستراتيجية (مرتبطة بـ mustashar)

| الـ Brain | الملف | عقد | الدور |
|---|---|---|---|
| Strategic Brain — Vision & Direction Layer | `strategic-brain.json` | 13 | الطبقة العليا — الرؤية والاتجاه. كل القرارات الكبرى تمر من هنا. |
| Execution Control Brain — Strategy Alignment Gate | `execution-control-brain.json` | 8 | بوابة التنفيذ — تتأكد إن كل مهمة تنفيذية متماشية مع الاستراتيجية |
| Borhan 2.0 — Decision Engine | `borhan-decision-engine.json` | 8 | محرّك قرار يقيّم البدائل بمعايير صريحة (شقيق dbos-decision-court skill) |
| Decision Router — Guardrails + Approval + Routing | `decision-router.json` | 14 | يوجّه القرارات للمكان الصحيح، مع حواجز موافقة |
| Resource Allocator — Smart Priority Engine | `resource-allocator.json` | 7 | يخصّص الموارد (وقت/مال/فريق) حسب الأولوية |

## 🐺 طبقة النمو والتسويق (مرتبطة بـ wolf)

| الـ Brain | الملف | عقد | الدور |
|---|---|---|---|
| Growth Brain God Mode — Core Intelligence | `growth-brain-godmode.json` | 12 | العقل الرئيسي للنمو — يربط كل قنوات الـ acquisition |
| Growth Brain — Intelligence Layer | `growth-brain.json` | 9 | الإصدار الأبسط من God Mode — لمهام النمو اليومية |
| Content Engine 2.0 — Self-Learning Factory | `content-engine-2.0.json` | 12 | مصنع محتوى يتعلّم من الأداء ويحسّن نفسه |
| Auto A/B Testing — Kill or Scale | `ab-testing-auto.json` | 8 | يدير اختبارات A/B تلقائياً — يقتل الخاسر، يضاعف الرابح |
| IG Engagement Booster | `ig-engagement-booster.json` | 10 | تفاعل proactive في انستقرام (كومنت + ستوريز) |
| Instagram Engagement — Auto Comment Reply + DM Converter | `instagram-engagement.json` | 16 | يرد على كومنتات IG ويحوّل المهتمين لـ DM |
| Competitor Watcher — Intelligence Agent | `competitor-watcher.json` | 7 | يراقب المنافسين ويستخرج إشارات |
| Learning Loop — Self-Evolution Engine | `learning-loop.json` | 11 | حلقة تعلّم — يأخذ نتائج التنفيذ ويحسّن القرارات القادمة |

## 🌸 طبقة المبيعات والعملاء (مرتبطة بـ warda)

| الـ Brain | الملف | عقد | الدور |
|---|---|---|---|
| Warda — Sales Auto Reply | `warda-sales-auto.json` | 6 | الرد التلقائي لوردة على رسائل المبيعات |
| Offer Generator — Dynamic Offer Factory | `offer-generator.json` | 8 | يولّد عروض ديناميكية حسب سلوك العميل (مرتبط بـ offer-designer skill) |

## 📊 طبقة المتابعة العامة

| الـ Brain | الملف | عقد | الدور |
|---|---|---|---|
| Live Counter — Target Tracker | `live-counter.json` | 4 | عداد لحظي للأهداف (مثلاً: 28/55 مقعد بيع) |
| Site Audit Ingester — GSD → Brain → Tasks | `site-audit-ingester.json` | 6 | يستقبل تقارير فحص الموقع ويحوّلها لمهام |

---

## كيف تشغّل brain جديد

1. افتح n8n (محلياً أو على cloud)
2. Workflows → Import from File → اختر `.json` من هذا المجلد
3. اربط الـ credentials المطلوبة (Salla, Supabase, OpenAI، إلخ)
4. فعّل الـ workflow

## العلاقات الحرجة

```
strategic-brain (الأعلى)
    ↓ يوجّه
execution-control-brain → decision-router → resource-allocator
    ↓ ينتج مهام تنفيذية لـ
growth-brain-godmode → content-engine-2.0 → ab-testing-auto
    ↓ ينتج عروض لـ
offer-generator → warda-sales-auto (للعميل)
    ↑ يغذّيها بنتائج
learning-loop ← (كل brain يرفع نتائج هنا)
```
