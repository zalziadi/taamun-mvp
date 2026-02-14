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
- **28 كود ثابت:** TAAMUN-001 … TAAMUN-028 (مصدر الحقيقة: السيرفر، وليس localStorage).
- **حالة الاستخدام:** تُتبع على الجهاز فقط (localStorage) كمستوى MVP.
- كل كود يُستخدم مرة واحدة على نفس الجهاز.

### لوحة الأدمن
- **الوصول:** `/admin?admin=<ADMIN_KEY>` — يجب تطابق `NEXT_PUBLIC_ADMIN_KEY` في البيئة.
- **Vercel:** ضبط المتغير `NEXT_PUBLIC_ADMIN_KEY` في إعدادات المشروع.
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
