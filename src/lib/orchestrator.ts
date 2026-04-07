/**
 * Journey Orchestrator
 *
 * Replaces the multi-tool confusion (/guide, /decision, /program, /city)
 * with ONE guided flow.
 *
 * The orchestrator decides what the user sees FIRST.
 * Other steps remain available but secondary.
 *
 * Stages: ritual → today → progress → city → decision (only when needed)
 */

import type { ProgressState } from "./progressEngine";
import type { JourneyState } from "./journeyState";
import type { CognitiveContext } from "./cognitiveContext";
import type { Guidance } from "./guidanceEngine";
import type { CityMap, CityZone } from "./cityEngine";
import type { DailyRitual } from "./ritualEngine";
import type { UserIdentity } from "./identityTracker";
import type { Pattern } from "./reflectionLinker";
import { runDecisionPipeline, checkDecisionHealth, type Decision, type DecisionInput } from "./decisionEngine";

// V2 imports — Consciousness Engine
import { buildJustification, type Justification } from "./decision/justification";
import { predictDecisionNeedDetailed, type PredictionResult } from "./patterns/predict";
import { detectTone, applyTone, type ToneType } from "./tone";
import { updateIdentityState, type IdentityUpdateResult } from "./identity/update";

// V3 imports — Identity Reflection + Narrative Memory + Adaptive Pressure
import { buildIdentityReflection, type IdentityReflection } from "./identity/reflection";
import { buildNarrativeMemory, type NarrativeMemoryDay } from "./narrative/memory";
import { buildAnticipation, type Anticipation } from "./engagement/anticipation";
import { detectPressure, classifyPressure, classifyPressureSimple, buildPressureCTA, type PressureLevel, type PressureClassSimple } from "./tone/pressure";

// V4 imports — Adaptive Intelligence Layer
import { type UserModel, normalizeUserModel, DEFAULT_USER_MODEL } from "./adaptive/model";

// ── Types ──

export type StepType = "ritual" | "today" | "progress" | "city" | "decision";

export type DecisionTriggerType = "reactive" | "predictive";

export interface FlowLock {
  enabled: boolean;
  reason: string;
}

export interface OrchestratorStep {
  type: StepType;
  priority: number;       // higher = more urgent
  visible: boolean;
  reason: string;         // why this step is shown (Arabic)
  data: any;
}

export interface OrchestratorState {
  currentStep: OrchestratorStep;
  steps: OrchestratorStep[];
  // The dominant signal driving the current step
  primarySignal: string;
  // V2: Flow lock for critical steps (e.g., decision focus)
  flowLock?: FlowLock;
  // V2: Adaptive tone for the whole orchestrator
  tone?: ToneType;
  // V2: Identity update from current action
  identityUpdate?: IdentityUpdateResult;
  // V3: Identity reflection — "you are now X instead of Y"
  identityReflection?: IdentityReflection;
  // V3: Narrative memory — continuous story across days
  narrativeMemory?: string[];
  // V3: Anticipation — what's coming next
  anticipation?: Anticipation;
  // V3: Adaptive pressure level (0-1) + classification + CTA
  pressureLevel?: number;
  pressureClass?: PressureLevel;
  pressureClassSimple?: PressureClassSimple;  // V4: 3-class system per spec
  pressureCTA?: string;

  // V4: Adaptive intelligence layer
  adaptive?: {
    model: UserModel;
    appliedThreshold: number;     // the actual threshold used for prediction
    appliedPressure: number;      // pressure after sensitivity adjustment
    depthMode: "short" | "deep";  // chosen reflection mode
  };
}

export interface OrchestratorInputs {
  // Core state
  progress: ProgressState;
  journey: JourneyState;
  context: CognitiveContext | null;
  guidance: Guidance | null;
  identity: UserIdentity | null;

  // Optional content
  ritual: DailyRitual | null;
  city: CityMap | null;
  patterns: Pattern[];

  // Behavioral signals
  reflectionCount: number;
  ritualSeenToday: boolean;
  recentDecisions: { decision: string; goal: string; date: string }[];

  // User-driven
  userRequestedHelp?: boolean;
  inlineDecisionInput?: DecisionInput | null;

  // V3: Narrative timeline (last N days)
  narrativeTimeline?: NarrativeMemoryDay[];
  // V3: Resistance signal (0-1) from journey state
  resistanceLevel?: number;

  // V4: Adaptive user model (per-user learned preferences)
  userModel?: UserModel | null;
}

// ── Trigger Detection ──

const INDECISION_KEYWORDS = ["تردد", "حيرة", "تأجيل", "مقاومة"];
const COMMITMENT_THRESHOLD = 30;
const PREDICTIVE_THRESHOLD = 0.7;

interface TriggerResult {
  trigger: boolean;
  reason: string;
  triggerType: DecisionTriggerType;
  prediction?: PredictionResult;
}

