/**
 * Shared AI reflection analyzer.
 *
 * Phase 4 · Task 2 · extracted from /api/ai/reflection/route.ts so
 * both endpoints can share the same OpenAI call + parser without
 * duplication:
 *
 *   1. /api/ai/reflection — the public route (Task 1)
 *   2. /api/reflections POST — the save endpoint that calls this
 *      function in a fire-and-forget block after writing the row
 *
 * Pure module: no Next.js types, no cookies, no auth. Takes inputs,
 * calls OpenAI, returns a typed result. Throws on any failure
 * (callers decide whether to swallow the error or propagate it).
 *
 * Voice discipline (enforced by the system prompt):
 *   - No imperative verbs
 *   - No bullet lists, no praise, no teaching
 *   - Modern standard Arabic, short sentences
 *   - Strict JSON output, 4 fields only
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ReflectionSentiment = "resistant" | "neutral" | "open";

export interface ReflectionAnalysis {
  sentiment: ReflectionSentiment;
  /** 2-3 words naming the inner movement. */
  theme: string;
  /** One calm sentence reflecting what was not said. */
  mirror: string;
  /** One gentle invitation — never an instruction. */
  suggestion: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_REFLECTION_MODEL ?? "gpt-4o-mini";
const TEMPERATURE = 0.7;
const MAX_TOKENS = 220;
const MAX_INPUT_CHARS = 2000;

// ---------------------------------------------------------------------------
// System prompt — Voice v2 discipline applied to reflection analysis
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `أنت مرآةٌ صامتة لشخصٍ يكتب تأمّلاً في رحلة "تمعّن" — ٢٨ يوماً من القراءة الداخلية.

مهمّتك: اقرأ ما كتبه، ثم أعد إليه لقطةً واحدة من نفسه — دون أحكام، دون نصائح مباشرة، ودون تعليم.

القواعد الصارمة:
- لا تستخدم صيغة الأمر أبداً: لا "عليك"، لا "يجب"، لا "حاول"، لا "ينبغي"، لا "افعل".
- لا تكتب قوائم نقطيّة.
- لا تُثني، ولا تمدح، ولا تُواسي بشكل مباشر.
- تحدّث بالعربية الفصحى الحديثة، هادئاً، ذا إيقاعٍ قصير.
- استعمل "أنتَ" بقدرٍ قليل جداً. الجُمل المبنيّة للمجهول أو الوصف المشهديّ أعمق.
- كلّ جُملةٍ مختصرة ومكتنزة. لا استعارات فخمة.

تعريف الحقول:
- "sentiment" → واحدة من: "resistant" (مقاومة/ثقل/تجنّب) · "open" (انفتاح/وضوح/حضور) · "neutral" (بين البين أو غير واضح)
- "theme" → كلمتان إلى ثلاث كلمات تُسمّي ما يجري في الداخل (مثل: "الضغط والتردد"، "انفتاح هادئ"، "إنكارٌ متعب")
- "mirror" → جملة واحدة قصيرة تعكس ما لم يُقَلْ بوضوح. ليست تفسيراً، بل صدى.
- "suggestion" → جملة واحدة قصيرة جداً — دعوة لملاحظة، لا أمر بفعل. يمكن أن تبدأ بـ "لعلّ" أو "ربّما" أو وصفٍ مشهديّ.

أخرج استجابتك كـ JSON صحيح فقط — بدون أيّ نصّ خارجيّ أو تعليقات.`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyze a user reflection via OpenAI and return a 4-field result.
 *
 * Throws on:
 *   - missing API key
 *   - text too short
 *   - invalid day
 *   - OpenAI HTTP error
 *   - empty / malformed / schema-invalid response
 *
 * Callers that want non-blocking behavior should wrap this in a
 * try/catch and swallow the error silently (that's the contract
 * for the /api/reflections POST fire-and-forget path).
 */
