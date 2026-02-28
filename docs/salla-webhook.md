# ربط سلة Webhook — تمعّن

## نظرة عامة

عند إتمام طلب شراء في سلة، تُرسل سلة طلب `POST` تلقائياً إلى نقطة النهاية التالية:

```
POST /api/salla/webhook
```

يقوم السيرفر بـ:
1. التحقق من التوقيع HMAC-SHA256
2. إنشاء كود تفعيل بصيغة `RAMADAN-XXXXXX`
3. حفظه في جدول `activation_codes` في Supabase
4. إرسال إيميل للعميل يحتوي الكود ورابط التفعيل المباشر

---

## إعداد الـ Webhook في لوحة سلة

1. ادخل إلى **لوحة تحكم سلة** → **التطبيقات** → تطبيقك
2. اذهب إلى تبويب **Webhooks**
3. انقر **إضافة Webhook جديد**
4. اضبط الإعدادات التالية:

| الحقل | القيمة |
|-------|--------|
| **الحدث** | `order.completed` |
| **URL** | `https://taamun.app/api/salla/webhook` |
| **الطريقة** | POST |

5. انسخ **Webhook Secret** وأضفه إلى متغيرات البيئة (انظر أدناه)

---

## متغيرات البيئة المطلوبة

```bash
# مطلوب — سر التوقيع من لوحة سلة
SALLA_WEBHOOK_SECRET=your_salla_webhook_secret_here

# اختياري — مفتاح Resend لإرسال الإيميل الفعلي
# إذا لم يُضبط: الإيميلات تُطبع في console فقط (وضع التطوير)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx

# اختياري — العنوان المُرسِل (يجب التحقق منه في Resend)
RESEND_FROM_EMAIL=taamun@yourdomain.com

# موجود مسبقاً — يُستخدم لبناء رابط التفعيل في الإيميل
NEXT_PUBLIC_APP_ORIGIN=https://taamun.app
```

---

## هيكل الـ Payload المتوقع من سلة

```json
{
  "event": "order.completed",
  "data": {
    "id": 123456,
    "customer": {
      "name": "أحمد محمد",
      "email": "ahmed@example.com"
    },
    "items": [
      { "product_id": 789 }
    ]
  }
}
```

الحقول المستخدمة:
- `data.id` → `salla_order_id`
- `data.customer.email` → `customer_email` (مطلوب)
- `data.customer.name` → `customer_name`
- `data.items[0].product_id` → `salla_product_id`

---

## كيفية اختبار الـ Webhook محلياً

### 1. تشغيل السيرفر المحلي

```bash
npm run dev
```

### 2. كشف المنفذ المحلي باستخدام ngrok

```bash
npx ngrok http 3000
# سيعطيك URL مثل: https://abc123.ngrok.io
```

### 3. ضبط المتغيرات في `.env.local`

```bash
SALLA_WEBHOOK_SECRET=test_secret_123
NEXT_PUBLIC_APP_ORIGIN=http://localhost:3000
```

### 4. إرسال طلب تجريبي

```bash
# احسب التوقيع أولاً:
BODY='{"event":"order.completed","data":{"id":999,"customer":{"name":"تجربة","email":"test@example.com"},"items":[{"product_id":1}]}}'
SECRET="test_secret_123"
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')

# أرسل الطلب:
curl -X POST http://localhost:3000/api/salla/webhook \
  -H "Content-Type: application/json" \
  -H "x-salla-signature: $SIG" \
  -d "$BODY"
```

**الاستجابة المتوقعة:**
```json
{ "ok": true, "code": "RAMADAN-123456" }
```

### 5. التحقق من قاعدة البيانات

```sql
select code, customer_email, customer_name, salla_order_id, created_at
from activation_codes
where code like 'RAMADAN-%'
order by created_at desc
limit 10;
```

---

## جدول قاعدة البيانات

الميجريشن: `supabase/migrations/20260227000000_salla_webhook_fields.sql`

الأعمدة المضافة إلى `activation_codes`:

| العمود | النوع | الوصف |
|--------|-------|-------|
| `salla_order_id` | `text` (nullable) | رقم الطلب من سلة |
| `customer_email` | `text` (nullable) | إيميل العميل |
| `customer_name` | `text` (nullable) | اسم العميل |
| `salla_product_id` | `text` (nullable) | معرّف المنتج في سلة |

---

## الأمان

- يُتحقق من توقيع HMAC-SHA256 عند كل طلب
- يُستخدم `timingSafeEqual` لمنع timing attacks
- الكودات تنتهي بعد 60 يوماً من الإنشاء (قابل للتعديل)
- كل كود يُستخدم مرة واحدة فقط (`max_uses = 1`)
