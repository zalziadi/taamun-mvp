# تحسين ذاتي للمحتوى v0.1 — خطة التنفيذ

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** توسيع المحلل الليلي ليكتشف الحي (1-9) وحالة الوعي، ويولّد سؤالاً مخصصاً وآية مرافقة، مع تغذية المرشد بالسياق.

**Architecture:** توسيع `pattern_insights` بـ 5 حقول جديدة → توسيع البرومبت في المحلل الليلي → مكوّنان جديدان (CompanionVerse + CustomQuestion) في DayExperience → تغذية `/api/guide` من pattern_insights.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase, Anthropic Claude API. لا مكتبات جديدة.

**Spec:** `docs/superpowers/specs/2026-04-01-content-self-improvement-v0.1-design.md`

---

## هيكل الملفات

| الملف | النوع | المسؤولية |
|-------|-------|-----------|
| `supabase/migrations/20260401_content_improvement.sql` | جديد | إضافة 5 حقول لـ pattern_insights |
| `src/app/api/cron/analyze-patterns/route.ts` | تعديل | توسيع البرومبت + النتيجة + الحفظ |
| `src/components/CompanionVerse.tsx` | جديد | بطاقة الآية المرافقة |
| `src/components/CustomQuestion.tsx` | جديد | بطاقة السؤال المخصص |
| `src/components/DayExperience.tsx` | تعديل | إضافة المكوّنين الجديدين |
| `src/app/api/guide/route.ts` | تعديل | تغذية سياق الأنماط |

---

### Task 1: توسيع جدول pattern_insights

**Files:**
- Create: `supabase/migrations/20260401_content_improvement.sql`

- [ ] **Step 1: إنشاء ملف الـ migration**

```sql
ALTER TABLE pattern_insights
  ADD COLUMN IF NOT EXISTS district INT CHECK (district BETWEEN 1 AND 9),
  ADD COLUMN IF NOT EXISTS awareness_state TEXT CHECK (awareness_state IN ('shadow', 'gift', 'potential')),
  ADD COLUMN IF NOT EXISTS custom_question TEXT,
  ADD COLUMN IF NOT EXISTS companion_verse TEXT,
  ADD COLUMN IF NOT EXISTS companion_verse_ref TEXT;
```

- [ ] **Step 2: تطبيق على Supabase**

نفس أسلوب النظام الأول: استخراج auth token من Chrome + Management API.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260401_content_improvement.sql
git commit -m "feat: add district, awareness_state, custom_question, companion_verse to pattern_insights"
```

---

### Task 2: توسيع المحلل الليلي

**Files:**
- Modify: `src/app/api/cron/analyze-patterns/route.ts`

- [ ] **Step 1: توسيع AIPatternResult type**

في السطر 10-17، يُضاف للـ type:

```typescript
type AIPatternResult = {
  themes: string[];
  depth_score: number;
  shift_detected: boolean;
  shift_description: string | null;
  daily_hint: string;
  weekly_summary: string | null;
  district: number | null;
  awareness_state: "shadow" | "gift" | "potential" | null;
  custom_question: string | null;
  companion_verse: string | null;
  companion_verse_ref: string | null;
};
```

- [ ] **Step 2: توسيع البرومبت**

في `buildPatternPrompt`، يُضاف لقسم الأحياء والتعليمات الإضافية قبل تعريف JSON output:

```
"",
"الأحياء التسعة (حدد أي حي يظهر في إجابات اليوم):",
"1=الهوية (من أنا) | 2=العلاقات (الآخر) | 3=التوسّع (التجربة) | 4=البناء (الالتزام)",
"5=الجمال (الرؤية) | 6=العائلة (المسؤولية) | 7=الروح (الصمت) | 8=المال (الملكية) | 9=العطاء (الإفاضة)",
"",
"حالات الوعي:",
"- shadow: يعيش من داخل أفكاره بدون أن يراها (لغة كيف)",
"- gift: لحظة يرى فيها نفسه (لحظة انتقال)",
"- potential: الوعي أصبح طبيعته (لغة عندي)",
```

وتعديل JSON output ليشمل:
```
`{"themes":[...],"depth_score":0,"shift_detected":false,"shift_description":null,"daily_hint":"...","district":1,"awareness_state":"shadow","custom_question":"سؤال شخصي لليوم التالي","companion_verse":"نص الآية القرآنية المناسبة","companion_verse_ref":"اسم السورة: رقم الآية"${weeklyExtra}}`
```

وتعليمات إضافية:
```
"district: رقم الحي (1-9) الأكثر ظهورًا في إجابات اليوم.",
"awareness_state: حالة الوعي الحالية (shadow/gift/potential).",
"custom_question: سؤال شخصي لليوم التالي مبني على الحي وحالة الوعي — يعكس لا يوجّه.",
"companion_verse: آية قرآنية مناسبة لحالة المستخدم (نص الآية فقط).",
"companion_verse_ref: مرجع الآية (اسم السورة: رقم الآية).",
```

- [ ] **Step 3: توسيع normalizeResult**

إضافة الحقول الجديدة في دالة `normalizeResult`:

```typescript
const rawDistrict = Number(parsed?.district);
const district = Number.isInteger(rawDistrict) && rawDistrict >= 1 && rawDistrict <= 9
  ? rawDistrict : null;
