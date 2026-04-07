/**
 * Prism Engine (V1)
 *
 * Sits BETWEEN raw user data and the Orchestrator.
 *
 *   User data → Adaptive Model → PRISM → Orchestrator → UI
 *
 * Prism does NOT execute actions. It transforms raw signals into
 * a single, unified experience direction that the Orchestrator consumes.
 *
 * Philosophy:
 *   "The system does not decide for the user — it reveals the right
 *    experience for the user."
 *
 * Performance: O(1), pure, deterministic.
 */

import type { ProgressState } from "../progressEngine";
import type { JourneyState } from "../journeyState";
import type { CognitiveContext } from "../cognitiveContext";
import type { Pattern } from "../reflectionLinker";
import type { UserModel } from "../adaptive/model";
import { normalizeUserModel } from "../adaptive/model";
import { detectPressure } from "../tone/pressure";

// ── Types ──

export type ExperienceMode = "focus" | "explore" | "reflect" | "decide" | "expand";
export type ExperienceTone = "soft" | "calm" | "firm" | "intense";
export type DepthMode = "short" | "medium" | "deep";
export type EnergyState = "low" | "medium" | "high";
export type DirectionType = "decision" | "ritual" | "today" | "progress" | "city";

export interface ExperienceProfile {
  mode: ExperienceMode;
  tone: ExperienceTone;
  pressureLevel: number;
  depthMode: DepthMode;
  energyState: EnergyState;
}

export interface PrimaryDirection {
  type: DirectionType;
  priority: number;
  reason: string;
}

export interface ExperienceSignals {
  userState: string;
  dominantPattern: string;
  recommendedFlow: string;
}

export interface OrchestratorHint {
  lockFlow: boolean;
  lockReason: string;
  suggestedStepOverride: boolean;
}

export interface PrismOutput {
  experienceProfile: ExperienceProfile;
  primaryDirection: PrimaryDirection;
  experienceSignals: ExperienceSignals;
  orchestratorHint: OrchestratorHint;
}

export interface PrismInput {
  user?: { id: string } | null;
  adaptiveModel: UserModel | null;
  behaviorSignals: {
    userRequestedHelp?: boolean;
    completionTime?: number;
    quickActions?: number;
    deepEngagement?: boolean;
    requestedDepth?: boolean;
  };
  journeyState: JourneyState;
  context: {
    progress: ProgressState;
    cognitive: CognitiveContext | null;
    patterns: Pattern[];
    reflectionCount: number;
  };
}

// ── Constants ──

const HESITATION_KEYWORDS = ["تردد", "حيرة", "تأجيل", "مقاومة", "توقف"];

const FALLBACK: PrismOutput = {
  experienceProfile: {
    mode: "explore",
    tone: "calm",
    pressureLevel: 0.4,
    depthMode: "medium",
    energyState: "medium",
  },
  primaryDirection: {
    type: "today",
    priority: 50,
    reason: "بداية الرحلة — استكشاف هادئ",
  },
  experienceSignals: {
    userState: "neutral",
    dominantPattern: "none",
    recommendedFlow: "today",
  },
  orchestratorHint: {
    lockFlow: false,
    lockReason: "",
    suggestedStepOverride: false,
  },
};

// ── Helpers ──

function detectHesitation(patterns: Pattern[]): boolean {
  return patterns.some((p) => HESITATION_KEYWORDS.some((kw) => p.keyword.includes(kw)));
}

function isDecisionTriggered(input: PrismInput, model: UserModel, hesitation: boolean): { trigger: boolean; reason: string } {
  if (input.behaviorSignals.userRequestedHelp) {
    return { trigger: true, reason: "طلبت المساعدة" };
  }
  if (model.resistanceLevel > 0.7) {
    return { trigger: true, reason: "مقاومة متراكمة" };
  }
  if (model.consistencyScore < 0.3 && input.context.progress.completedDays.length >= 3) {
    return { trigger: true, reason: "ضعف الاستمرارية مع تجربة سابقة" };
  }
  if (hesitation) {
    return { trigger: true, reason: "أنماط تردد ظاهرة" };
  }
  return { trigger: false, reason: "" };
}

// ── Mode Selection ──

function selectMode(input: PrismInput, model: UserModel, hesitation: boolean): ExperienceMode {
  // Hesitation + resistance → decide
  if (hesitation && model.resistanceLevel > 0.5) return "decide";

  // High commitment + deep reflections → reflect
  const commitment = input.context.cognitive?.commitmentScore ?? 0;
  if (commitment > 70 && input.context.reflectionCount >= 5) return "reflect";

  // Quick / fast actions → focus
  if (model.consistencyScore > 0.7 && input.behaviorSignals.quickActions && input.behaviorSignals.quickActions > 2) {
    return "focus";
  }

  // Stable progress (high streak + positive momentum) → expand
  if (input.context.progress.streak >= 5 && input.context.progress.momentum >= 3) return "expand";

  // Default
  return "explore";
}

// ── Tone Selection ──

function selectTone(input: PrismInput, mode: ExperienceMode, model: UserModel): ExperienceTone {
  if (mode === "decide") {
    // Decide mode uses firm tone unless user is highly sensitive
    return model.pressureSensitivity > 0.7 ? "calm" : "firm";
  }

  if (input.journeyState.emotionalState === "lost") return "soft";
  if (input.context.progress.momentum >= 6) return "intense";
  if (input.context.progress.drift > 5) return "calm";
  if (model.pressureSensitivity > 0.6) return "soft";

  return "calm";
}

// ── Pressure Calculation ──

