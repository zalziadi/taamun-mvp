# خطة نشر عيدية تمعّن على Instagram — خطوة بخطوة

---

## المرحلة ١: تجهيز حساب Instagram (٥ دقائق)

### ١.١ تحويل الحساب إلى Business/Creator
1. افتح Instagram → الإعدادات → الحساب
2. اختر "التبديل إلى حساب احترافي"
3. اختر "منشئ محتوى" أو "نشاط تجاري"
4. اختر فئة مناسبة (مثل: "تعليم" أو "تطبيق")

### ١.٢ ربط بـ Facebook Page
1. افتح Instagram → الإعدادات → الحساب → المشاركة على تطبيقات أخرى
2. اربط بصفحة Facebook (أنشئ واحدة جديدة إذا ما عندك)
3. تأكد إن الصفحة متصلة بالحساب

---

## المرحلة ٢: إنشاء Facebook App وتوليد Token (١٥ دقيقة)

### ٢.١ إنشاء تطبيق Facebook
1. ادخل: https://developers.facebook.com/apps/
2. اضغط "Create App"
3. اختر "Business" → اسم التطبيق: "Taamun Publisher"
4. أضف منتج "Instagram Graph API"

### ٢.٢ توليد Access Token
1. ادخل Graph API Explorer: https://developers.facebook.com/tools/explorer/
2. اختر تطبيقك "Taamun Publisher"
3. اضغط "Generate Access Token"
4. فعّل هذي الصلاحيات:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
5. وافق على الأذونات
6. انسخ الـ Token

### ٢.٣ تحويل إلى Long-Lived Token (يدوم ٦٠ يوم)
```
GET https://graph.facebook.com/v22.0/oauth/access_token?
  grant_type=fb_exchange_token&
  client_id=APP_ID&
  client_secret=APP_SECRET&
  fb_exchange_token=SHORT_LIVED_TOKEN
```
احفظ الـ long-lived token — هذا اللي بنستخدمه.

### ٢.٤ جلب Instagram Business Account ID
```
GET https://graph.facebook.com/v22.0/me/accounts?access_token=LONG_TOKEN
```
من النتيجة، خذ الـ Page ID، ثم:
```
GET https://graph.facebook.com/v22.0/PAGE_ID?fields=instagram_business_account&access_token=LONG_TOKEN
```
احفظ الـ `instagram_business_account.id` — هذا الـ IG User ID.

---

## المرحلة ٣: رفع الصور على رابط عام (٥ دقائق)

Instagram API يسحب الصور من URL عام — ما يقبل رفع مباشر.

### الخيار الأسهل: Vercel (عندك deploy جاهز)
الصور موجودة في `public/eid-ads/` — بمجرد ما تعمل deploy على Vercel، كل صورة تصير متاحة على:
```
https://taamun-mvp.vercel.app/eid-ads/c1-slide1-cover.png
```

### بعد الـ deploy، تأكد إن الروابط شغالة:
```bash
curl -I https://taamun-mvp.vercel.app/eid-ads/c1-slide1-cover.png
# لازم يرجع 200 OK
```

---

## المرحلة ٤: إعداد n8n Workflow (١٠ دقائق)

### ٤.١ تثبيت نود Instagram في n8n
في n8n → Settings → Community Nodes → Install:
```
@mookielianhd/n8n-nodes-instagram
```

### ٤.٢ إضافة Credential
1. n8n → Credentials → New
2. اختر "Instagram API"
3. الصق الـ Long-Lived Token

### ٤.٣ بناء الـ Workflow

#### Workflow 1: نشر كاروسيل
```
[Manual Trigger] → [Instagram: Carousel → Publish]
```
إعدادات نود Instagram:
- Resource: `Carousel`
- Operation: `Publish`
- Node (IG User ID): `YOUR_IG_USER_ID`
- Caption: (الكابشن من campaign-day1-content.md)
- Carousel Media: 6 items (URLs للصور)

#### Workflow 2: نشر ستوري
```
[Schedule Trigger (كل ساعة)] → [Instagram: Story → Publish]
```

---

## المرحلة ٥: النشر حسب الجدول

| الوقت | المحتوى | الـ Workflow |
|-------|---------|-------------|
| 9:00 ص | ستوري 1 — استطلاع | Story publish |
| 9:05 ص | ستوري 2 — الحقيقة | Story publish |
| 10:00 ص | ستوري 3 — التقديم | Story publish |
| 12:00 ظ | ستوري 4 — كيف يشتغل | Story publish |
| 1:00 ظ | كاروسيل "ليش 28 ريال؟" | Carousel publish |
| 3:00 ع | ستوري 5 — العرض | Story publish |
| 6:00 م | ستوري 6 — الإهداء | Story publish |
| 9:00 م | ستوري 7 — الختام | Story publish |

---

## ملخص سريع

| الخطوة | المدة | الحالة |
|--------|-------|--------|
| تحويل حساب IG إلى Business | ٥ د | ⬜ |
| ربط بـ Facebook Page | ٢ د | ⬜ |
| إنشاء Facebook App | ٥ د | ⬜ |
| توليد Long-Lived Token | ٥ د | ⬜ |
| جلب IG User ID | ٢ د | ⬜ |
| Deploy الصور على Vercel | ٣ د | ⬜ |
| تثبيت نود Instagram في n8n | ٢ د | ⬜ |
| بناء Workflow | ١٠ د | ⬜ |
| **الإجمالي** | **~٣٥ دقيقة** | |

---

## الروابط المهمة
- Facebook Developers: https://developers.facebook.com/apps/
- Graph API Explorer: https://developers.facebook.com/tools/explorer/
- Instagram Graph API Docs: https://developers.facebook.com/docs/instagram-api/
- n8n Instagram Node: https://www.npmjs.com/package/@mookielianhd/n8n-nodes-instagram
