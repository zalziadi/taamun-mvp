# OpenClaw <-> Claude Code — بروتوكول التزامن

> آخر تحديث: 2026-03-31

## الدور
سمرا هي الجسر التقني بين OpenClaw و Claude Code.
المهام البسيطة تنفذها سمرا مباشرة، والمعقدة تصعّدها لـ Claude Code.

## ملفات السياق — اقرأها أولاً
1. **`CLAUDE.md`** — القانون الكامل
2. **`memory/MEMORY.md`** — أنماط Supabase والمشاكل المتكررة
3. **`docs/PAYMENTS.md`** — توثيق بوابة الدفع (Tap)

## البنية

```
Claude Code (CLI)                    OpenClaw (gateway :18789)
  |                                    |
  | -- to-openclaw/ -->                | برهان يقرأ ويوزّع
  |                                    | على: وردة، ذئب، سمرا،
  |                                    | مسخّر، المستشار، شاهين
  |                                    |
  | <-- to-claude-code/ --             | سمرا تكتب هنا
  |                                    | لو المهمة أكبر منها
  |                                    |
  | -- done/ -->                       |
```

## الأعضاء

| العضو | المنصة | الدور |
|-------|--------|------|
| Claude Code | CLI/Desktop | كود، بناء، نشر، معمارية |
| سمرا | OpenClaw | جسر الكود + دعم فني — تنفذ البسيط وتصعّد المعقد |
| برهان | OpenClaw | مدير الفريق — يوزّع المهام وينسق |
| CJ | OpenClaw | تنفيذ تقني — يشتغل تحت شام/برهان |
| وردة | OpenClaw | خدمة عملاء ومبيعات (واتساب الافتراضي) |
| ذئب الشمال | OpenClaw | تسويق ونمو |
| مسخّر | OpenClaw | أسئلة عامة وترحيب |
| المستشار | OpenClaw | مستشار استراتيجي (رسائل زياد المباشرة) |
| شاهين | OpenClaw | قانون ومالية |
| ads-agent | OpenClaw | حملات إعلانية |
| شام | OpenClaw | ربط تقني وإداري |

## طابور التسليم

الموقع: `~/.openclaw/delivery-queue/`

```
delivery-queue/
  to-claude-code/    # سمرا/برهان يكتبون هنا لما يحتاجون كود
  to-openclaw/       # Claude Code يكتب هنا لما يحتاج شي غير كود
  done/              # المهام المنتهية
  PROTOCOL.md        # التوثيق الكامل
```

## نطاق الوصول

**مسموح:**
- `src/app/**` — صفحات و APIs
- `src/components/**` — مكوّنات
- `src/lib/**` — منطق
- `supabase/migrations/**` — قاعدة بيانات
- `scripts/**` — أتمتة
- `docs/**` — توثيق

**ممنوع:**
- `.env*` — أسرار
- `.vercel/**` — إعدادات نشر
- `node_modules/**`

## قواعد التنسيق
1. `CLAUDE.md` هو المرجع الأعلى — لا تعارض
2. بعد كل تعديل: `npx tsc --noEmit && npm run build`
3. لا تترك `HEAD.lock` مفتوح
4. لا تغيّر `CLAUDE.md` أو `memory/MEMORY.md` إلا بإذن زياد
5. المهام تمر عبر برهان — هو يتابع كل شيء

## البدء السريع
```
1. اقرأ CLAUDE.md
2. اقرأ memory/MEMORY.md
3. تحقق من delivery-queue/ للمهام المعلقة
4. نفّذ المهمة
5. شغّل: npx tsc --noEmit && npm run build
6. اكتب النتيجة في delivery-queue/done/
7. بلّغ برهان
```