function calculatePressure(input: PrismInput, model: UserModel): number {
  const resistance = Math.max(
    model.resistanceLevel,
    input.journeyState.emotionalState === "resistant" ? 0.8 :
    input.journeyState.emotionalState === "lost" ? 0.6 :
    input.context.progress.drift > 5 ? 0.5 : 0.2
  );

  const basePressure = detectPressure({
    resistance,
    momentum: input.context.progress.momentum,
    commitment: input.context.cognitive?.commitmentScore ?? 100,
  });

  // V4 spec formula
  const finalPressure = basePressure
    * (1 - model.resistanceLevel * 0.4)
    * (1 - model.pressureSensitivity * 0.6);

  return Math.max(0, Math.min(1, Math.round(finalPressure * 100) / 100));
}

// ── Depth Mode ──

function selectDepth(input: PrismInput, model: UserModel): DepthMode {
  if (input.behaviorSignals.requestedDepth) return "deep";
  if (model.reflectionDepthPreference > 0.7) return "deep";
  if (model.reflectionDepthPreference < 0.3) return "short";
  if (input.behaviorSignals.deepEngagement) return "deep";
  if (input.behaviorSignals.quickActions && input.behaviorSignals.quickActions > 3) return "short";
  return "medium";
}

// ── Energy State ──

function selectEnergy(input: PrismInput, model: UserModel): EnergyState {
  const momentum = input.context.progress.momentum;
  const consistency = model.consistencyScore;

  if (momentum >= 5 && consistency >= 0.7) return "high";
  if (momentum <= -3 || consistency < 0.3) return "low";
  return "medium";
}

// ── Primary Direction ──

function selectPrimaryDirection(
  input: PrismInput,
  model: UserModel,
  decisionTriggered: { trigger: boolean; reason: string }
): PrimaryDirection {
  if (decisionTriggered.trigger) {
    return {
      type: "decision",
      priority: 200,
      reason: decisionTriggered.reason,
    };
  }

  // Ritual needed: drift > 0 OR low engagement at start of day
  const lowEngagement = (input.context.cognitive?.commitmentScore ?? 100) < 30;
  if (input.context.progress.drift > 0 && input.context.progress.drift <= 2) {
    return {
      type: "ritual",
      priority: 100,
      reason: "لحظة عودة هادئة — افتح بنية",
    };
  }

  // Progress: drift detected but not catastrophic
  if (input.context.progress.drift > 2) {
    return {
      type: "progress",
      priority: 80,
      reason: "الرحلة تنتظر عودتك",
    };
  }

  // Low engagement → today (default daily focus)
  if (lowEngagement) {
    return {
      type: "today",
      priority: 50,
      reason: "تركيز اليوم — خطوة بسيطة",
    };
  }

  // Growth signals: high reflection + emerging signals → city
  if (input.context.reflectionCount >= 3) {
    return {
      type: "city",
      priority: 35,
      reason: "مدينتك تتشكّل — شوف وين أنت",
    };
  }

  return {
    type: "today",
    priority: 50,
    reason: "تركيز اليوم",
  };
}

// ── Signal Interpretation ──

function buildSignals(
  input: PrismInput,
  mode: ExperienceMode,
  hesitation: boolean
): ExperienceSignals {
  let userState = "neutral";
  if (hesitation) userState = "hesitating";
  else if (input.journeyState.emotionalState === "engaged") userState = "engaged";
  else if (input.journeyState.emotionalState === "lost") userState = "lost";
  else if (input.context.progress.momentum >= 5) userState = "momentum-rising";
  else if (input.context.progress.drift > 5) userState = "drifting";

  // Dominant pattern (top by weight)
  const sorted = [...input.context.patterns].sort((a, b) => b.weight - a.weight);
  const dominantPattern = sorted[0]?.keyword ?? "none";

  // Recommended flow follows mode
  const recommendedFlow =
    mode === "decide" ? "decision" :
    mode === "focus" ? "today" :
    mode === "reflect" ? "ritual" :
    mode === "expand" ? "city" :
    "today";

  return { userState, dominantPattern, recommendedFlow };
}

// ── Orchestrator Hint ──

function buildHint(decisionTriggered: { trigger: boolean; reason: string }): OrchestratorHint {
  if (decisionTriggered.trigger) {
    return {
      lockFlow: true,
      lockReason: "decision_focus",
      suggestedStepOverride: true,
    };
  }
  return {
    lockFlow: false,
    lockReason: "",
    suggestedStepOverride: false,
  };
}

// ── Main ──

export function runPrism(input: PrismInput): PrismOutput {
  try {
    const model = normalizeUserModel(input.adaptiveModel);
    const hesitation = detectHesitation(input.context.patterns);
    const decisionTriggered = isDecisionTriggered(input, model, hesitation);

    const mode = selectMode(input, model, hesitation);
    const tone = selectTone(input, mode, model);
    const pressureLevel = calculatePressure(input, model);
    const depthMode = selectDepth(input, model);
    const energyState = selectEnergy(input, model);

    return {
      experienceProfile: {
        mode,
        tone,
        pressureLevel,
        depthMode,
        energyState,
      },
      primaryDirection: selectPrimaryDirection(input, model, decisionTriggered),
      experienceSignals: buildSignals(input, mode, hesitation),
      orchestratorHint: buildHint(decisionTriggered),
    };
  } catch {
    return FALLBACK;
  }
}

// Export internals for testing
export { selectMode, selectTone, selectDepth, selectEnergy, calculatePressure, detectHesitation, isDecisionTriggered, FALLBACK };
