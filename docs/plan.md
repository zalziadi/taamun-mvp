# docs/plan.md — حدود التنفيذ

## نطاق MVP الحالي

### الصفحات
| المسار | الوظيفة |
|--------|---------|
| `/` | Landing — روابط إلى يومي / التقدم / الاشتراك |
| `/day` | يومي — آية + أسئلة + اختيار مرحلة + حفظ |
| `/progress` | التقدم — شبكة 28 يوم + إحصاءات |
| `/subscribe` | الاشتراك — واتساب + السعر 280 + تحميل الكتيّب |
| `/activate` | تفعيل الاشتراك — كود التفعيل (pending → active) |
| `/activate?code=TAAMUN-001` | تفعيل تلقائي من الرابط |
| `/book` | صفحة الكتيّب — الدليل والتطبيق 28 يوم |

### تفعيل الأكواد (One-Time)
- **نوعان من الأكواد:**
  - **باقة 280:** TAAMUN-001 … TAAMUN-028 — يفعّل entitlement فقط
  - **باقة 820:** TAAMUN-820-001 … TAAMUN-820-010 — يفعّل entitlement + مسح الآية
- **حالة الاستخدام:** تُتبع على الجهاز فقط (localStorage) — نفس المفتاح للمستخدمين.
- كل كود يُستخدم مرة واحدة على نفس الجهاز.

### أصل التطبيق (App Origin)
- **NEXT_PUBLIC_APP_ORIGIN:** ضع في Vercel رابط الإنتاج الكامل (مثل `https://taamun-mvp.vercel.app`) لضمان أن روابط التفعيل ونسخ واتساب تستخدم النطاق الصحيح.

### لوحة الأدمن
- **الوصول:** `/admin?admin=<KEY>` أو `/admin/activations?admin=<KEY>` — يتم التحقق من المفتاح على الخادم عبر `/api/admin/verify`.
- **Vercel:** ضبط المتغير `ADMIN_KEY` في إعدادات المشروع (سري، لا يستخدم NEXT_PUBLIC).
- صفحات: `/admin` (الرئيسية)، `/admin/codes` (عرض 28 كود، نسخ رابط التفعيل/الكود، مسح المستخدمة على الجهاز).

### البيانات
- `Phase`: `'shadow' | 'awareness' | 'contemplation'`
- `DayEntry`: `{ dayId, phase, note?, answeredAtISO }`
- `ProgressState`: `{ version: 1, entries: Record<string, DayEntry> }`

### القيود
- لا مكتبات جديدة
- لا تغيير إعدادات build إلا للضرورة
- كل شيء تحت `src/`
- RTL من البداية
