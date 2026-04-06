const TOTAL_DAYS = 28;

export interface ReflectionSummary {
  day: number;
  emotion: string | null;
  awareness_state: string | null;
  note_preview: string;
}

export interface CognitiveContext {
  recentReflections: ReflectionSummary[];
  awarenessLevel: "surface" | "growing" | "deep";
  dominantPattern: string | null;
  recurringThemes: string[];
  commitmentScore: number;
  contextSummary: string;
  suggestedQuestion: string;
  contextLevel: "light" | "deep";
}

const DEFAULT_CONTEXT: CognitiveContext = {
  recentReflections: [],
  awarenessLevel: "surface",
  dominantPattern: null,
  recurringThemes: [],
  commitmentScore: 0,
  contextSummary: "ابدأ رحلتك — كل يوم يحمل معنى جديد",
  suggestedQuestion: "ما أول شيء تلاحظه في نفسك اليوم؟",
  contextLevel: "light",
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

export async function buildCognitiveContext(
  supabase: any,
  userId: string,
  currentDay: number,
  missedCount = 0
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

  // 3. Dominant pattern
  const dominantPattern = recurringThemes.length > 0 ? recurringThemes[0] : null;

  // 4. Build summary and question
  const contextLevel = recentReflections.length >= 2 ? "deep" : "light";
  const contextSummary = buildContextSummary(recentReflections, recurringThemes, awarenessLevel);
  const suggestedQuestion = pickSuggestedQuestion(awarenessLevel, recurringThemes, missedCount);

  return {
    recentReflections,
    awarenessLevel,
    dominantPattern,
    recurringThemes,
    commitmentScore,
    contextSummary,
    suggestedQuestion,
    contextLevel,
  };
}
