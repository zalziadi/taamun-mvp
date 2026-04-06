import type { Narrative } from "./narrativeEngine";

const TOTAL_DAYS = 28;

export interface ReflectionSummary {
  day: number;
  emotion: string | null;
  awareness_state: string | null;
  note_preview: string;
}

export interface WeightedTheme {
  theme: string;
  weight: number;
}

export interface CognitiveContext {
  recentReflections: ReflectionSummary[];
  awarenessLevel: "surface" | "growing" | "deep";
  dominantPattern: string | null;
  recurringThemes: string[];
  weightedThemes: WeightedTheme[];
  commitmentScore: number;
  contextSummary: string;
  contextInterpretation: string;
  suggestedQuestion: string;
  contextLevel: "light" | "deep";
  narrative: Narrative | null;
}

const DEFAULT_CONTEXT: CognitiveContext = {
  recentReflections: [],
  awarenessLevel: "surface",
  dominantPattern: null,
  recurringThemes: [],
  weightedThemes: [],
  commitmentScore: 0,
  contextSummary: "ابدأ رحلتك — كل يوم يحمل معنى جديد",
  contextInterpretation: "بداية رحلة جديدة — لا توجد بيانات سابقة بعد",
  suggestedQuestion: "ما أول شيء تلاحظه في نفسك اليوم؟",
  contextLevel: "light",
  narrative: null,
};

function pickSuggestedQuestion(
  awarenessLevel: string,
  themes: string[],
  missedCount: number
): string {
  if (missedCount > 3) return "ما الذي جعلك تتوقف؟ — لا حكم، فقط ملاحظة";
  if (themes.length > 0) return `لاحظت نمط "${themes[0]}" يتكرر — ما الذي يريد أن يقوله لك؟`;
  if (awarenessLevel === "deep") return "ما أعمق حقيقة وصلت لها اليوم؟";
  if (awarenessLevel === "growing") return "ما الذي بدأت تراه بوضوح أكثر؟";
  return "ما أول شيء تلاحظه في نفسك اليوم؟";
}

function buildContextSummary(
  reflections: ReflectionSummary[],
  themes: string[],
  awarenessLevel: string
): string {
  if (reflections.length === 0) return DEFAULT_CONTEXT.contextSummary;

  const last = reflections[0];
  const emotionPart = last.emotion ? `شعرت بـ "${last.emotion}"` : "تأملت";
  const dayPart = `في يوم ${last.day}`;

  if (themes.length > 0) {
    return `${dayPart}، ${emotionPart}. نمط "${themes[0]}" يظهر في رحلتك`;
  }
  return `${dayPart}، ${emotionPart}. اليوم نبني على ذلك`;
}

function buildInterpretation(
  awarenessLevel: string,
  themes: string[],
  reflectionCount: number,
  missedCount: number
): string {
  if (reflectionCount === 0) return "بداية رحلة جديدة — لا توجد بيانات سابقة بعد";
  if (missedCount > 5) return `${missedCount} أيام فائتة — النظام يلاحظ نمط توقف. ممكن الرحلة تحتاج إعادة ضبط`;
  if (themes.length >= 3) return `ثلاثة أنماط واضحة: ${themes.slice(0, 3).join("، ")}. الرحلة تبني صورة متكاملة`;
  if (awarenessLevel === "deep") return "مستوى الوعي عميق — التأملات تعكس نضج داخلي";
  if (awarenessLevel === "growing") return "الوعي ينمو — الأنماط بدأت تتضح";
  return "مرحلة مبكرة — كل تأمل يضيف بيانات للنظام";
}

export async function buildCognitiveContext(
  supabase: any,
  userId: string,
  currentDay: number,
  missedCount = 0,
  narrativeInput?: { completedCount: number; drift: number } | null
): Promise<CognitiveContext> {
  // 1. Recent reflections (last 3)
  const { data: reflections } = await supabase
    .from("reflections")
    .select("day, emotion, awareness_state, note")
    .eq("user_id", userId)
    .order("day", { ascending: false })
    .limit(3);

  const recentReflections: ReflectionSummary[] = (reflections ?? []).map(
    (r: any) => ({
      day: r.day,
      emotion: r.emotion,
      awareness_state: r.awareness_state,
      note_preview: String(r.note ?? "").slice(0, 100),
    })
  );

  // 2. User memory
  const { data: memory } = await supabase
    .from("user_memory")
    .select("patterns, awareness_level, commitment_score")
    .eq("user_id", userId)
    .maybeSingle();

  const awarenessLevel = (memory?.awareness_level ?? "surface") as CognitiveContext["awarenessLevel"];
  const recurringThemes: string[] = memory?.patterns ?? [];
  const commitmentScore: number = memory?.commitment_score ?? 0;

  // 3. Dominant pattern + weighted themes
  const dominantPattern = recurringThemes.length > 0 ? recurringThemes[0] : null;
  const weightedThemes: WeightedTheme[] = recurringThemes.map((theme, i) => ({
    theme,
    weight: Math.max(1, 10 - i * 2), // decreasing weight by position
  }));

  // 4. Build summary, question, interpretation
  const contextLevel = recentReflections.length >= 2 ? "deep" : "light";
  const contextSummary = buildContextSummary(recentReflections, recurringThemes, awarenessLevel);
  const suggestedQuestion = pickSuggestedQuestion(awarenessLevel, recurringThemes, missedCount);
  const contextInterpretation = buildInterpretation(awarenessLevel, recurringThemes, recentReflections.length, missedCount);

  // 5. Generate narrative if enough data
  let narrative: Narrative | null = null;
  if (recentReflections.length > 0 && narrativeInput) {
    try {
      const { generateNarrative } = await import("./narrativeEngine");
      const { extractPatterns } = await import("./reflectionLinker");
      // Build patterns from recent reflections for narrative
      const rows = recentReflections.map((r) => ({
        day: r.day,
        note: r.note_preview,
        emotion: r.emotion,
        awareness_state: r.awareness_state,
      }));
      const patterns = extractPatterns(rows);
      const arc = recentReflections.length >= 2 ? "emerging" : "emerging";
      narrative = generateNarrative(
        patterns,
        arc as any,
        currentDay,
        narrativeInput.completedCount,
        narrativeInput.drift
      );
    } catch {
      // Narrative generation is optional
    }
  }

  return {
    recentReflections,
    awarenessLevel,
    dominantPattern,
    recurringThemes,
    weightedThemes,
    commitmentScore,
    contextSummary,
    contextInterpretation,
    suggestedQuestion,
    contextLevel,
    narrative,
  };
}
