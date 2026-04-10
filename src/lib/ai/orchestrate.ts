/**
 * Journey Orchestrator — the intelligence layer that turns raw DB data
 * into a living, adaptive experience.
 *
 * Architecture:
 *   DB (progress + reflections) → orchestrate() → {
 *     profile:    who is this user right now?
 *     nextAction: what should they do next?
 *     aiContext:  what should the AI know when mirroring?
 *     citySignals: how should the city look?
 *   }
 *
 * Rules:
 *   1. NEVER reads from localStorage, V9 state, or any client store
 *   2. ALL inputs come from DB (passed by the caller)
 *   3. Pure function: same inputs → same output, no side effects
 *   4. Voice v2 discipline on all Arabic text (no imperatives in
 *      reasons, tone instructions in Arabic for the AI prompt)
 *
 * This module CONSUMES:
 *   - analyzePatterns() from patterns.ts (already built)
 *   - Types from patterns.ts (ReflectionForAnalysis, PatternInsight)
 *
 * This module does NOT:
 *   - Fetch data (caller does)
 *   - Call AI (the AI route uses the output as context)
 *   - Touch the UI (components read the output via API)
 */

import {
  analyzePatterns,
  compressPatternToPromptBlock,
  type PatternInsight,
  type ReflectionForAnalysis,
} from "./patterns";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type BehavioralState =
  | "silent_progressor"  // completes days, rarely writes (< 30 chars avg)
  | "deep_reflector"     // writes long reflections, open sentiment
  | "inconsistent"       // big gaps (≥ 3 days), starts and stops
  | "avoidant"           // resistance signals, short notes, low engagement
  | "new_user";          // < 3 reflections — not enough signal

export interface UserJourneyProfile {
  behavioralState: BehavioralState;
  confidence: number; // 0..1
  /** The raw pattern analysis — available for debug/advanced consumers. */
  patternInsight: PatternInsight;
}

export interface RecommendedAction {
  type: "continue_day" | "reflect" | "revisit_city" | "rest";
  route: string;
  /** Arabic, voice v2 — no imperatives. */
  reason: string;
}

export interface ToneProfile {
  /** Arabic instruction injected into the AI system prompt. */
  instruction: string;
  /** Machine-readable label. */
  label: BehavioralState;
  /** How much "mirror directness" the AI should use (0 = very soft, 1 = very direct). */
  directness: number;
}

export interface CitySignals {
  /** Which city zone to highlight based on recurring themes. */
  highlightZone: string | null;
  /** Visual intensity for the highlighted zone. */
  intensityLevel: "low" | "medium" | "high";
  /** Arabic reason for the highlight (for UI tooltip or debug). */
  reason: string;
}

export interface OrchestratorOutput {
  profile: UserJourneyProfile;
  nextAction: RecommendedAction;
  tone: ToneProfile;
  citySignals: CitySignals;
  /** Compressed pattern block ready to inject into the AI prompt. */
  aiPatternBlock: string;
}

export interface OrchestratorInput {
  /** From getServerProgress() → progress table. */
  currentDay: number;
  /** From getServerProgress() → progress table. */
  completedDays: number[];
  /**
   * From Supabase reflections table — the caller should fetch the
   * user's reflections with ai_* fields. At least: day, note,
   * ai_sentiment, ai_theme, ai_mirror. The more rows, the richer
   * the analysis (recommended: 10-28).
   */
  reflections: ReflectionForAnalysis[];
}

// ---------------------------------------------------------------------------
// Behavioral state classifier
// ---------------------------------------------------------------------------