function shouldTriggerDecision(inputs: OrchestratorInputs): TriggerResult {
  // V4: Use adaptive threshold from user model (default 0.7)
  const userModel = normalizeUserModel(inputs.userModel);
  const adaptiveThreshold = userModel.decisionThreshold;

  // 1. User explicitly requested help (REACTIVE)
  if (inputs.userRequestedHelp) {
    return { trigger: true, reason: "طلبت المساعدة في القرار", triggerType: "reactive" };
  }

  // 2. Health check shows stuck (REACTIVE)
  if (inputs.recentDecisions.length >= 3) {
    const health = checkDecisionHealth(inputs.recentDecisions);
    if (health.status === "stuck") {
      return { trigger: true, reason: health.suggestion, triggerType: "reactive" };
    }
  }

  // 3. PREDICTIVE: Run prediction engine on patterns + entries
  const patternKeywords = inputs.patterns.map((p) => p.keyword);
  const entryTexts = inputs.recentDecisions.map((d) => d.decision);
  const commitment = inputs.context?.commitmentScore ?? 100;

  const prediction = predictDecisionNeedDetailed({
    patterns: patternKeywords,
    recentEntries: entryTexts,
    commitmentScore: commitment,
  });

  // V4: Compare against adaptive threshold (per user)
  if (prediction.probability > adaptiveThreshold) {
    return {
      trigger: true,
      reason: `النظام يتوقع قرار قريب (${Math.round(prediction.probability * 100)}%): ${prediction.signals.join(" • ")}`,
      triggerType: "predictive",
      prediction,
    };
  }

  // 4. Reactive fallbacks: pattern match + low commitment
  const hasIndecisionPattern = inputs.patterns.some((p) =>
    INDECISION_KEYWORDS.some((kw) => p.keyword.includes(kw))
  );
  if (hasIndecisionPattern) {
    return {
      trigger: true,
      reason: "أنماط التردد ظاهرة في تأملاتك — وقت القرار",
      triggerType: "reactive",
    };
  }

  if (commitment < COMMITMENT_THRESHOLD && inputs.progress.completedDays.length > 3) {
    return {
      trigger: true,
      reason: "الالتزام في انخفاض — قرار واحد قد يعيد الزخم",
      triggerType: "reactive",
    };
  }

  // V4 spec: 5. High resistance from user model
  if (userModel.resistanceLevel > 0.7) {
    return {
      trigger: true,
      reason: "النظام يلاحظ مقاومة متراكمة — قرار صغير قد يكسر الجمود",
      triggerType: "reactive",
    };
  }

  // V4 spec: 6. Low consistency (< 0.3) with at least 3 days of activity
  if (userModel.consistencyScore < 0.3 && inputs.progress.completedDays.length >= 3) {
    return {
      trigger: true,
      reason: "الاستمرارية ضعيفة — وقت قرار يعيد التوازن",
      triggerType: "reactive",
    };
  }

  return { trigger: false, reason: "", triggerType: "reactive" };
}

// ── Visibility Rules ──

function shouldShowProgress(inputs: OrchestratorInputs): boolean {
  return inputs.progress.drift > 2 || inputs.progress.missedDays.length > 2;
}

function shouldShowCity(inputs: OrchestratorInputs): boolean {
  if (inputs.reflectionCount >= 3) return true;
  const signal = inputs.identity?.transformationSignal;
  return signal === "emerging" || signal === "deepening" || signal === "integrated";
}

function shouldShowRitual(inputs: OrchestratorInputs): boolean {
  // Ritual is always available; primary on first visit of the day
  return inputs.ritual !== null;
}

// ── Step Builders ──

function buildRitualStep(inputs: OrchestratorInputs): OrchestratorStep {
  const isFirstToday = !inputs.ritualSeenToday;
  return {
    type: "ritual",
    priority: isFirstToday ? 100 : 20,
    visible: shouldShowRitual(inputs),
    reason: isFirstToday ? "لحظة البداية — افتح اليوم بنية" : "ابدأ من هنا",
    data: inputs.ritual,
  };
}

function buildTodayStep(inputs: OrchestratorInputs): OrchestratorStep {
  return {
    type: "today",
    priority: 50,
    visible: true,
    reason: "تركيز اليوم",
    data: {
      day: inputs.progress.currentDay,
      guidance: inputs.guidance,
      context: inputs.context,
      streak: inputs.progress.streak,
    },
  };
}

function buildProgressStep(inputs: OrchestratorInputs): OrchestratorStep {
  const visible = shouldShowProgress(inputs);
  return {
    type: "progress",
    priority: visible ? 80 : 0,
    visible,
    reason: visible
      ? `فاتك ${inputs.progress.missedDays.length} أيام — راجع الرحلة`
      : "تقدّمك على مسار",
    data: {
      drift: inputs.progress.drift,
      mode: inputs.progress.mode,
      missedDays: inputs.progress.missedDays,
      streak: inputs.progress.streak,
      completionRate: inputs.progress.completionRate,
      momentum: inputs.progress.momentum,
    },
  };
}

