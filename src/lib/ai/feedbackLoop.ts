/**
 * Feedback Loop Engine — detects evolution in user behavior over time.
 *
 * The core idea: split the user's journey into two halves (early vs
 * recent), compute behavioral signals for each half, and compare.
 * The delta tells us if the user is evolving, regressing, or stable.
 *
 * Why split-half instead of storing previous state?
 *   - No new DB table needed
 *   - Pure computation from existing data
 *   - Same inputs → same output (deterministic)
 *   - The user's own data IS the history
 *
 * Output: FeedbackLoopOutput with currentState, previousState,
 * stateChange, confidence, and Arabic insights.
 *
 * Pure module: zero IO, zero localStorage, zero side effects.
 */

import {
  computeBehavioralSignals,
  type BehavioralSignals,
  type EngagementLevel,
} from "./signals";
import type { ReflectionForAnalysis } from "./patterns";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type StateChange = "evolving" | "regressing" | "stable";

export interface StateSnapshot {
  score: number;
  engagement: EngagementLevel;
  consistency: number;
  completionRate: number;
  reflectionRate: number;
  avgNoteLength: number;
}

export interface Insight {
  /** Machine-readable signal name. */
  signal: string;
  /** Arabic description (voice v2 tone — observational, not judgmental). */
  text: string;
  /** Direction of this specific metric. */
  direction: "up" | "down" | "stable";
  /** How much the metric changed (absolute). */
  delta: number;
}

