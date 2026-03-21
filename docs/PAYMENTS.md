# Stripe — الدفع الحقيقي (تمَعُّن)

## ما الذي يعمل؟

- **POST `/api/checkout`**: ينشئ جلسة **Stripe Checkout** (اشتراك شهري `subscription`) للمستخدم المسجّل.
- **POST `/api/stripe/webhook`**: يستقبل أحداث Stripe ويحدّث جدول **`customer_subscriptions`** في Supabase.
- صفحة **`/pricing`**: أزرار **أساسي** و **كامل** تبدأ الدفع؛ باقة **دعم خاص** عبر البريد (`NEXT_PUBLIC_SALES_EMAIL`).

## متغيرات البيئة (Vercel + محلي)

| المتغير | وصف |
|--------|-----|
| `STRIPE_SECRET_KEY` | المفتاح السري من لوحة Stripe |
| `STRIPE_WEBHOOK_SECRET` | سر توقيع الـ webhook (Signing secret) |
| `STRIPE_PRICE_BASIC` | معرف السعر `price_...` لباقة أساسي (شهري) |
| `STRIPE_PRICE_FULL` | معرف السعر `price_...` لباقة كامل (شهري) |
| `SUPABASE_SERVICE_ROLE_KEY` | موجود مسبقًا — مطلوب للويبهوك لكتابة الجدول |
| `NEXT_PUBLIC_APP_ORIGIN` | مثل `https://taamun-mvp.vercel.app` (لروابط النجاح/الإلغاء) |
| `NEXT_PUBLIC_SALES_EMAIL` | اختياري — بريد لزر «تواصل معنا» في باقة الدعم |

## Stripe Dashboard

1. أنشئ **منتجين** (أو منتجًا واحدًا بسعرين) للاشتراك الشهري.
2. انسخ **`price_...`** لكل باقة والصقها في `STRIPE_PRICE_BASIC` و `STRIPE_PRICE_FULL`.
3. **Developers → Webhooks → Add endpoint**  
   - URL: `https://YOUR_DOMAIN/api/stripe/webhook`  
   - الأحداث المطلوبة على الأقل:  
     `checkout.session.completed`  
     `customer.subscription.updated`  
     `customer.subscription.deleted`
4. انسخ **Signing secret** إلى `STRIPE_WEBHOOK_SECRET`.

## Supabase

طبّق الهجرة:

`supabase/migrations/20260320120000_customer_subscriptions.sql`

(أو نفّذ SQL من لوحة Supabase.)

## اختبار محلي للويبهوك

استخدم Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

ثم انسخ الـ secret المؤقت إلى `.env.local`.

## ملاحظات

- الدفع يتطلب **تسجيل دخول**؛ عند 401 يُوجَّه المستخدم إلى `/auth?next=/pricing`.
- حقل **`client_reference_id`** = `user.id` لربط الاشتراك بالمستخدم في الويبهوك.

## السعودية — أفضل ممارسات الدعم

1. **العملة**  
   عرّف أسعار الاشتراك في Stripe بالـ **SAR** (ريال سعودي) لكل `price_...` المستخدم في `STRIPE_PRICE_BASIC` و `STRIPE_PRICE_FULL`.

2. **مدى (Mada) والمحافظ**  
   من لوحة Stripe: **Settings → Payment methods**  
   فعّل ما يناسب حسابك في السعودية، مثل **Cards** (وتشمل عادة بطاقات مدى عند توفرها لحسابك)، و**Apple Pay** و**Google Pay** إن ظهرت لك.  
   الكود الحالي **لا يقيّد** نوع الدفع إلى «بطاقة فقط»؛ جلسة Checkout تعرض الوسائل التي فعّلتها في اللوحة.

3. **النطاق والموقع**  
   أضف نطاق الإنتاج في **Stripe → Settings → Domains** (لـ Checkout وربط Apple Pay إن لزم).

4. **الضريبة (ضريبة القيمة المضافة)**  
   إن كنت تفرض VAT، راجع **Stripe Tax** أو أسعارك شاملة/غير شاملة حسب سياسة المنشأة (إعداد يدوي في المنتجات).

5. **اختبار**  
   استخدم **بطاقات اختبار** Stripe ثم **دفعة تجريبية حقيقية بمبلغ صغير** بعد التفعيل.

## Stripe + Tap + تابي + تمارا + STC Pay (دعم متعدد)

