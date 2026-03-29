# وردة — بوت واتساب ذكي

بوت واتساب يعمل بـ Claude لخدمة عملاء تمعّن + مسخّر + The Real Money.

---

## المتطلبات

- Node.js 20+
- حساب Anthropic (API Key)
- حساب Meta Business (WhatsApp Business API)
- رابط عام (HTTPS) لاستقبال الـ webhook

---

## التثبيت

```bash
cd warda-whatsapp
npm install
cp .env.example .env
# عدّل .env بمفاتيحك
```

---

## إعداد WhatsApp Business API

### الخطوة 1: إنشاء تطبيق Meta

1. ادخل https://developers.facebook.com
2. اضغط "My Apps" ثم "Create App"
3. اختر "Business" كنوع التطبيق
4. سمّه "Warda Bot" (أو أي اسم)

### الخطوة 2: إضافة WhatsApp

1. في لوحة التطبيق، اضغط "Add Product"
2. اختر "WhatsApp"
3. اختر حسابك التجاري (Meta Business Account)

### الخطوة 3: إعداد رقم الهاتف

1. اذهب لـ WhatsApp > Getting Started
2. ستجد:
   - **Phone Number ID** ← انسخه لـ `WHATSAPP_PHONE_NUMBER_ID`
   - **Temporary Access Token** ← انسخه لـ `WHATSAPP_TOKEN`
3. للتوكن الدائم: اذهب System Users في Business Settings واصنع توكن دائم

### الخطوة 4: إعداد الـ Webhook

1. اذهب لـ WhatsApp > Configuration
2. في Webhook URL ضع: `https://YOUR-DOMAIN/webhook`
3. في Verify Token ضع نفس القيمة في `WHATSAPP_VERIFY_TOKEN`
4. اضغط Verify and Save
5. اشترك في `messages` (هذا يخلي Meta يرسل لك الرسائل الواردة)

---

## تشغيل السيرفر

### محلياً (للاختبار):

```bash
npm run dev
```

لتعريض السيرفر المحلي للإنترنت (عشان الـ webhook):

```bash
# باستخدام ngrok (مجاني):
npx ngrok http 3001
# انسخ الرابط HTTPS وضعه في Meta webhook settings
```

### على سيرفر (للإنتاج):

الخيارات الموصى بها (من الأسهل):

**Railway (الأسهل):**
1. ارفع الكود على GitHub
2. ادخل https://railway.app
3. اربط الـ repo
4. أضف متغيرات البيئة
5. يعطيك رابط HTTPS تلقائياً

**Vercel (مجاني لكن محدود):**
- يحتاج تحويل لـ Vercel Functions (serverless)
- مناسب لو حجم الرسائل قليل

**VPS (أكثر تحكم):**
```bash
# على سيرفر Ubuntu مثلاً:
git clone your-repo
cd warda-whatsapp
npm install
# استخدم PM2 للتشغيل الدائم:
npm install -g pm2
pm2 start server.js --name warda
pm2 save
```

---

## اختبار

بعد التشغيل:

```bash
# تحقق من الصحة:
curl http://localhost:3001/health

# أرسل رسالة من واتساب لرقم البوت وشوف الرد
```

---

## التكلفة التقديرية (شهرياً)

| البند | التكلفة |
|-------|---------|
| Claude API (Haiku, 500 رسالة) | ~$1-3 |
| WhatsApp (ردود خدمة عملاء) | مجاني ضمن 24 ساعة |
| WhatsApp (رسائل تسويقية) | ~$0.05-0.15 لكل رسالة |
| Railway/استضافة | ~$5/شهر |
| **المجموع** | **~$7-15/شهر** |

---

## ملاحظات مهمة

- **نافذة 24 ساعة**: لو العميل راسلك، تقدر ترد مجاناً خلال 24 ساعة. بعدها تحتاج قوالب معتمدة من Meta.
- **الذاكرة**: البوت يحفظ آخر 10 رسائل لكل عميل في الذاكرة. إذا أعدت تشغيل السيرفر تنمسح. لو تبغى ذاكرة دائمة، نضيف قاعدة بيانات.
- **النصوص فقط حالياً**: البوت يعالج رسائل نصية. الصور والصوت يحتاجون تطوير إضافي.

---

## الملفات

```
warda-whatsapp/
├── server.js                  # السيرفر الرئيسي
├── warda-system-prompt.md     # شخصية وردة (prompt)
├── package.json               # المكتبات
├── .env.example               # نموذج متغيرات البيئة
└── README.md                  # هذا الملف
```
