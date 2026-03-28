# دليل إعداد إيجنتات تمعّن على السوشل ميديا

نظام الإيجنتات الذكي يربط وردة ومسخر وسمرا على تويتر وإنستقرام تلقائياً.

---

## 1. متغيرات البيئة المطلوبة

أضف هذه المتغيرات في Vercel (Settings → Environment Variables):

```env
# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Twitter/X
TWITTER_BEARER_TOKEN=...
TWITTER_CONSUMER_SECRET=...

# Instagram (عبر Meta/Facebook)
INSTAGRAM_PAGE_TOKEN=...
INSTAGRAM_PAGE_ID=...
INSTAGRAM_VERIFY_TOKEN=taamun_verify_2024    # اختر أي نص سري
```

---

## 2. الحصول على Twitter API Keys

### الخطوات:

1. **سجّل في Twitter Developer Portal**
   - ادخل https://developer.twitter.com/en/portal/dashboard
   - سجّل بحساب تويتر الرسمي لتمعّن

2. **أنشئ Project + App**
   - اضغط "Create Project"
   - الاسم: `Taamun Agents`
   - الوصف: `Auto-reply agents for Taamun campaign`
   - اختر "Making a bot" كـ Use Case

3. **فعّل OAuth 1.0a**
   - في إعدادات App: User authentication settings → Edit
   - فعّل Read and Write و Direct Messages
   - Callback URL: `https://www.taamun.com/api/webhooks/twitter`
   - Website URL: `https://www.taamun.com`

4. **احصل على المفاتيح**
   - من Keys and Tokens → Bearer Token → انسخه → `TWITTER_BEARER_TOKEN`
   - من Consumer Keys → API Key Secret → انسخه → `TWITTER_CONSUMER_SECRET`

5. **فعّل Account Activity API**
   - هذا يحتاج Premium أو Enterprise access
   - قدّم طلب من: https://developer.twitter.com/en/account/environments
   - بعد القبول، سجّل webhook:
   ```bash
   curl -X POST \
     "https://api.twitter.com/1.1/account_activity/all/production/webhooks.json?url=https://www.taamun.com/api/webhooks/twitter" \
     -H "Authorization: Bearer YOUR_BEARER_TOKEN"
   ```

### ملاحظة مهمة:
Twitter Account Activity API يحتاج طلب Premium access. البديل: استخدم Twitter API v2 مع polling بدل webhooks (أبسط لكن أبطأ).

---

## 3. الحصول على Instagram Graph API

### الخطوات:

1. **حوّل حساب إنستقرام لـ Business/Creator**
   - Settings → Account → Switch to Professional Account
   - اربطه بصفحة فيسبوك

2. **سجّل في Meta Developer Portal**
   - ادخل https://developers.facebook.com
   - أنشئ App جديد
   - النوع: Business
   - الاسم: `Taamun Agents`

3. **أضف Instagram Messaging**
   - في لوحة التحكم: Add Products → Instagram → Set Up
   - اطلب الصلاحيات:
     - `instagram_manage_messages`
     - `instagram_basic`
     - `pages_messaging`

4. **احصل على Page Access Token**
   - Graph API Explorer: https://developers.facebook.com/tools/explorer/
   - اختر App → اختر الصفحة → Generate Token
   - انسخ الـ Token → `INSTAGRAM_PAGE_TOKEN`
   - انسخ Page ID → `INSTAGRAM_PAGE_ID`

5. **سجّل Webhook**
   - في App Dashboard: Products → Webhooks → Subscribe
   - Callback URL: `https://www.taamun.com/api/webhooks/instagram`
   - Verify Token: نفس القيمة في `INSTAGRAM_VERIFY_TOKEN`
   - اشترك في: `messages` و `messaging_postbacks`

6. **قدّم للمراجعة**
   - Meta يحتاج مراجعة قبل الإنتاج
   - اكتب وصف واضح لاستخدام الـ messaging
   - عادة يأخذ 2-5 أيام عمل

---

## 4. كيف يشتغل النظام

```
رسالة DM ← Twitter/Instagram
    ↓
Webhook Endpoint (/api/webhooks/twitter أو /api/webhooks/instagram)
    ↓
Smart Router (يحلل الرسالة بالكلمات المفتاحية)
    ↓
يختار الإيجنت المناسب:
  • مسخر → أسئلة عامة عن تمعّن
  • وردة → شراء، تفعيل، باقات، خدمة عملاء
  • سمرا → مشاكل تقنية، الموقع، أخطاء
    ↓
Claude API (يولّد رد بشخصية الإيجنت)
    ↓
يرسل الرد تلقائياً ← DM للعميل
```

### نظام التحويل بين الإيجنتات:
إذا الإيجنت قرر إن الموضوع مو تخصصه، يحوّل تلقائياً:
- وردة ← سمرا (مشاكل تقنية)
- وردة ← مسخر (أسئلة عامة)
- مسخر ← وردة (شراء/تفعيل)
- مسخر ← سمرا (مشاكل تقنية)
- سمرا ← وردة (شراء/باقات)
- سمرا ← مسخر (أسئلة عامة)

---

## 5. الملفات المُنشأة

```
src/lib/agents/
  ├── types.ts       # أنواع TypeScript
  ├── prompts.ts     # برومبتات الإيجنتات الثلاثة
  ├── router.ts      # التوجيه الذكي للرسائل
  ├── claude.ts      # تكامل Claude API
  ├── twitter.ts     # تكامل Twitter API
  ├── instagram.ts   # تكامل Instagram Graph API
  └── index.ts       # التصدير العام

src/app/api/webhooks/
  ├── twitter/route.ts     # Webhook تويتر
  └── instagram/route.ts   # Webhook إنستقرام
```

---

## 6. الاختبار

بعد إعداد المتغيرات ونشر المشروع:

1. **اختبر Twitter CRC:**
   ```
   GET https://www.taamun.com/api/webhooks/twitter?crc_token=test123
   ```

2. **اختبر Instagram Verification:**
   ```
   GET https://www.taamun.com/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test
   ```

3. **أرسل DM تجريبي** من حساب ثاني وتأكد إن الرد يوصل.

---

## 7. التكلفة التقريبية

- **Claude API:** ~$0.003 لكل رسالة (Sonnet)
- **Twitter API:** Free tier يدعم DMs (مع قيود)
- **Instagram API:** مجاني
- **المجموع:** أقل من $10/شهر لـ 3,000 رسالة
