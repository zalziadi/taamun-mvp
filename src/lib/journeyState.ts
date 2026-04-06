import type { ProgressState } from "./progressEngine";

export interface JourneyState {
  currentMode: "flow" | "reflection" | "recovery" | "breakthrough";
  emotionalState: "engaged" | "resistant" | "lost" | "curious";
  cognitiveLoad: "low" | "medium" | "high";
  lastShift: string | null;
  riskLevel: "low" | "medium" | "high";
  trajectory: "improving" | "declining" | "unstable" | null;
  momentum: number;
}

interface JourneyInputs {
  progress: ProgressState;
  reflectionCount: number;
  lastReflectionDepth: "none" | "short" | "medium" | "deep";
  actionsCompletedRecently: number;
  daysSinceLastReflection: number;
  trajectory?: "improving" | "declining" | "unstable" | null;
}

function classifyDepth(noteLength: number): "none" | "short" | "medium" | "deep" {
  if (noteLength === 0) return "none";
  if (noteLength < 50) return "short";
  if (noteLength < 200) return "medium";
  return "deep";
}

function deriveMode(inputs: JourneyInputs): JourneyState["currentMode"] {
  const { progress, lastReflectionDepth, actionsCompletedRecently } = inputs;

  if (progress.mode === "intervention" || progress.mode === "catch_up") return "recovery";
  if (lastReflectionDepth === "deep" && actionsCompletedRecently > 0) return "breakthrough";
  if (inputs.daysSinceLastReflection <= 1 && lastReflectionDepth !== "none") return "reflection";
  return "flow";
}

function deriveEmotionalState(inputs: JourneyInputs): JourneyState["emotionalState"] {
  const { progress, reflectionCount, daysSinceLastReflection } = inputs;

  if (progress.drift > 5 && reflectionCount === 0) return "lost";
  if (progress.drift > 3 && daysSinceLastReflection > 3) return "resistant";
  if (reflectionCount > 0 && daysSinceLastReflection <= 2) return "engaged";
  return "curious";
}

function deriveCognitiveLoad(inputs: JourneyInputs): JourneyState["cognitiveLoad"] {
  const { progress } = inputs;
  if (progress.missedDays.length > 5) return "high";
  if (progress.missedDays.length > 2) return "medium";
  return "low";
}

function deriveRisk(inputs: JourneyInputs): JourneyState["riskLevel"] {
  const { progress, daysSinceLastReflection, reflectionCount } = inputs;
  if (progress.drift > 5 && reflectionCount === 0) return "high";
  if (progress.drift > 3 || daysSinceLastReflection > 4) return "medium";
  return "low";
}

export function buildJourneyState(inputs: JourneyInputs): JourneyState {
  return {
    currentMode: deriveMode(inputs),
    emotionalState: deriveEmotionalState(inputs),
    cognitiveLoad: deriveCognitiveLoad(inputs),
    lastShift: null,
    riskLevel: deriveRisk(inputs),
    trajectory: inputs.trajectory ?? null,
    momentum: inputs.progress.momentum,
  };
}

export { classifyDepth };
export type { JourneyInputs };