export interface FeedbackLoopOutput {
  /** Behavioral signals computed from the most recent half of data. */
  currentState: StateSnapshot;
  /** Behavioral signals computed from the earlier half of data. */
  previousState: StateSnapshot;
  /** Overall evolution direction. */
  stateChange: StateChange;
  /** How confident we are in the stateChange classification (0–1). */
  confidence: number;
  /** Concrete Arabic insights describing what shifted and how. */
  insights: Insight[];
  /** One-line Arabic summary of the evolution. */
  summary: string;
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

/** Minimum completed days required to split into two meaningful halves. */
const MIN_DAYS_FOR_COMPARISON = 4;

/** Score delta threshold for "evolving" vs "stable". */
const EVOLVING_THRESHOLD = 8;

/** Score delta threshold for "regressing". */
const REGRESSING_THRESHOLD = -8;

/** Individual metric delta thresholds for generating insights. */
const METRIC_DELTA_THRESHOLD = 0.1; // 10% change is noteworthy

// ---------------------------------------------------------------------------
// Core computation
// ---------------------------------------------------------------------------

/**
 * Run the feedback loop on the user's journey data.
 *
 * Splits completed days and reflections into early vs recent halves,
 * computes behavioral signals for each, and produces evolution insights.
 *
 * If there's not enough data (< 4 completed days), returns a "stable"
 * output with empty insights — the system has no basis for comparison.
 */
export function evaluateFeedbackLoop(
  currentDay: number,
  completedDays: number[],
  reflections: ReflectionForAnalysis[]
): FeedbackLoopOutput {
  const sorted = [...completedDays]
    .filter((d) => Number.isInteger(d) && d >= 1 && d <= 28)
    .sort((a, b) => a - b);

  // Not enough data for split-half comparison
  if (sorted.length < MIN_DAYS_FOR_COMPARISON) {
    const full = computeBehavioralSignals(currentDay, sorted, reflections);
    const snapshot = toSnapshot(full);
    return {
      currentState: snapshot,
      previousState: snapshot,
      stateChange: "stable",
      confidence: 0.2,
      insights: [],
      summary: "لم تتشكّل بيانات كافية بعد لقراءة التحوّل.",
    };
  }

  // Split into two halves by day midpoint
  const midpoint = sorted[Math.floor(sorted.length / 2)];

  const earlyDays = sorted.filter((d) => d <= midpoint);
  const recentDays = sorted.filter((d) => d > midpoint);
  const earlyRefs = reflections.filter((r) => r.day <= midpoint);
  const recentRefs = reflections.filter((r) => r.day > midpoint);

  // Compute signals for each half
  const earlySignals = computeBehavioralSignals(
    midpoint,
    earlyDays,
    earlyRefs
  );
  const recentSignals = computeBehavioralSignals(
    currentDay,
    recentDays,
    recentRefs
  );

  const previousState = toSnapshot(earlySignals);
  const currentState = toSnapshot(recentSignals);

  // Compute delta
  const scoreDelta = currentState.score - previousState.score;

  // Classify change
  let stateChange: StateChange;
  if (scoreDelta >= EVOLVING_THRESHOLD) {
    stateChange = "evolving";
  } else if (scoreDelta <= REGRESSING_THRESHOLD) {
    stateChange = "regressing";
  } else {
    stateChange = "stable";
  }

  // Confidence scales with sample size
  const confidence = Math.min(
    1,
    0.3 + sorted.length * 0.05 + Math.abs(scoreDelta) * 0.01
  );

  // Generate insights from individual metric deltas
  const insights = generateInsights(previousState, currentState);

  // Arabic summary
  const summary = buildSummary(stateChange, scoreDelta, insights);

  return {
    currentState,
    previousState,
    stateChange,
    confidence: roundTo(confidence, 2),
    insights,
    summary,
  };
}

// ---------------------------------------------------------------------------
// Snapshot extraction
// ---------------------------------------------------------------------------

function toSnapshot(signals: BehavioralSignals): StateSnapshot {
  return {
    score: signals.behavioralScore,
    engagement: signals.engagementLevel,
    consistency: signals.consistencyIndex,
    completionRate: signals.completionRate,
    reflectionRate: signals.reflectionRate,
    avgNoteLength: signals.avgNoteLength,
  };
}

// ---------------------------------------------------------------------------
// Insight generation — Arabic, observational, non-judgmental
// ---------------------------------------------------------------------------

function generateInsights(
  prev: StateSnapshot,
  curr: StateSnapshot
): Insight[] {
  const insights: Insight[] = [];

  // Completion rate
  const compDelta = curr.completionRate - prev.completionRate;
  if (Math.abs(compDelta) >= METRIC_DELTA_THRESHOLD) {
    insights.push({
      signal: "completion_rate",
      text:
        compDelta > 0
          ? "معدّل الإكمال ارتفع — الخطوات أصبحت أكثر انتظاماً."
          : "معدّل الإكمال انخفض — فترات التوقّف أصبحت أطول.",
      direction: compDelta > 0 ? "up" : "down",
      delta: roundTo(Math.abs(compDelta), 3),
    });
  }

  // Reflection rate
  const refDelta = curr.reflectionRate - prev.reflectionRate;
  if (Math.abs(refDelta) >= METRIC_DELTA_THRESHOLD) {
    insights.push({
      signal: "reflection_rate",
      text:
        refDelta > 0
          ? "بدأت تكتب أكثر ممّا كنت — الكلمات تجد طريقها."
          : "الكتابة تراجعت — ربّما الصمت يقول شيئاً.",
      direction: refDelta > 0 ? "up" : "down",
      delta: roundTo(Math.abs(refDelta), 3),
    });
  }

  // Consistency
  const consDelta = curr.consistency - prev.consistency;
  if (Math.abs(consDelta) >= 10) {
    insights.push({
      signal: "consistency",
      text:
        consDelta > 0
          ? "الإيقاع أصبح أكثر انتظاماً — هناك نمط يتشكّل."
          : "الإيقاع تذبذب — الفجوات بين الأيام اتّسعت.",
      direction: consDelta > 0 ? "up" : "down",
      delta: roundTo(Math.abs(consDelta), 1),
    });
  }

  // Depth (note length)
  const depthDelta = curr.avgNoteLength - prev.avgNoteLength;
  if (Math.abs(depthDelta) >= 20) {
    insights.push({
      signal: "depth",
      text:
        depthDelta > 0
          ? "تأمّلاتك أصبحت أعمق — تكتب أكثر في كلّ مرة."
          : "تأمّلاتك أصبحت أقصر — ربّما تختزل ما يحتاج مساحة.",
      direction: depthDelta > 0 ? "up" : "down",
      delta: roundTo(Math.abs(depthDelta), 0),
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Arabic summary builder
// ---------------------------------------------------------------------------

function buildSummary(
  change: StateChange,
  scoreDelta: number,
  insights: Insight[]
): string {
  if (insights.length === 0) {
    return "الحالة مستقرّة — لا تحوّلات واضحة بعد.";
  }

  switch (change) {
    case "evolving":
      return `تحوّل إيجابي (+${Math.round(scoreDelta)} نقطة). ${insights[0].text}`;
    case "regressing":
      return `تراجع ملحوظ (${Math.round(scoreDelta)} نقطة). ${insights[0].text}`;
    case "stable":
      return `الحالة مستقرّة مع تحرّكات صغيرة. ${insights[0].text}`;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roundTo(n: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}
