import type { ProgressState } from "./progressEngine";
import type { JourneyState } from "./journeyState";
import type { CognitiveAction } from "./actionGenerator";

export interface Decision {
  source: "system" | "user" | "hybrid";
  confidence: number; // 0 → 1
  overrideAllowed: boolean;
  reasoning: string;
}

export interface ActionWithDecision extends CognitiveAction {
  decision: Decision;
}

function computeConfidence(
  progress: ProgressState,
  journey: JourneyState | null,
  action: CognitiveAction
): number {
  let confidence = 0.5;

  // High drift = lower confidence (system is guessing more)
  if (progress.drift > 5) confidence -= 0.2;
  else if (progress.drift > 2) confidence -= 0.1;

  // More data = higher confidence
  if (progress.completedDays.length > 7) confidence += 0.15;
  if (progress.streak > 3) confidence += 0.1;

  // Journey state affects confidence
  if (journey) {
    if (journey.emotionalState === "engaged") confidence += 0.15;
    if (journey.emotionalState === "lost") confidence -= 0.15;
    if (journey.currentMode === "breakthrough") confidence += 0.1;
  }

  // High priority actions = higher system confidence
  if (action.priority === "high") confidence += 0.1;

  return Math.max(0, Math.min(1, Math.round(confidence * 100) / 100));
}

function deriveSource(
  action: CognitiveAction,
  journey: JourneyState | null
): Decision["source"] {
  // Decision type actions require user input
  if (action.type === "decision") return "hybrid";
  // High risk = hybrid (needs user confirmation)
  if (journey?.riskLevel === "high") return "hybrid";
  return "system";
}

function generateReasoning(
  progress: ProgressState,
  action: CognitiveAction,
  journey: JourneyState | null
): string {
  if (action.type === "decision") {
    return `النظام يقترح هذا القرار بناءً على ${progress.drift} أيام drift — تحتاج تأكيدك`;
  }
  if (progress.mode === "recovery_boost") {
    return "عودتك أظهرت زخم إيجابي — النظام يقترح البناء عليه";
  }
  if (progress.mode === "intervention") {
    return `مرّت ${progress.drift} أيام بدون تفاعل — هذا الاقتراح يساعدك على العودة`;
  }
  if (journey?.currentMode === "breakthrough") {
    return "أنماط التأمل العميق + الإكمال المتسق تشير لمرحلة اختراق";
  }
  if (progress.streak > 3) {
    return `${progress.streak} أيام متتالية — النظام واثق من هذا الاقتراح`;
  }
  return "اقتراح مبني على بيانات رحلتك الحالية";
}

export function attachDecision(
  action: CognitiveAction,
  progress: ProgressState,
  journey: JourneyState | null = null
): ActionWithDecision {
  const confidence = computeConfidence(progress, journey, action);
  const source = deriveSource(action, journey);

  return {
    ...action,
    decision: {
      source,
      confidence,
      overrideAllowed: true, // user can always override
      reasoning: generateReasoning(progress, action, journey),
    },
  };
}

// Export for testing
export { computeConfidence, deriveSource, generateReasoning };