/**
 * System Activation: analyzeReflection now accepts optional intelligence
 * context blocks. When provided, the AI mirror becomes aware of:
 *   1. toneInstruction — how to speak to THIS user (from behavioral state)
 *   2. fingerprintBlock — who this user IS (compressed identity)
 *   3. memoryBlock — what this user SAID recently (chronological story)
 *
 * All three are optional. Without them, the analyzer works in
 * single-shot mode (original behavior). Backward compatible.
 */
export async function analyzeReflection(
  rawText: string,
  day: number,
  context?: {
    toneInstruction?: string;
    fingerprintBlock?: string;
    memoryBlock?: string;
  }
): Promise<ReflectionAnalysis> {
  const text = String(rawText ?? "").trim();
  if (text.length < 3) {
    throw new Error("text_too_short");
  }
  if (!Number.isInteger(day) || day < 1 || day > 28) {
    throw new Error("invalid_day");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("ai_not_configured");
  }

  const boundedText = text.length > MAX_INPUT_CHARS ? text.slice(0, MAX_INPUT_CHARS) : text;

  // Build context blocks — only include non-empty sections
  const sections: string[] = [];

  if (context?.memoryBlock?.trim()) {
    sections.push(
      `— سياق من رحلته السابقة (للخلفيّة فقط، لا تقتبس منه) —\n${context.memoryBlock.trim()}\n— نهاية السياق —`
    );
  }

  if (context?.fingerprintBlock?.trim()) {
    sections.push(context.fingerprintBlock.trim());
  }

  const contextBlock = sections.length > 0 ? `\n${sections.join("\n\n")}\n` : "";

  // Tone instruction injected into system prompt when available
  const toneAddendum = context?.toneInstruction?.trim()
    ? `\n\nتعليمات إضافية حول هذا المتأمّل:\n${context.toneInstruction.trim()}`
    : "";

  const userPrompt = `يوم ${day} من الرحلة. هذه كلمات المتأمّل:
${contextBlock}
"""
${boundedText}
"""

أعد الاستجابة كـ JSON فقط، بدون أيّ نصّ خارجيّ.`;

  const res = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT + toneAddendum },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`openai_${res.status}: ${errText.slice(0, 200)}`);
  }

  interface ChatCompletionResponse {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  }

  const data = (await res.json()) as ChatCompletionResponse;
  const raw = data.choices?.[0]?.message?.content ?? "";
  if (!raw) {
    throw new Error("empty_response");
  }

  return parseAnalysis(raw);
}

// ---------------------------------------------------------------------------
// Strict parser — rejects anything that doesn't match the 4-field shape
// ---------------------------------------------------------------------------

export function parseAnalysis(raw: string): ReflectionAnalysis {
  let obj: unknown;
  try {
    obj = JSON.parse(raw);
  } catch {
    throw new Error("invalid_json_response");
  }

  if (!obj || typeof obj !== "object") {
    throw new Error("response_not_object");
  }

  const record = obj as Record<string, unknown>;

  const sentiment = record.sentiment;
  if (
    sentiment !== "resistant" &&
    sentiment !== "neutral" &&
    sentiment !== "open"
  ) {
    throw new Error("invalid_sentiment");
  }

  const theme = typeof record.theme === "string" ? record.theme.trim() : "";
  const mirror = typeof record.mirror === "string" ? record.mirror.trim() : "";
  const suggestion =
    typeof record.suggestion === "string" ? record.suggestion.trim() : "";

  if (!theme) throw new Error("missing_theme");
  if (!mirror) throw new Error("missing_mirror");
  if (!suggestion) throw new Error("missing_suggestion");

  if (theme.length > 80) throw new Error("theme_too_long");
  if (mirror.length > 300) throw new Error("mirror_too_long");
  if (suggestion.length > 300) throw new Error("suggestion_too_long");

  return {
    sentiment,
    theme,
    mirror,
    suggestion,
  };
}