| المزود | ماذا يغطي عادةً | ملاحظة تقنية في المشروع |
|--------|------------------|-------------------------|
| **Stripe** | بطاقات عالمية، وغالبًا مدى / Apple Pay / Google Pay عند التفعيل في اللوحة | **مفعّل حاليًا**: `POST /api/checkout` + Checkout Session + webhook |
| **Tap (تاب)** | بوابة مدفوعات سعودية (مدى، بطاقات، وغالبًا طرق إضافية حسب العقد) | تكامل منفصل (API Tap) عند الحاجة — يمكن أن يجمع عدة طرق في صفحة واحدة |
| **Tabby (تابي)** | شراء الآن وادفع لاحقًا (BNPL) | تكامل عبر **واجهة Tabby للتجار** (جلسة دفع/redirect) + webhook خاص |
| **Tamara (تمارا)** | تقسيط / BNPL | مثل Tabby — عقد تاجر + API تمارا |
| **STC Pay** | محفظة **stc** | غالبًا **لا يُضاف كزر داخل Stripe مباشرة**؛ يُفعّل عبر **بوابة سعودية** (مثل Tap أو مزود معتمد من stc) أو **برنامج STC Pay للأعمال** |

**استراتيجية عملية:**  
1. الإبقاء على **Stripe** للاشتراك الشهري الحالي (ما هو منصوب في الكود).  
2. لإظهار **STC Pay + تابي + تمارا** للمستخدم نفسه: إمّا ربط **Tap** (إن وفّرت طرقك هناك) أو **مسارات دفع إضافية** (أزرار/صفحات) لكل من Tabby وTamara مع **مزامنة حالة الاشتراك** في `customer_subscriptions` أو جدول منفصل.  
3. قبل البرمجة: إكمال **عقود التاجر** مع Tabby وTamara وTap/stc والحصول على مفاتيح الاختبار والإنتاج.

**مرجع الكود الحالي لـ Stripe:** `src/lib/stripe.ts`، `src/app/api/checkout/route.ts`، `src/app/api/stripe/webhook/route.ts` — ويمكن إضافة لاحقًا مسارات API لـ Tap/تابي/تمارا/STC Pay بعد توقيع العقود.

## Tap Payments — مفعّل في الكود (دفعة + تفعيل اشتراك)

عند ضبط **`TAP_SECRET_KEY`** و **`TAP_AMOUNT_BASIC`** و **`TAP_AMOUNT_FULL`** (بالريال SAR)، يختار `/api/checkout` تلقائيًا **Tap** ما لم تضبط `PAYMENT_PROVIDER=stripe`.

| المتغير | الوصف |
|--------|--------|
| `PAYMENT_PROVIDER` | اختياري: `tap` أو `stripe` لتجاوز الاختيار التلقائي |
| `TAP_SECRET_KEY` | المفتاح السري من لوحة Tap |
| `TAP_MERCHANT_ID` | اختياري — إن طلبته بيانات الحساب |
| `TAP_AMOUNT_BASIC` / `TAP_AMOUNT_FULL` | المبلغ بالريال (مثلاً `29.00`) |
| `TAP_CURRENCY` | افتراضي `SAR` |
| `TAP_SOURCE_ID` | افتراضي `src_card` (فيزا/ماستر/مدى على صفحة Tap)؛ أو `src_sa.mada` لمدى فقط |
| `TAP_CUSTOMER_PHONE` | رقم جوال للعميل في طلب Tap (مثلاً `9665XXXXXXXX`) |

**Endpoints:**

- `POST /api/checkout` — ينشئ Charge في Tap ويعيد `transaction.url` للتحويل.
- `POST /api/tap/webhook` — يستقبل الـ webhook (hashstring) ويحدّث `customer_subscriptions`.
- `POST /api/tap/verify` — تأكيد احتياطي بعد إعادة التوجيه بـ `tap_id`.

**قاعدة البيانات:** نفّذ هجرة `supabase/migrations/20260321120000_tap_customer_subscriptions.sql`.

**ملاحظة:** تدفق Tap الحالي يفعّل **فترة اشتراك 30 يومًا** بعد دفعة ناجحة (`CAPTURED`)؛ ليس نفس اشتراك Stripe المتكرر تلقائيًا. لاحقًا يمكن ربط خطط Tap أو تكرار الدفع حسب عقدك.