const awareness_state = ["shadow", "gift", "potential"].includes(String(parsed?.awareness_state))
  ? (String(parsed.awareness_state) as "shadow" | "gift" | "potential") : null;
const custom_question = typeof parsed?.custom_question === "string" && parsed.custom_question.trim()
  ? parsed.custom_question.trim() : null;
const companion_verse = typeof parsed?.companion_verse === "string" && parsed.companion_verse.trim()
  ? parsed.companion_verse.trim() : null;
const companion_verse_ref = typeof parsed?.companion_verse_ref === "string" && parsed.companion_verse_ref.trim()
  ? parsed.companion_verse_ref.trim() : null;
```

- [ ] **Step 4: توسيع insert في الـ handler**

إضافة الحقول الجديدة في الـ insert object (بعد `raw_ai_response`):

```typescript
district: result.district,
awareness_state: result.awareness_state,
custom_question: result.custom_question,
companion_verse: result.companion_verse,
companion_verse_ref: result.companion_verse_ref,
```

- [ ] **Step 5: التحقق**

```bash
cd /Users/ziyadalziyadi/taamun-next && npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/cron/analyze-patterns/route.ts
git commit -m "feat: expand analyzer to detect district, awareness state, custom question, companion verse"
```

---

### Task 3: مكوّن الآية المرافقة

**Files:**
- Create: `src/components/CompanionVerse.tsx`

- [ ] **Step 1: إنشاء المكوّن**

```typescript
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface CompanionVerseProps {
  cycleDay: number;
}

export function CompanionVerse({ cycleDay }: CompanionVerseProps) {
  const [verse, setVerse] = useState<{ text: string; ref: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (cycleDay <= 1) return;
    let cancelled = false;

    async function fetch() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || cancelled) return;

      const { data } = await supabase
        .from("pattern_insights")
        .select("companion_verse, companion_verse_ref")
        .eq("user_id", session.user.id)
        .eq("cycle_day", cycleDay - 1)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cancelled && data?.companion_verse) {
        setVerse({ text: data.companion_verse, ref: data.companion_verse_ref ?? "" });
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [cycleDay]);

  if (!verse || dismissed) return null;

  return (
    <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.03] p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs text-amber-400/50">آية لك</p>
          <p className="text-base leading-loose text-white/80">﴿ {verse.text} ﴾</p>
          {verse.ref && <p className="text-xs text-amber-400/40">{verse.ref}</p>}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-xs text-white/30 hover:text-white/50 transition-colors"
          aria-label="إخفاء الآية"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: التحقق + Commit**

```bash
npx tsc --noEmit
git add src/components/CompanionVerse.tsx
git commit -m "feat: add CompanionVerse component"
```

---

### Task 4: مكوّن السؤال المخصص

**Files:**
- Create: `src/components/CustomQuestion.tsx`

- [ ] **Step 1: إنشاء المكوّن**

