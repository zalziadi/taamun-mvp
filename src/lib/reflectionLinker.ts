export interface Pattern {
  keyword: string;
  weight: number;
  firstSeenDay: number;
  recurrence: number;
  type: "emotional" | "behavioral" | "cognitive";
}

export type EmotionalArc = "deepening" | "shifting" | "repeating" | "emerging";

export interface LinkedReflection {
  insight: string;
  connectedDays: number[];
  emotionalArc: EmotionalArc;
  patterns: Pattern[];
}

interface ReflectionRow {
  day: number;
  note: string | null;
  emotion: string | null;
  awareness_state: string | null;
}

// Common Arabic contemplative keywords grouped by type
const KEYWORD_GROUPS: Record<Pattern["type"], string[]> = {
  emotional: ["خوف", "قلق", "فرح", "حزن", "غضب", "سلام", "حب", "وحدة", "أمان", "ألم"],
  behavioral: ["تردد", "تأجيل", "مقاومة", "انسحاب", "إقدام", "التزام", "تكرار", "توقف"],
  cognitive: ["معنى", "وعي", "إدراك", "حقيقة", "وهم", "نمط", "سؤال", "يقين", "شك"],
};

function extractPatterns(reflections: ReflectionRow[]): Pattern[] {
  const patternMap = new Map<string, Pattern>();

  for (const ref of reflections) {
    const text = `${ref.note ?? ""} ${ref.emotion ?? ""}`.toLowerCase();

    for (const [type, keywords] of Object.entries(KEYWORD_GROUPS)) {
      for (const kw of keywords) {
        if (text.includes(kw)) {
          const existing = patternMap.get(kw);
          if (existing) {
            existing.recurrence++;
            existing.weight = Math.min(10, existing.weight + 1);
          } else {
            patternMap.set(kw, {
              keyword: kw,
              weight: 1,
              firstSeenDay: ref.day,
              recurrence: 1,
              type: type as Pattern["type"],
            });
          }
        }
      }
    }
  }

  return Array.from(patternMap.values())
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10);
}

function detectEmotionalArc(reflections: ReflectionRow[]): EmotionalArc {
  if (reflections.length < 2) return "emerging";

  const states = reflections.map((r) => r.awareness_state).filter(Boolean);
  const emotions = reflections.map((r) => r.emotion).filter(Boolean);

  const uniqueStates = new Set(states);
  const uniqueEmotions = new Set(emotions);

  if (uniqueStates.size === 1 && uniqueEmotions.size === 1) return "repeating";
  if (states.length >= 2 && states[0] === "best_possibility") return "deepening";
  if (uniqueEmotions.size >= 3) return "shifting";
  return "emerging";
}

function findConnectedDays(
  currentDay: number,
  reflections: ReflectionRow[],
  patterns: Pattern[]
): number[] {
  if (patterns.length === 0) return [];

  const topKeywords = patterns.slice(0, 3).map((p) => p.keyword);
  const connected: number[] = [];

  for (const ref of reflections) {
    if (ref.day === currentDay) continue;
    const text = `${ref.note ?? ""} ${ref.emotion ?? ""}`.toLowerCase();
    if (topKeywords.some((kw) => text.includes(kw))) {
      connected.push(ref.day);
    }
  }

  return connected.slice(0, 5);
}

function generateInsight(
  patterns: Pattern[],
  arc: EmotionalArc,
  connectedDays: number[]
): string {
  if (patterns.length === 0) return "كل تأمل يضيف طبقة جديدة لفهمك";

  const top = patterns[0];
  const arcLabels: Record<EmotionalArc, string> = {
    deepening: "يتعمّق",
    shifting: "يتحوّل",
    repeating: "يتكرر",
    emerging: "يبدأ بالظهور",
  };

  const dayRef = connectedDays.length > 0 ? ` — يتصل بيوم ${connectedDays[0]}` : "";
  return `نمط "${top.keyword}" ${arcLabels[arc]} في رحلتك${dayRef}`;
}

export async function linkReflection(
  supabase: any,
  userId: string,
  currentDay: number
): Promise<LinkedReflection> {
  const { data: reflections } = await supabase
    .from("reflections")
    .select("day, note, emotion, awareness_state")
    .eq("user_id", userId)
    .order("day", { ascending: true });

  const rows: ReflectionRow[] = reflections ?? [];
  const patterns = extractPatterns(rows);
  const emotionalArc = detectEmotionalArc(rows);
  const connectedDays = findConnectedDays(currentDay, rows, patterns);
  const insight = generateInsight(patterns, emotionalArc, connectedDays);

  return { insight, connectedDays, emotionalArc, patterns };
}

// Export for testing
export { extractPatterns, detectEmotionalArc, findConnectedDays, generateInsight };
