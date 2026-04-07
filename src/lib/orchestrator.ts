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

// ── Types ──

export type StepType = "ritual" | "today" | "progress" | "city" | "decision";

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
}

// ── Trigger Detection ──

const INDECISION_KEYWORDS = ["تردد", "حيرة", "تأجيل", "مقاومة"];
const COMMITMENT_THRESHOLD = 30;

function shouldTriggerDecision(inputs: OrchestratorInputs): { trigger: boolean; reason: string } {
  // 1. User explicitly requested help
  if (inputs.userRequestedHelp) {
    return { trigger: true, reason: "طلبت المساعدة في القرار" };
  }

  // 2. Health check shows stuck
  if (inputs.recentDecisions.length >= 3) {
    const health = checkDecisionHealth(inputs.recentDecisions);
    if (health.status === "stuck") {
      return { trigger: true, reason: health.suggestion };
    }
  }

  // 3. Indecision patterns detected
  const hasIndecisionPattern = inputs.patterns.some((p) =>
    INDECISION_KEYWORDS.some((kw) => p.keyword.includes(kw))
  );
  if (hasIndecisionPattern) {
    return { trigger: true, reason: "أنماط التردد ظاهرة في تأملاتك — وقت القرار" };
  }

  // 4. Low commitment score
  const commitment = inputs.context?.commitmentScore ?? 100;
  if (commitment < COMMITMENT_THRESHOLD && inputs.progress.completedDays.length > 3) {
    return { trigger: true, reason: "الالتزام في انخفاض — قرار واحد قد يعيد الزخم" };
  }

  return { trigger: false, reason: "" };
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
  const { trigger, reason } = shouldTriggerDecision(inputs);

  // If user provided inline input, run pipeline immediately
  let decision: Decision | null = null;
  if (inputs.inlineDecisionInput) {
    decision = runDecisionPipeline(inputs.inlineDecisionInput);
  }

  return {
    type: "decision",
    priority: trigger ? 200 : 0,
    visible: trigger,
    reason,
    data: {
      triggered: trigger,
      decision,                  // null until user submits input
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
  const currentStep = sorted[0] ?? buildTodayStep(inputs);

  // Derive primary signal
  let primarySignal: string;
  if (currentStep.type === "decision") {
    primarySignal = "🎯 وقت القرار — كل شيء آخر ينتظر";
  } else if (currentStep.type === "progress") {
    primarySignal = "⏳ الرحلة تنتظر عودتك";
  } else if (currentStep.type === "ritual") {
    primarySignal = "🫁 لحظة البداية";
  } else if (currentStep.type === "city") {
    primarySignal = "🏙️ مدينتك تتشكّل";
  } else {
    primarySignal = "✦ اليوم بين يديك";
  }

  return {
    currentStep,
    steps,
    primarySignal,
  };
}

// Export for testing
export { shouldTriggerDecision, shouldShowProgress, shouldShowCity, shouldShowRitual };
