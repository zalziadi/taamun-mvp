# OpenClaw (شاهين) — نطاق العمل

> آخر تحديث: 2026-03-23

## الدور
شاهين هو الإيجنت المنفذ داخل Cursor/OpenClaw. يعمل تحت إشراف Cowork (Claude).

## ملفات السياق — اقرأها أولاً
1. **`.cursorrules`** — القانون الكامل (مطابق لـ CLAUDE.md)
2. **`memory/MEMORY.md`** — أنماط Supabase والمشاكل المتكررة
3. **`docs/PAYMENTS.md`** — توثيق بوابة الدفع (Tap)

## نطاق الوصول
محدد في `.cursorignore`. يشمل حالياً:

- **كل صفحات التطبيق** (`src/app/**`)
- **كل الـ APIs** (`src/app/api/**`)
- **كل المكوّنات** (`src/components/**`)
- **كل المنطق** (`src/lib/**`)
- **الهجرات** (`supabase/migrations/**`)
- **السكربتات** (`scripts/**`)
- **التوثيق** (`docs/**`)

## ممنوع الوصول
- `.env*` — الأسرار
- `.vercel/**` — إعدادات النشر
- `node_modules/**`
- أي ملف يحتوي credentials أو مفاتيح

## التنسيق مع الإيجنتات

| الإيجنت | الملف المرجعي | الدور |
|---------|---------------|-------|
| **Cowork (Claude)** | `CLAUDE.md` | مشرف — يراجع ويخطط |
| **شاهين (OpenClaw)** | `.cursorrules` | منفذ — يكتب الكود |

### قواعد التنسيق
1. **لا تعارض** — `.cursorrules` مطابق لـ `CLAUDE.md`. عند الشك، `CLAUDE.md` هو المرجع
2. **Git**: أنهِ الـ commit بسرعة — لا تترك `HEAD.lock` مفتوحاً
3. **tsc + build**: شغّلهم بعد كل تعديل
4. **لا تغيّر**: `.cursorrules` أو `CLAUDE.md` أو `memory/MEMORY.md` إلا بإذن من زياد

## البدء السريع
```
1. اقرأ .cursorrules
2. اقرأ memory/MEMORY.md
3. نفّذ المهمة المطلوبة
4. شغّل: npx tsc --noEmit && npm run build
5. commit بوصف واضح
```