```typescript
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface CustomQuestionProps {
  cycleDay: number;
}

export function CustomQuestion({ cycleDay }: CustomQuestionProps) {
  const [question, setQuestion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (cycleDay <= 1) return;
    let cancelled = false;

    async function fetch() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || cancelled) return;

      const { data } = await supabase
        .from("pattern_insights")
        .select("custom_question")
        .eq("user_id", session.user.id)
        .eq("cycle_day", cycleDay - 1)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cancelled && data?.custom_question) {
        setQuestion(data.custom_question);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [cycleDay]);

  if (!question || dismissed) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-white/40">◈</span>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-widest text-white/30">سؤال لك</p>
            <p className="text-sm leading-relaxed text-white/70">{question}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-xs text-white/30 hover:text-white/50 transition-colors"
          aria-label="إخفاء السؤال"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: التحقق + Commit**

```bash
npx tsc --noEmit
git add src/components/CustomQuestion.tsx
git commit -m "feat: add CustomQuestion component"
```

---

### Task 5: إضافة المكوّنات في DayExperience

**Files:**
- Modify: `src/components/DayExperience.tsx`

- [ ] **Step 1: إضافة imports**

بعد import DailyHint:
```typescript
import { CompanionVerse } from "./CompanionVerse";
import { CustomQuestion } from "./CustomQuestion";
```

- [ ] **Step 2: إضافة المكوّنات بعد VerseBlock**

بعد `{/* Verse */}` و `<VerseBlock .../>`:
```typescript
      {/* Companion Verse */}
      <CompanionVerse cycleDay={day} />

      {/* Custom Question */}
      <CustomQuestion cycleDay={day} />
```

- [ ] **Step 3: التحقق + Commit**

```bash
npx tsc --noEmit
git add src/components/DayExperience.tsx
git commit -m "feat: integrate CompanionVerse and CustomQuestion into DayExperience"
```

---

### Task 6: تغذية المرشد بسياق الأنماط

**Files:**
- Modify: `src/app/api/guide/route.ts`

- [ ] **Step 1: إضافة جلب pattern_insights**

بعد جلب الـ memory (سطر ~60)، يُضاف:

```typescript
    // ── Load pattern context ──
    let patternContext = "";
    const { data: latestPattern } = await supabase
      .from("pattern_insights")
      .select("district, awareness_state, themes, depth_score, shift_detected")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestPattern) {
      const districtNames: Record<number, string> = {
        1: "الهوية", 2: "العلاقات", 3: "التوسّع", 4: "البناء",
        5: "الجمال", 6: "العائلة", 7: "الروح", 8: "المال", 9: "العطاء",
      };
      const stateNames: Record<string, string> = {
        shadow: "الظل (بحث خارجي)", gift: "الهدية (لحظة إدراك)", potential: "أفضل احتمال (حضور)",
      };
      const parts: string[] = [];
      if (latestPattern.district) parts.push(`الحي: ${districtNames[latestPattern.district] ?? latestPattern.district}`);
      if (latestPattern.awareness_state) parts.push(`الحالة: ${stateNames[latestPattern.awareness_state] ?? latestPattern.awareness_state}`);
      if (latestPattern.themes?.length) parts.push(`المواضيع: ${(latestPattern.themes as string[]).join("، ")}`);
      if (latestPattern.depth_score != null) parts.push(`الحضور: ${latestPattern.depth_score}/100`);
      if (latestPattern.shift_detected) parts.push("تحوّل مُكتشف مؤخرًا");
      if (parts.length > 0) patternContext = `\nسياق المتمعّن: ${parts.join(" | ")}`;
    }
```

- [ ] **Step 2: إضافة السياق للرسائل**

تعديل رسالة الـ system context (سطر ~97):
```typescript
    {
      role: "system" as const,
      content: `النص الحالي: "${context.verse}"\nاليوم: ${context.day}/28${patternContext}`,
    },
```

- [ ] **Step 3: التحقق + Commit**

```bash
npx tsc --noEmit
git add src/app/api/guide/route.ts
git commit -m "feat: feed pattern insights context into AI guide"
```

---

### Task 7: البناء الكامل والنشر

- [ ] **Step 1: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 2: Full build**

```bash
npm run build
```

- [ ] **Step 3: تطبيق SQL على Supabase**

استخدام نفس أسلوب النظام الأول (Chrome auth token + Management API).

- [ ] **Step 4: Push**

```bash
git push origin main
```