function buildCityStep(inputs: OrchestratorInputs): OrchestratorStep {
  const visible = shouldShowCity(inputs);
  return {
    type: "city",
    priority: visible ? 35 : 0,
    visible,
    reason: visible
      ? "مدينتك تتشكّل — شوف وين أنت"
      : "المدينة تنتظر تأملاتك",
    data: inputs.city,
  };
}

function buildDecisionStep(inputs: OrchestratorInputs): OrchestratorStep {
  const { trigger, reason, triggerType, prediction } = shouldTriggerDecision(inputs);

  // If user provided inline input, run pipeline immediately
  let decision: Decision | null = null;
  if (inputs.inlineDecisionInput) {
    decision = runDecisionPipeline(inputs.inlineDecisionInput);
  }

  // V2: Build justification when triggered
  let justification: Justification | null = null;
  if (trigger) {
    const patternKeywords = inputs.patterns.map((p) => p.keyword);
    const entries = inputs.recentDecisions.map((d) => ({ text: d.decision }));
    const commitment = inputs.context?.commitmentScore ?? 100;
    justification = buildJustification({
      patterns: patternKeywords,
      recentEntries: entries,
      commitmentScore: commitment,
    });
  }

  return {
    type: "decision",
    priority: trigger ? 200 : 0,
    visible: trigger,
    reason,
    data: {
      triggered: trigger,
      triggerType,
      prediction: prediction ?? null,
      justification,
      decision,
      requiresInput: trigger && !decision,
    },
  };
}

// ── City Zone Boost (after decision completed) ──

export function boostZonesAfterDecision(city: CityMap | null): CityMap | null {
  if (!city) return null;

  const boostedZones: CityZone[] = city.zones.map((zone) => {
    if (zone.id === "power" || zone.id === "action") {
      const newEnergy = Math.min(100, zone.energy + 15);
      let newState = zone.state;
      if (newEnergy >= 75) newState = "thriving";
      else if (newEnergy >= 50) newState = "stable";
      else if (newEnergy >= 25) newState = "growing";
      return { ...zone, energy: newEnergy, state: newState };
    }
    return zone;
  });

  return { ...city, zones: boostedZones };
}

// ── Decision Micro-Reward ──

export const DECISION_MICRO_REWARD = {
  type: "decision" as const,
  message: "وضوح القرار هو بداية التغيير",
  intensity: "medium" as const,
};

// ── Main Builder ──