function classifyBehavior(
  insight: PatternInsight,
  completedDays: number[]
): { state: BehavioralState; confidence: number } {
  const { sampleSize, sentiment, cadence, health } = insight;
  const completedCount = completedDays.length;

  // Not enough data
  if (sampleSize < 3 && completedCount < 3) {
    return { state: "new_user", confidence: 0.9 };
  }

  // Silent progressor: many completed days but very short notes
  if (completedCount >= 4 && cadence.avgNoteLength < 30) {
    return { state: "silent_progressor", confidence: 0.75 };
  }

  // Deep reflector: long notes AND positive trajectory
  if (cadence.avgNoteLength > 100 && sentiment.meanScore > -0.3) {
    return { state: "deep_reflector", confidence: 0.75 };
  }

  // Inconsistent: long gaps between entries
  if (cadence.longestGap >= 3) {
    return { state: "inconsistent", confidence: 0.65 };
  }

  // Avoidant: mostly resistant + short notes + low completion
  const classifiedCount =
    sentiment.distribution.resistant +
    sentiment.distribution.neutral +
    sentiment.distribution.open;
  if (
    classifiedCount > 0 &&
    sentiment.distribution.resistant / classifiedCount >= 0.5 &&
    cadence.avgNoteLength < 60
  ) {
    return { state: "avoidant", confidence: 0.65 };
  }

  // Fall back to health label mapping
  switch (health.label) {
    case "stuck":
      return { state: "avoidant", confidence: 0.55 };
    case "flowing":
    case "awakening":
      return { state: "deep_reflector", confidence: 0.55 };
    case "silent_doer":
      return { state: "silent_progressor", confidence: 0.7 };
    case "mixed":
      return { state: "inconsistent", confidence: 0.45 };
    default:
      return { state: "new_user", confidence: 0.3 };
  }
}

// ---------------------------------------------------------------------------
// Tone profile — Arabic instructions for the AI prompt
// ---------------------------------------------------------------------------

function buildToneProfile(state: BehavioralState): ToneProfile {
  switch (state) {
    case "silent_progressor":
      return {
        label: state,
        directness: 0.3,
        instruction:
          "هذا المستخدم يتقدّم بصمت — يُكمل الأيام بدون كتابة كثيرة. لا تُطالبه بالكلمات. اعكس حضوره بإيجازٍ شديد. جملة واحدة قصيرة كافية.",
      };
    case "deep_reflector":
      return {
        label: state,
        directness: 0.8,
        instruction:
          "هذا المستخدم يكتب بعمق وانفتاح. المرآة يمكن أن تكون أكثر مباشرة. اعكس ما لم يقله بعد — هو مستعدّ لسماعه.",
      };
    case "inconsistent":
      return {
        label: state,
        directness: 0.4,
        instruction:
          "هذا المستخدم يتقطّع في حضوره. لا تُلِحّ عليه ولا تُذكّره بغيابه. رحّب بعودته بهدوء. لا تسأل لماذا توقّف.",
      };
    case "avoidant":
      return {
        label: state,
        directness: 0.2,
        instruction:
          "هذا المستخدم يُقاوم ويتجنّب. لا تُواجهه ولا تضغط عليه. كن حاضراً بصمت. جملة واحدة أقصر من المعتاد. لا استعارات.",
      };
    case "new_user":
      return {
        label: state,
        directness: 0.5,
        instruction:
          "هذا المستخدم في البداية — لا تعرفه بعد. كن دافئاً ومختصراً. لا تبالغ في الترحيب ولا في الوعود.",
      };
  }
}

// ---------------------------------------------------------------------------
// Next action recommender
// ---------------------------------------------------------------------------

function recommendAction(
  state: BehavioralState,
  currentDay: number,
  completedDays: number[]
): RecommendedAction {
  const isCurrentDayCompleted = completedDays.includes(currentDay);

  switch (state) {
    case "silent_progressor":
      // They do the days but don't write — nudge toward reflection
      return {
        type: "reflect",
        route: "/reflection",
        reason:
          "ما عشتَه بدأ يتراكم في الداخل. سطرٌ واحد يُخفّف ما لا تُسمّيه.",
      };

    case "deep_reflector":
      if (!isCurrentDayCompleted) {
        return {
          type: "continue_day",
          route: `/program/day/${currentDay}`,
          reason: "أنتَ جاهز. الخطوة التالية تنتظر — ليس أكثر.",
        };
      }
      return {
        type: "revisit_city",
        route: "/city",
        reason:
          "مدينتك تتغيّر بما عشته. ما لم تلاحظه قد يُضيء الآن.",
      };

    case "inconsistent":
      return {
        type: "continue_day",
        route: `/program/day/${currentDay}`,
        reason:
          "مكانك محفوظ هنا. لا تحتاج أن تبدأ — فقط أن تكمل.",
      };

    case "avoidant":
      return {
        type: "rest",
        route: "/",
        reason: "ربّما ليس الآن. المكان ينتظرك حين تكون.",
      };

    case "new_user":
    default:
      return {
        type: "continue_day",
        route: `/program/day/${Math.max(1, currentDay)}`,
        reason:
          "البداية لا تحتاج استعداداً — تحتاج فقط أن تكون هنا.",
      };
  }
}

