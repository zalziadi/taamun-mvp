# إعداد المدفوعات — Stripe + Supabase

## 1. إنشاء المنتجات في Stripe

1. افتح [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. أنشئ منتجَين:
   - **Starter (Basic)** — اشتراك شهري بـ 82 ريال
   - **Growth (Full)** — اشتراك شهري بـ 820 ريال
3. انسخ معرّف السعر `price_...` لكل منتج

## 2. متغيرات البيئة المطلوبة

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_FULL=price_...
NEXT_PUBLIC_APP_ORIGIN=https://taamun-mvp.vercel.app
NEXT_PUBLIC_SALES_EMAIL=sales@example.com   # اختياري — لزر تواصل VIP
```

## 3. إعداد Webhook في Stripe

1. افتح [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. أضف Endpoint:
   ```
   https://taamun-mvp.vercel.app/api/stripe/webhook
   ```
3. اختر هذه الأحداث:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. انسخ **Signing secret** (`whsec_...`) → ضعه في `STRIPE_WEBHOOK_SECRET`

## 4. تطبيق Migration في Supabase

```sql
-- الصق محتوى هذا الملف في Supabase → SQL Editor
-- supabase/migrations/20260320120000_customer_subscriptions.sql
```

أو عبر CLI:
```bash
supabase db push
```

## 5. إضافة المتغيرات في Vercel

افتح [Vercel → Project Settings → Environment Variables](https://vercel.com/dashboard) وأضف المتغيرات أعلاه.

ثم أعد النشر:
```bash
vercel --prod
```

## 6. التدفق الكامل

```
المستخدم يضغط "ادفع والاشتراك"
  → POST /api/checkout  { tier: "basic" | "full" }
  → ينشئ Stripe Checkout Session
  → يوجّه إلى Stripe
  → بعد الدفع: Stripe → POST /api/stripe/webhook
  → يُحدّث customer_subscriptions في Supabase
  → يوجّه المستخدم إلى /pricing/success
```

## 7. قفل الميزات (الخطوة التالية)

اقرأ حالة الاشتراك من `customer_subscriptions.status` في Middleware أو الصفحات:

```typescript
const { data } = await supabase
  .from("customer_subscriptions")
  .select("status, tier")
  .eq("user_id", userId)
  .maybeSingle();

const isActive = data?.status === "active";
```