export function buildOrchestrator(inputs: OrchestratorInputs): OrchestratorState {
  const steps: OrchestratorStep[] = [
    buildRitualStep(inputs),
    buildTodayStep(inputs),
    buildProgressStep(inputs),
    buildCityStep(inputs),
    buildDecisionStep(inputs),
  ];

  // Pick currentStep: highest-priority visible step
  const visibleSteps = steps.filter((s) => s.visible);
  const sorted = [...visibleSteps].sort((a, b) => b.priority - a.priority);
  let currentStep = sorted[0] ?? buildTodayStep(inputs);

  // V2: Flow Lock — when decision is current, lock other steps
  let flowLock: FlowLock | undefined = undefined;
  if (currentStep.type === "decision") {
    flowLock = { enabled: true, reason: "decision_focus" };
    // Hide all other steps from secondary nav
    for (const step of steps) {
      if (step.type !== "decision") {
        step.visible = false;
      }
    }
  }

  // V2: Detect tone from progress + commitment + hesitation
  const hasHesitation = inputs.patterns.some((p) =>
    INDECISION_KEYWORDS.some((kw) => p.keyword.includes(kw))
  );
  const tone: ToneType = detectTone({
    momentum: inputs.progress.momentum,
    drift: inputs.progress.drift,
    commitment: inputs.context?.commitmentScore ?? 100,
    hesitationPatterns: hasHesitation,
  });

  // Derive primary signal (V2: tone-aware)
  let baseSignal: string;
  if (currentStep.type === "decision") {
    baseSignal = "🎯 وقت القرار — كل شيء آخر ينتظر";
  } else if (currentStep.type === "progress") {
    baseSignal = "⏳ الرحلة تنتظر عودتك";
  } else if (currentStep.type === "ritual") {
    baseSignal = "🫁 لحظة البداية";
  } else if (currentStep.type === "city") {
    baseSignal = "🏙️ مدينتك تتشكّل";
  } else {
    baseSignal = "✦ اليوم بين يديك";
  }
  const primarySignal = applyTone(baseSignal, tone);

  // V2: Identity update for the current action
  const actionMap: Record<StepType, "decision" | "ritual" | "progress" | "reflection"> = {
    decision: "decision",
    ritual: "ritual",
    progress: "progress",
    today: "reflection",
    city: "reflection",
  };
  const intensity = currentStep.priority >= 100 ? 0.9 : currentStep.priority >= 50 ? 0.6 : 0.3;
  const action = actionMap[currentStep.type];
  const identityUpdate = updateIdentityState({ action, intensity });

  // V3: Identity Reflection — "you are now X instead of Y"
  const identityReflection = buildIdentityReflection({
    action,
    identityShift: identityUpdate.identity_shift,
  });

  // V3: Narrative Memory — continuous story
  const narrativeMemory = inputs.narrativeTimeline && inputs.narrativeTimeline.length > 0
    ? buildNarrativeMemory({ lastDays: inputs.narrativeTimeline })
    : [];

  // V3: Anticipation Loop — what's coming next
  const anticipation = buildAnticipation({
    streak: inputs.progress.streak,
    momentum: inputs.progress.momentum,
  });

  // V4: Get adaptive user model (defaults if missing)
  const userModel = normalizeUserModel(inputs.userModel);

  // V3: Adaptive Pressure (V4-modulated by user sensitivity)
  const resistance = inputs.resistanceLevel ?? (
    Math.max(
      // V4: User-specific resistance level wins if higher
      userModel.resistanceLevel,
      inputs.journey.emotionalState === "resistant" ? 0.8 :
      inputs.journey.emotionalState === "lost" ? 0.6 :
      inputs.progress.drift > 5 ? 0.5 : 0.2
    )
  );
  const basePressure = detectPressure({
    resistance,
    momentum: inputs.progress.momentum,
    commitment: inputs.context?.commitmentScore ?? 100,
  });
  // V4 spec formula: pressureLevel = basePressure * (1 - resistanceLevel) * (1 - sensitivity)
  // resistance is already in basePressure via detectPressure, so we apply
  // additional user-level resistance damping + full sensitivity damping
  const userResistanceDamping = 1 - userModel.resistanceLevel * 0.4;
  const userSensitivityDamping = 1 - userModel.pressureSensitivity * 0.6;
  const adjustedPressure = Math.max(
    0,
    Math.min(1, basePressure * userResistanceDamping * userSensitivityDamping)
  );
  const pressureLevel = Math.round(adjustedPressure * 100) / 100;
  const pressureClass = classifyPressure(pressureLevel);
  const pressureClassSimple = classifyPressureSimple(pressureLevel);
  const pressureCTA = buildPressureCTA(pressureLevel);

  // V4: Adaptive anticipation — boost milestone for consistent users
  let adaptedAnticipation = anticipation;
  if (userModel.consistencyScore > 0.7) {
    adaptedAnticipation = {
      ...anticipation,
      nextMilestone: Math.min(28, anticipation.nextMilestone + 2),
    };
  }

  // V4: Adaptive reflection depth
  const depthMode: "short" | "deep" = userModel.reflectionDepthPreference > 0.7 ? "deep" : "short";

  // V3: Inject reflection + anticipation + pressure into decision step data
  if (currentStep.type === "decision") {
    currentStep.data = {
      ...currentStep.data,
      reflection: identityReflection,
      anticipation: adaptedAnticipation,
      pressureLevel,
      pressureClass,
      pressureClassSimple,
      pressureCTA,
      depthMode,
    };
  }

  // V4 spec section 6: Auto-boost city when 3+ reflections OR signal = emerging+
  let boostedCity = inputs.city;
  if (boostedCity) {
    const hasEnoughReflections = inputs.reflectionCount >= 3;
    const hasEmergingSignal =
      inputs.identity?.transformationSignal === "emerging" ||
      inputs.identity?.transformationSignal === "deepening" ||
      inputs.identity?.transformationSignal === "integrated";

    if (hasEnoughReflections || hasEmergingSignal) {
      boostedCity = boostZonesAfterDecision(boostedCity);
      // Reflect boosted city back into the city step data
      const cityStep = steps.find((s) => s.type === "city");
      if (cityStep) cityStep.data = boostedCity;
    }
  }

  return {
    currentStep,
    steps,
    primarySignal,
    flowLock,
    tone,
    identityUpdate,
    identityReflection,
    narrativeMemory,
    anticipation: adaptedAnticipation,
    pressureLevel,
    pressureClass,
    pressureClassSimple,
    pressureCTA,
    // V4: Adaptive layer
    adaptive: {
      model: userModel,
      appliedThreshold: userModel.decisionThreshold,
      appliedPressure: pressureLevel,
      depthMode,
    },
  };
}

// Export for testing
export { shouldTriggerDecision, shouldShowProgress, shouldShowCity, shouldShowRitual };