// ---------------------------------------------------------------------------
// City signals — which zone to highlight based on themes
// ---------------------------------------------------------------------------

const ZONE_KEYWORDS: Record<string, string[]> = {
  identity: ["هوية", "ذات", "أنا", "نفس"],
  relationships: ["علاق", "ناس", "حب", "وحد"],
  power: ["ضغط", "قو", "سيطر", "مال"],
  reflection: ["تأمّ", "تمعّ", "صمت", "وعي"],
  action: ["فعل", "عمل", "حرك", "خطو"],
  discipline: ["نظام", "التزا", "بنا", "روتين"],
  beauty: ["جمال", "إبداع", "فن"],
  family: ["عائل", "أهل", "أم", "أب"],
  new_experiences: ["تجرب", "جديد", "مغامر"],
};

function detectZone(themes: string[]): string | null {
  if (themes.length === 0) return null;

  const allThemeText = themes.join(" ").toLowerCase();

  let bestZone: string | null = null;
  let bestScore = 0;

  for (const [zone, keywords] of Object.entries(ZONE_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (allThemeText.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestZone = zone;
    }
  }

  return bestZone;
}

function buildCitySignals(
  insight: PatternInsight,
  state: BehavioralState
): CitySignals {
  const themeNames = insight.recurringThemes.map((t) => t.theme);
  const zone = detectZone(themeNames);

  const intensity: CitySignals["intensityLevel"] =
    state === "deep_reflector"
      ? "high"
      : state === "silent_progressor" || state === "inconsistent"
        ? "medium"
        : "low";

  const topTheme = insight.recurringThemes[0]?.theme ?? null;

  return {
    highlightZone: zone,
    intensityLevel: intensity,
    reason: topTheme
      ? `المنطقة الأكثر حضوراً: ${topTheme}`
      : "لم تتشكّل أنماط واضحة بعد.",
  };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Orchestrate the user's journey experience from raw DB data.
 *
 * This is the single function that every consumer should call to get
 * the full adaptive context. It:
 *
 *   1. Runs pattern analysis on the reflections
 *   2. Classifies the user's behavioral state
 *   3. Builds a tone profile for the AI
 *   4. Recommends the next action
 *   5. Computes city rendering signals
 *   6. Compresses the pattern block for AI prompt injection
 *
 * All outputs are deterministic (same inputs → same outputs).
 * Zero localStorage, zero network calls, zero side effects.
 */
export function orchestrate(input: OrchestratorInput): OrchestratorOutput {
  const { currentDay, completedDays, reflections } = input;

  // 1. Pattern analysis (pure)
  const patternInsight = analyzePatterns(reflections);

  // 2. Behavioral classification
  const { state, confidence } = classifyBehavior(patternInsight, completedDays);

  // 3. Tone profile
  const tone = buildToneProfile(state);

  // 4. Next action
  const nextAction = recommendAction(state, currentDay, completedDays);

  // 5. City signals
  const citySignals = buildCitySignals(patternInsight, state);

  // 6. AI pattern block (for prompt injection)
  const aiPatternBlock = compressPatternToPromptBlock(patternInsight);

  return {
    profile: {
      behavioralState: state,
      confidence,
      patternInsight,
    },
    nextAction,
    tone,
    citySignals,
    aiPatternBlock,
  };
}
