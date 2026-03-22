# خطة تفعيل Tap Payments — تمعّن

> **المشرف**: Cowork (Claude)
> **المنفذ**: شاهين (OpenClaw)
> **الوقت المتوقع**: أقل من ساعة
> **التاريخ**: 2026-03-23

---

## الحالة الحالية

الكود **مكتمل 100%** ولم يُفعَّل بعد. الملفات الموجودة:

| الملف | الحالة |
|-------|--------|
| `src/lib/tap.ts` | مكتمل — إنشاء واسترجاع Charges |
| `src/lib/checkoutProvider.ts` | مكتمل — يختار Tap تلقائياً عند وجود المفتاح |
| `src/lib/tapWebhookVerify.ts` | مكتمل — تحقق hashstring |
| `src/lib/tapSubscriptionSync.ts` | مكتمل — upsert في customer_subscriptions |
| `src/app/api/checkout/route.ts` | مكتمل — يدعم Tap و Stripe |
| `src/app/api/tap/webhook/route.ts` | مكتمل — webhook handler |
| `src/app/api/tap/verify/route.ts` | مكتمل — تحقق احتياطي |
| `src/app/pricing/success/page.tsx` | مكتمل — يتعامل مع tap_id |
| `supabase/migrations/20260321120000_tap_customer_subscriptions.sql` | مكتمل — يضيف أعمدة Tap |

**ما ينقص**: تهيئة env vars + تشغيل الهجرة + إعداد Tap Dashboard + تحديث UI.

---

## المهام لشاهين (بالترتيب)

### المهمة 1 — تشغيل هجرة Supabase (5 دقائق)

**الملف**: `supabase/migrations/20260321120000_tap_customer_subscriptions.sql`

شغّل محتوى هذا الملف في Supabase Dashboard → SQL Editor:

```sql
alter table public.customer_subscriptions
  add column if not exists payment_provider text not null default 'stripe';

alter table public.customer_subscriptions
  add column if not exists tap_charge_id text;

create unique index if not exists idx_customer_subscriptions_tap_charge
  on public.customer_subscriptions (tap_charge_id)
  where tap_charge_id is not null;
```

**تحقق**: في Table Editor تأكد أن `customer_subscriptions` فيها أعمدة `payment_provider` و `tap_charge_id`.

---

### المهمة 2 — ضبط متغيرات البيئة (10 دقائق)

#### في Vercel → Project Settings → Environment Variables:

| المتغير | القيمة | ملاحظة |
|---------|--------|--------|
| `PAYMENT_PROVIDER` | `tap` | يجبر استخدام Tap |
| `TAP_SECRET_KEY` | `sk_live_...` أو `sk_test_...` | من لوحة Tap |
| `TAP_AMOUNT_BASIC` | مثلاً `29.00` | سعر الباقة الأساسية بالريال |
| `TAP_AMOUNT_FULL` | مثلاً `79.00` | سعر الباقة الكاملة بالريال |
| `TAP_CURRENCY` | `SAR` | |
| `TAP_SOURCE_ID` | `src_card` | فيزا/ماستر/مدى |
| `TAP_MERCHANT_ID` | (من لوحة Tap إن طُلب) | اختياري |

#### في `.env.local` (للتطوير المحلي):

نفس القيم أعلاه بمفتاح الاختبار `sk_test_...`.

**مهم**: زياد يوفر القيم الفعلية من لوحة Tap → developers.tap.company → API Keys.

---

### المهمة 3 — إعداد Webhook في لوحة Tap (5 دقائق)

في لوحة Tap → Developers → Webhooks:

| الإعداد | القيمة |
|---------|--------|
| **URL** | `https://taamun-mvp.vercel.app/api/tap/webhook` |
| **Events** | `charge.captured` (أو All charge events) |

**ملاحظة**: Tap يرسل hashstring في الهيدر — الكود يتحقق منه تلقائياً.

---

### المهمة 4 — تحديث UI صفحة /pricing (20 دقيقة)

**الملف**: `src/app/pricing/PricingExperience.tsx`

التعديلات المطلوبة:

#### 4.1 — تحديث الأسعار في TIERS

```typescript
// سطر ~24: غيّر price من "—" إلى السعر الفعلي
{
  tierId: "basic",
  name: "أساسي",
  price: "29",     // ← السعر الفعلي
  // ...
},
{
  tierId: "full",
  name: "كامل",
  price: "79",     // ← السعر الفعلي
  // ...
},
```

#### 4.2 — تحديث النصوص لتعكس Tap بدل Stripe

**سطر ~222-224**: غيّر النص من:
```
ادفع بأمان عبر Stripe بعد تسجيل الدخول
```
إلى:
```
ادفع بأمان عبر بوابة Tap بعد تسجيل الدخول. يدعم بطاقات مدى وفيزا وماستركارد.
```

**سطر ~226-231**: احذف أو حدّث فقرة "للمستخدمين في السعودية" لأنها تذكر Stripe فقط. استبدلها بـ:
```
الدفع يتم عبر بوابة Tap المحلية — يدعم بطاقات مدى وفيزا وماستركارد و Apple Pay (حسب إعدادات حسابك في Tap).
```

**سطر ~232-237**: احذف فقرة "STC Pay وتابي وتمارا" لأنها مرتبطة بخطة مستقبلية وليست مفعّلة.

**سطر ~265**: غيّر نص السعر من:
```
الريال السعودي / شهريًا (يحدد في Stripe)
```
إلى:
```
ريال سعودي / شهريًا
```

**سطر ~118**: غيّر النص التوضيحي تحت زر الدفع من:
```
يتطلب تسجيل الدخول. الدفع يتم عبر Tap أو Stripe حسب إعداد الخادم (انظر docs/PAYMENTS.md).
```
إلى:
```
يتطلب تسجيل الدخول. الدفع يتم عبر بوابة Tap الآمنة.
```

#### 4.3 — حقل stripe في TierDef

غيّر اسم الحقل `stripe` إلى `checkout` (أو أبقه كما هو — لا يكسر شيئاً لأنه مجرد boolean داخلي). الأفضل إبقاؤه لتجنب كسر الكود.

---

### المهمة 5 — اختبار (15 دقيقة)

#### 5.1 — اختبار محلي

```bash
npm run dev
```

1. افتح `/pricing`
2. تأكد أن الأسعار تظهر بالأرقام الصحيحة
3. اضغط "ادفع والاشتراك" → يجب أن يوجه لصفحة Tap
4. استخدم بطاقة اختبار Tap: `4508 7500 1564 6623` (أو من وثائق Tap)

#### 5.2 — اختبار Webhook

بعد الدفع التجريبي:
- تأكد أن `customer_subscriptions` فيها سجل جديد بـ `payment_provider = 'tap'`
- تأكد أن `status = 'active'`

#### 5.3 — تحقق البناء

```bash
npx tsc --noEmit && npm run build
```

---

## ممنوعات (من CLAUDE.md)

- لا تضف مكتبات جديدة
- لا تعدّل ملفات لم تقرأها بالكامل
- لا تكسر الصفحات الحية
- شغّل tsc + build بعد كل تعديل

---

## بعد التفعيل

يحتاج زياد:
1. **مفاتيح Tap** الحقيقية (test أو live) من developers.tap.company
2. **تحديد الأسعار** الفعلية (basic و full)
3. **Redeploy** على Vercel بعد إضافة env vars
