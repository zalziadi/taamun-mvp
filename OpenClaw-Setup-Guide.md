# دليل تثبيت OpenClaw + Claude — مُجرَّب ودقيق

> هذا الدليل مبني على تثبيت فعلي تم في 28 مارس 2026.
> الإصدار المُختَبَر: OpenClaw 2026.3.24

---

## ما هو OpenClaw؟

مساعد AI شخصي مفتوح المصدر يعمل على جهازك ويتصل بقنوات المراسلة (WhatsApp, Telegram, Slack, Discord, iMessage, وغيرها). يدعم Claude, GPT, Gemini, DeepSeek وغيرها.

---

## المتطلبات

- **Node.js 24** (موصى به) أو **Node 22.16+**
- **pnpm** (المشروع يستخدم pnpm وليس npm)
- **Git**
- **Anthropic API Key** من https://console.anthropic.com

---

## المرحلة 1: تجهيز البيئة (macOS)

```bash
# تحقق من Node
node -v
# المطلوب: v22.16+ أو v24+

# لو ما عندك Node أو تحتاج تحديث:
brew install node@24
# أو عبر nvm:
nvm install 24
nvm use 24

# تثبيت pnpm (الطريقة الرسمية)
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version

# تحقق من Git
git --version
# لو ما عندك: brew install git
```

---

## المرحلة 2: تثبيت OpenClaw

### الطريقة الموصى بها (تثبيت عالمي):

```bash
pnpm add -g openclaw@latest

# تحقق:
openclaw --version
# المتوقع: OpenClaw 2026.3.24 أو أحدث
```

### الطريقة البديلة (من المصدر، للمطورين فقط):

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
```

---

## المرحلة 3: الإعداد الأولي

### الطريقة الأسهل (Onboard التفاعلي):

```bash
openclaw onboard --install-daemon
```

هذا الأمر يرشدك خطوة بخطوة عبر:
- إعداد Gateway
- إعداد مساحة العمل (workspace)
- ربط القنوات (WhatsApp/Telegram/إلخ)
- تفعيل Skills

### الطريقة اليدوية:

```bash
# إعداد أولي
openclaw setup

# إعداد تفاعلي (credentials + channels + gateway)
openclaw configure
```

---

## المرحلة 4: ربط Claude

### الخيار أ: عبر ملف .env

أنشئ ملف `~/.openclaw/.env`:

```bash
mkdir -p ~/.openclaw
nano ~/.openclaw/.env
```

أضف:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

### الخيار ب: عبر openclaw.json

```bash
openclaw config set models.default.provider anthropic
openclaw config set models.default.model claude-sonnet-4-20250514
```

### الخيار ج: أثناء Onboard

أمر `openclaw onboard` يسألك عن API Keys تلقائياً.

---

## المرحلة 5: تشغيل Gateway

```bash
# تشغيل الـ Gateway (يبقى يعمل في الخلفية)
openclaw gateway --port 18789 --verbose

# أو كـ daemon (يشتغل تلقائياً مع النظام)
openclaw daemon install
openclaw daemon start
```

### التحقق:

```bash
openclaw health
openclaw doctor
openclaw status
```

---

## المرحلة 6: ربط القنوات

### Telegram:

```bash
# في .env أو openclaw.json:
TELEGRAM_BOT_TOKEN=123456:ABCDEF...

# أو عبر:
openclaw channels login telegram
```

### WhatsApp:

```bash
openclaw channels login whatsapp
# يظهر QR code — امسحه من تطبيق WhatsApp
```

### Discord:

```bash
# في .env:
DISCORD_BOT_TOKEN=...

# أو:
openclaw channels login discord
```

---

## المرحلة 7: استخدام Agent

```bash
# إرسال رسالة للـ agent مباشرة
openclaw agent --message "رتّب لي أفكاري لهذا المشروع" --thinking high

# إرسال رسالة عبر قناة
openclaw message send --to +966XXXXXXXXX --message "مرحباً"

# تشغيل الواجهة النصية التفاعلية
openclaw tui

# فتح لوحة التحكم
openclaw dashboard
```

---

## المرحلة 8: نظام Skills (المهارات)

### Skills هي ملفات SKILL.md داخل مجلد `skills/`

كل skill = ملف Markdown واحد بـ frontmatter YAML:

```markdown
---
name: my-skill
description: وصف المهارة
metadata:
  openclaw:
    emoji: "🧠"
---

# اسم المهارة

## When to use
(متى تُستخدم)

## Instructions
(التعليمات)
```

### عرض Skills المتاحة:

```bash
openclaw skills list
```

### Skills مدمجة (51 skill):

من أهمها: `coding-agent`, `summarize`, `notion`, `slack`, `discord`, `obsidian`, `github`, `trello`, `weather`, `voice-call`, `spotify-player`

### إنشاء Skill جديد:

أنشئ مجلد في `~/.openclaw/skills/my-skill/` وأضف `SKILL.md` بالصيغة أعلاه.

---

## المرحلة 9: بناء Agents مخصصة

### إدارة Agents:

```bash
openclaw agents --help
```

### Agents المعزولة (isolated workspaces):

OpenClaw يدعم agents معزولة لكل منها workspace + auth + routing خاص.

---

## المرحلة 10: أوامر مفيدة

```bash
openclaw doctor          # فحص صحة النظام
openclaw status          # حالة القنوات
openclaw sessions list   # الجلسات المحفوظة
openclaw update          # تحديث OpenClaw
openclaw cron --help     # جدولة مهام
openclaw plugins --help  # إدارة الإضافات
openclaw security --help # أدوات الأمان
```

---

## حل المشاكل الشائعة

### مشكلة: npm بدل pnpm

**OpenClaw يستخدم pnpm وليس npm.** لا تستخدم `npm install`.

### مشكلة: إصدار Node قديم

```bash
node -v
# لازم 22.16+ أو 24+
nvm install 24 && nvm use 24
```

### مشكلة: Gateway لا يستجيب

```bash
openclaw doctor
openclaw gateway --force  # يقتل أي عملية على نفس المنفذ ويعيد التشغيل
```

### مشكلة: API Key لا يعمل

```bash
# تأكد الملف موجود:
cat ~/.openclaw/.env
# تأكد المتغير صحيح:
# ANTHROPIC_API_KEY=sk-ant-...
```

### تنظيف كامل وإعادة بدء:

```bash
openclaw reset
openclaw onboard
```

---

## ملاحظات مهمة

1. **هذا ليس نظام ملفات JSON للـ agents** — الدليل القديم اللي يذكر `/agents/claude-agent.json` غير دقيق.
2. **Skills = ملفات SKILL.md** وليست ملفات JSON.
3. **الأمر الأساسي للبدء هو `openclaw onboard`** — يرشدك لكل شيء.
4. **Gateway هو قلب النظام** — كل شيء يمر عبره.
5. **الموقع الرسمي**: https://openclaw.ai
6. **التوثيق الكامل**: https://docs.openclaw.ai
