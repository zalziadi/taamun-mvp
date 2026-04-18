/**
 * Soul Summary Generator
 *
 * Produces a cumulative narrative summary of a user's journey — their
 * recurring themes, emotional arc, and notable insights — stored in
 * guide_memory.soul_summary and injected into every guide conversation.
 *
 * Updated weekly (via cron) and at milestone days (14, 28, 60).
 *
 * Uses the existing Anthropic pattern in the project (direct fetch,
 * no SDK dependency).
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface ReflectionRow {
  day: number;
  note: string | null;
  emotion: string | null;
  awareness_state: string | null;
  created_at?: string;
}

interface AwarenessRow {
  day: number;
  level: string;
}

export interface SoulSummaryInput {
  userName: string | null;
  currentDay: number;
  completedDaysCount: number;
  reflections: ReflectionRow[];
  awareness: AwarenessRow[];
  existingSummary: string | null;
}

export interface SoulSummaryResult {
  summary: string;
  themes: string[];
  tokenCount?: number;
}

/**
 * Generates (or refreshes) a soul summary from the user's journey data.
 * Returns null if generation fails (caller keeps existing summary).
 */
export async function generateSoulSummary(
  input: SoulSummaryInput
): Promise<SoulSummaryResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  // Need at least 3 reflections to be worth summarizing
  if (input.reflections.length < 3) return null;

  const model =
    process.env.ANTHROPIC_CHAT_MODEL ?? "claude-sonnet-4-20250514";

  const reflectionsText = input.reflections
    .slice(0, 30) // cap at 30 most recent for prompt size
    .map((r) => {
      const emotion = r.emotion ? ` (${r.emotion})` : "";
      const state = r.awareness_state ? ` [${r.awareness_state}]` : "";
      const note = (r.note ?? "").slice(0, 300);
      return `يوم ${r.day}${emotion}${state}: ${note}`;
    })
    .join("\n");

  const awarenessPattern =
    input.awareness.length > 0
      ? input.awareness
          .slice(0, 14)
          .map((a) => `${a.day}:${a.level}`)
          .join(" · ")
      : "لا بيانات";

  const systemPrompt = `أنت مرشد "تمعّن" — تكتب ملخصاً تراكمياً لرحلة مشترك في برنامج تأمل قرآني.

مهمتك: قراءة تأملات المشترك واستخراج:
1. ملخص سرديّ قصير (3-5 جمل) يصف رحلته الداخلية حتى الآن
2. 3 إلى 5 "مواضيع متكررة" ظهرت في كتاباته

قواعد الأسلوب:
- عربية فصحى بسيطة، بدون تكلف
- ضمير الغائب ("يبدو أن المستخدم يعيش مرحلة...")
- لا تحكم — ارصد فقط
- لا تفترض — ما لم يذكره المستخدم لا تضيفه
- الملخص يتطور — لو كان هناك ملخص سابق، ادمج الجديد معه بذكاء

أجب بـ JSON فقط.`;

  const existingSection = input.existingSummary
    ? `\n\n## الملخص السابق (للمرجع فقط — حدّثه بناءً على الجديد):\n${input.existingSummary}`
    : "";

  const userPrompt = `المستخدم: ${input.userName ?? "—"}
اليوم الحالي: ${input.currentDay}/28 (أكمل ${input.completedDaysCount} يوماً)

## آخر تأملاته:
${reflectionsText}

## نمط الوعي (آخر أيام):
${awarenessPattern}${existingSection}

اكتب:
{
  "summary": "ملخص سردي 3-5 جمل عن رحلته الداخلية",
  "themes": ["موضوع 1", "موضوع 2", "موضوع 3"]
}`;

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      console.error("[soul-summary] API error:", res.status);
      return null;
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const text = data.content?.find((c) => c.type === "text")?.text;
    if (!text) return null;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as {
      summary?: string;
      themes?: string[];
    };

    if (!parsed.summary || !Array.isArray(parsed.themes)) return null;

    return {
      summary: parsed.summary.slice(0, 2000),
      themes: parsed.themes.slice(0, 5).map((t) => String(t).slice(0, 100)),
      tokenCount:
        (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    };
  } catch (err) {
    console.error("[soul-summary] exception:", err);
    return null;
  }
}

/**
 * True if this day is a milestone day (deeper refresh).
 */
export function isSoulMilestone(day: number): boolean {
  return day === 14 || day === 28 || day === 60;
}
