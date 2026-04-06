import type { Guidance, GuidanceFocus, GuidanceTone } from "./guidanceEngine";
import type { PersonalityProfile, PersonalityStyle } from "./personalityEngine";
import type { Narrative } from "./narrativeEngine";
import type { CognitiveAction } from "./actionGenerator";

// ── Types ──

export interface RitualEntry {
  message: string;
  breathCue: boolean;
}

export interface RitualIntention {
  focusArea: string;
  intentionText: string;
}

export interface RitualAction {
  type: "reflect" | "act" | "review";
  instruction: string;
}

export interface RitualClosing {
  message: string;
  integration: string;
}

export interface DailyRitual {
  entry: RitualEntry;
  intention: RitualIntention;
  action: RitualAction;
  closing: RitualClosing;
}

export interface RitualInputs {
  guidance: Guidance;
  personality: PersonalityProfile | null;
  narrative: Narrative | null;
  cognitiveAction: CognitiveAction | null;
  emotionalState: "engaged" | "resistant" | "lost" | "curious";
  day: number;
  streakDays: number;
}

// ── Focus Area Names ──

const FOCUS_NAMES: Record<GuidanceFocus, string> = {
  continue: "الاستمرارية",
  recover: "العودة",
  deepen: "العمق",
  decide: "القرار",
};

// ── Entry ──

const ENTRY_MESSAGES: Record<GuidanceTone, Record<string, string>> = {
  supportive: {
    engaged: "مرحباً بك. خذ نفساً عميقاً — هذا وقتك",
    resistant: "لا بأس أنك هنا حتى لو ما تبي. وجودك يكفي",
    lost: "رجعت — وهذا أهم شيء. خلنا نبدأ ببطء",
    curious: "جميل أنك هنا. اليوم يحمل شيء ينتظرك",
  },
  challenging: {
    engaged: "أنت هنا وجاهز. اليوم مختلف — اشتغل بعمق",
    resistant: "المقاومة اللي تحس فيها؟ هي بالضبط الباب اللي تحتاج تفتحه",
    lost: "رجعت. ما نضيع وقت — ندخل مباشرة",
    curious: "فضولك هذا هو البداية. خله يقودك اليوم",
  },
  reflective: {
    engaged: "لحظة صمت قبل ما نبدأ. تنفس… واسمع ما بداخلك",
    resistant: "توقف. لاحظ المقاومة بدون حكم — ما الذي تخبرك به؟",
    lost: "أنت هنا الآن. هذا يكفي. خلنا نبدأ من هالمكان",
    curious: "اليوم يبدأ بسؤال. اسمح للسؤال يأتي وحده",
  },
};

function buildEntry(tone: GuidanceTone, emotionalState: string, personality: PersonalityProfile | null): RitualEntry {
  const messages = ENTRY_MESSAGES[tone] ?? ENTRY_MESSAGES.reflective;
  const message = messages[emotionalState] ?? messages.curious;

  // Breath cue: always for reflective/supportive, skip for challenging unless lost
  const breathCue = tone !== "challenging" || emotionalState === "lost";

  return { message, breathCue };
}

// ── Intention ──

function buildIntention(
  guidance: Guidance,
  narrative: Narrative | null,
  personality: PersonalityProfile | null,
  day: number
): RitualIntention {
  const focusArea = FOCUS_NAMES[guidance.focus];

  // Build intention based on personality motivation type
  let intentionText: string;

  if (narrative && narrative.story.length > 10) {
    // Extract first meaningful clause from narrative
    const clause = narrative.story.split("—")[0]?.trim().split(".")[0]?.trim() ?? "";
    if (clause.length > 5) {
      intentionText = `نيتي اليوم: ${clause}`;
    } else {
      intentionText = buildDefaultIntention(guidance.focus, personality, day);
    }
  } else {
    intentionText = buildDefaultIntention(guidance.focus, personality, day);
  }

  return { focusArea, intentionText };
}

