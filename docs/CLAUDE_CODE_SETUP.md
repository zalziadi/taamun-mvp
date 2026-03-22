# ربط المشروع بـ Claude Code

**Claude Code** هو وضع عمل Claude داخل الطرفية/المحرّر مع قراءة سياق المشروع تلقائيًا (وملف `CLAUDE.md` عند وجوده).

## 1) المتطلبات

- حساب **Claude** (Anthropic).
- تثبيت **Claude Code** من الصفحة الرسمية: [claude.ai/code](https://claude.ai/code) — اتبع تعليمات التثبيت لـ macOS.
- المشروع محليًا أو عبر استنساخ Git.

## 2) المستودع (GitHub)

```bash
git clone git@github.com:zalziadi/taamun-mvp.git
cd taamun-mvp
```

إذا كان المشروع عندك بالفعل، انتقل لمجلده:

```bash
cd "/path/to/taamun-mvp"
```

## 3) تشغيل Claude Code

من جذر المشروع:

```bash
claude
```

أو حسب ما يظهر لك بعد التثبيت (قد يكون الاسم أو الأمر مختلفًا قليلًا حسب الإصدار).

> Claude Code يقرأ **`CLAUDE.md`** في جذر المشروع كـ «قانون»/سياق — لا تحذفه.

## 4) ملفات السياق المفيدة في هذا المشروع

| الملف | الغرض |
|--------|--------|
| `CLAUDE.md` | قواعد المشروع والتحقق من البناء |
| `README.md` | بيئة Supabase والهجرات |
| `docs/PAYMENTS.md` | Stripe و Tap والمتغيرات |
| `.env.local` | أسرار محلية (لا تُرفع لـ Git) |

## 5) ربط العمل مع Vercel

- بعد التعديلات: `git push origin main` ليُعاد نشر **Vercel** تلقائيًا إن كان المشروع مربوطًا.
- المتغيرات الحساسة تُضاف في **Vercel → Project → Settings → Environment Variables** وليس في الدردشة.

## 6) Cursor + Claude Code

- يمكن فتح **نفس المجلد** في Cursor واستخدام Claude Code من الطرفية المدمجة.
- لا حاجة لملف إضافي لـ Cursor إن كان `CLAUDE.md` موجودًا.

---

**ملخص:** ثبّت Claude Code → `cd taamun-mvp` → `claude` — المشروع مربوط بالسياق عبر `CLAUDE.md` والمستودع على GitHub.
