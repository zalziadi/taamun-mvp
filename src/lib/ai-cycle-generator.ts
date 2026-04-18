/**
 * AI Cycle Generator — generates new 28-day cycle content using Claude.
 *
 * Uses the same pattern as other Anthropic calls in the project:
 * direct fetch to api.anthropic.com (no SDK dependency).
 *
 * Hybrid approach: shared pool (cached in DB) + per-user personalization
 * via the guide prompt.
 */

import type { DayContent } from "./taamun-content";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

/**
 * Theme options for cycle generation — each cycle has a distinct lens.
 */
export interface CycleTheme {
  cycle: number;
  name: string;
  description: string;
  focusAreas: string[];
  suggestedSurahs: string[];
}

export const CYCLE_THEMES: CycleTheme[] = [
  {
    cycle: 4,
    name: "الصبر والرضا",
    description: "رحلة عبر آيات الصبر والقبول والرضا بالقدر",
    focusAreas: ["الصبر", "التوكل", "الرضا", "القدر"],
    suggestedSurahs: ["العصر", "الضحى", "الشرح", "الطلاق", "إبراهيم"],
  },
  {
    cycle: 5,
    name: "الأخلاق والمعاملة",
    description: "آيات تبني علاقات صادقة مع الناس والنفس",
    focusAreas: ["الصدق", "الأمانة", "العدل", "الرحمة في المعاملة"],
    suggestedSurahs: ["الحجرات", "النور", "النساء", "المؤمنون", "الفرقان"],
  },
  {
    cycle: 6,
    name: "الوعي والحضور",
    description: "التمعّن العميق — الدخول للحظة الحاضرة عبر الآية",
    focusAreas: ["الذكر", "الخشوع", "الحضور", "اليقين"],
    suggestedSurahs: ["طه", "الأنفال", "الحديد", "ق", "الملك"],
  },
];

/**
 * Gets the theme for a given cycle. Cycles > 6 loop through 4-6.
 */
export function getThemeForCycle(cycle: number): CycleTheme {
  const normalizedCycle = 4 + ((cycle - 4) % CYCLE_THEMES.length);
  return CYCLE_THEMES.find((t) => t.cycle === normalizedCycle) ?? CYCLE_THEMES[0];
}

/**
 * Generates a single day of content for a given cycle + day + theme.
 * Returns null if AI generation fails (caller should fallback to modulo).
 */
export async function generateDayContent(params: {
  cycle: number;
  day: number;
  theme: CycleTheme;
}): Promise<DayContent | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const model = process.env.ANTHROPIC_CHAT_MODEL ?? "claude-sonnet-4-20250514";

  const { cycle, day, theme } = params;
  const weekNumber = Math.ceil(day / 7);
  const weekName = ["الأسبوع الأول", "الأسبوع الثاني", "الأسبوع الثالث", "الأسبوع الرابع"][weekNumber - 1];

  const systemPrompt = `أنت كاتب محتوى روحاني لتطبيق "تمعّن" — برنامج تأمل قرآني مدته ٢٨ يوماً.

مهمتك: كتابة محتوى يوم واحد من الدورة ${cycle} بموضوع "${theme.name}".

القيود الصارمة:
- الآية من القرآن الكريم فقط (لا تخترع آيات)
- verse_ref بصيغة "السورة: رقم الآية" (مثال: "البقرة: ٢٥٥")
- المحتوى عربية فصحى بسيطة — دافئ وغير متكلف
- لا تفسير أكاديمي — تجربة وجدانية
- silence_prompt: سؤال يوقف المتمعّن قبل القراءة (جملة واحدة)
- question: سؤال تأمل شخصي (ليس أكاديمي)
- exercise: تمرين عملي يومي يمكن إنجازه في ٥ دقائق
- hidden_layer: طبقة أعمق في المعنى — لفتة لغوية أو بلاغية
- book_quote: اقتباس حكمة مرتبط بالموضوع (من التراث الإسلامي أو فلسفي عام)
- book_chapter: عنوان الفصل — مرتبط بالموضوع

أجب بـ JSON فقط، بدون شرح خارج الـ JSON.`;

  const userPrompt = `اكتب محتوى اليوم ${day} من الدورة ${cycle}.

السياق:
- الدورة: ${theme.name} — ${theme.description}
- ${weekName} (اليوم ${day} من ٢٨)
- مجالات التركيز: ${theme.focusAreas.join("، ")}
- سور مقترحة: ${theme.suggestedSurahs.join("، ")}

اختر آية مناسبة للموضوع، وولّد بقية الحقول.

أرجع JSON بهذا الشكل بالضبط:
{
  "title": "...",
  "chapter": "...",
  "verse": "الآية القرآنية بالرسم العثماني",
  "verse_ref": "السورة: رقم الآية",
  "silence_prompt": "...",
  "question": "...",
  "exercise": "...",
  "hidden_layer": "...",
  "book_quote": "...",
  "book_chapter": "..."
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
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      console.error("[ai-cycle-generator] API error:", res.status);
      return null;
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === "text")?.text;
    if (!text) return null;

    // Extract JSON (may be wrapped in code fences)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as {
      title?: string;
      chapter?: string;
      verse?: string;
      verse_ref?: string;
      silence_prompt?: string;
      question?: string;
      exercise?: string;
      hidden_layer?: string;
      book_quote?: string;
      book_chapter?: string;
    };

    // Validate required fields
    if (!parsed.title || !parsed.verse || !parsed.verse_ref || !parsed.question) {
      return null;
    }

    return {
      day,
      title: parsed.title,
      chapter: parsed.chapter ?? theme.name,
      verse: parsed.verse,
      verseRef: parsed.verse_ref,
      silencePrompt: parsed.silence_prompt ?? "",
      question: parsed.question,
      exercise: parsed.exercise ?? "",
      hiddenLayer: parsed.hidden_layer ?? "",
      bookQuote: parsed.book_quote ?? "",
      bookChapter: parsed.book_chapter ?? theme.name,
    };
  } catch (err) {
    console.error("[ai-cycle-generator] exception:", err);
    return null;
  }
}
