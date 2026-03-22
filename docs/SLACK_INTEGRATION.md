# ربط تمَعّن مع Slack

## عن الرابط الذي أرسلته

`https://app.slack.com/client/T0AMP70FQQP?...` يفتح **واجهة Slack** في المتصفح. **معرّف الفريق (Team ID)** الظاهر في الرابط هو تقريبًا: **`T0AMP70FQQP`**.

> إذا ظهرت رسالة «Please change browsers» على Slack في المتصفح، استخدم متصفحًا مدعومًا أو **تطبيق Slack** — الربط البرمجي من الخادم لا يعتمد على المتصفح.

## الربط البرمجي (الخادم → قناة Slack)

1. [Slack API — Your Apps](https://api.slack.com/apps) → Create App → نفس الـ workspace.
2. **Incoming Webhooks** → Add to Workspace → اختر القناة.
3. انسخ **Webhook URL** → ضعه في **`SLACK_WEBHOOK_URL`** في Vercel و `.env.local`.

## الكود في المشروع

- `src/lib/slack.ts` — `sendSlackMessage({ text })`
- `POST /api/slack/test` — اختبار (للمسؤولين فقط، يحتاج `requireAdmin`)

## مراجع

- [Incoming Webhooks](https://api.slack.com/messaging/webhooks)