function buildDefaultIntention(
  focus: GuidanceFocus,
  personality: PersonalityProfile | null,
  day: number
): string {
  const motivation = personality?.motivationType ?? "growth-driven";

  if (focus === "recover") {
    if (motivation === "fear-driven") return "نيتي اليوم: أن أعود بلطف بدون حكم على نفسي";
    if (motivation === "purpose-driven") return "نيتي اليوم: أن أتذكر لماذا بدأت هذه الرحلة";
    return "نيتي اليوم: أن أعيد الاتصال بالرحلة بخطوة واحدة";
  }

  if (focus === "deepen") {
    if (motivation === "purpose-driven") return "نيتي اليوم: أن أفهم شيئاً لم أفهمه من قبل";
    return "نيتي اليوم: أن أتعمق أكثر في ما يظهر لي";
  }

  if (focus === "decide") {
    return "نيتي اليوم: أن أتخذ قراراً واحداً واضحاً";
  }

  // continue
  if (day > 14) return "نيتي اليوم: أن أستمر بنفس الإيقاع — الاستمرارية هي التحوّل";
  return "نيتي اليوم: أن أكون حاضراً في هذا اليوم";
}

// ── Action ──

function buildAction(
  cognitiveAction: CognitiveAction | null,
  guidance: Guidance,
  personality: PersonalityProfile | null
): RitualAction {
  if (cognitiveAction) {
    const typeMap: Record<string, RitualAction["type"]> = {
      reflection: "reflect",
      review: "review",
      decision: "act",
      practice: "act",
    };
    return {
      type: typeMap[cognitiveAction.type] ?? "act",
      instruction: cognitiveAction.suggestedNextStep,
    };
  }

  // Fallback from guidance
  const pathMap: Record<string, RitualAction["type"]> = {
    reflection: "reflect",
    review: "review",
    action: "act",
  };

  const style = personality?.style ?? "supportive";
  const instructions: Record<PersonalityStyle, string> = {
    supportive: "اقرأ الآية ببطء. لاحظ أول شعور يأتيك. اكتبه",
    challenger: "اقرأ الآية مرة واحدة. اسأل نفسك: ما الذي أتجنبه؟ واكتب الجواب",
    analytical: "اقرأ الآية. لاحظ النمط. اربطه بما كتبته سابقاً",
    spiritual: "اقرأ الآية ٣ مرات ببطء. اسمح للمعنى يصل بدون تحليل",
  };

  return {
    type: pathMap[guidance.suggestedPath.type] ?? "reflect",
    instruction: instructions[style],
  };
}

// ── Closing ──

const CLOSING_MESSAGES: Record<GuidanceTone, string> = {
  supportive: "انتهيت لليوم. كل خطوة تحسب — ارتاح الآن",
  challenging: "يوم آخر أكملته. غداً ندفع أكثر",
  reflective: "خذ نفساً أخيراً. ما تعلمته اليوم صار جزء منك",
};

const INTEGRATION_PROMPTS: Record<GuidanceFocus, string> = {
  continue: "احمل هذا المعنى معك لبقية يومك",
  recover: "عودتك اليوم هي البداية الحقيقية",
  deepen: "ما وصلت إليه اليوم سيظهر أثره لاحقاً",
  decide: "القرار الذي اتخذته سيتضح معناه مع الوقت",
};

function buildClosing(tone: GuidanceTone, focus: GuidanceFocus): RitualClosing {
  return {
    message: CLOSING_MESSAGES[tone] ?? CLOSING_MESSAGES.reflective,
    integration: INTEGRATION_PROMPTS[focus] ?? INTEGRATION_PROMPTS.continue,
  };
}

// ── Main ──

export function buildDailyRitual(inputs: RitualInputs): DailyRitual {
  const { guidance, personality, narrative, cognitiveAction, emotionalState, day, streakDays } = inputs;

  const entry = buildEntry(guidance.tone, emotionalState, personality);
  const intention = buildIntention(guidance, narrative, personality, day);
  const action = buildAction(cognitiveAction, guidance, personality);
  const closing = buildClosing(guidance.tone, guidance.focus);

  return { entry, intention, action, closing };
}

// Export for testing
export { buildEntry, buildIntention, buildAction, buildClosing };
