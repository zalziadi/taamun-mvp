/**
 * Behavioral Signals — quantified user behavior from DB data.
 *
 * Turns raw progress + reflections into three numerical indices:
 *   - behavioralScore  (0–100) composite engagement metric
 *   - engagementLevel  (low / medium / high) derived from score
 *   - consistencyIndex (0–100) how regular are the completions
 *
 * Plus derived facts: skippedDays, reflectionRate, avgGap, etc.
 *
 * Pure module: zero IO, zero localStorage, zero React.
 * Same inputs → same outputs. Testable in isolation.
 */

import type { ReflectionForAnalysis } from "./patterns";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type EngagementLevel = "low" | "medium" | "high";

export interface BehavioralSignals {
  /** Composite score: 0 (no engagement) → 100 (perfect engagement). */
  behavioralScore: number;
  /** Derived from behavioralScore: low (<35), medium (35–70), high (>70). */
  engagementLevel: EngagementLevel;
  /** How regular are the completions: 0 (random) → 100 (daily). */
  consistencyIndex: number;
  /** Completion rate: completedDays / totalPossibleDays. 0–1. */
  completionRate: number;
  /** Reflection rate: reflections with text / completedDays. 0–1. */
  reflectionRate: number;
  /** Days in [1..currentDay] that are NOT completed. */
  skippedDays: number[];
  /** Total number of skipped days. */
  skippedCount: number;
  /** Average gap (in days) between consecutive completions. 0 if < 2. */
  avgGap: number;
  /** Average note length across non-empty reflections. */
  avgNoteLength: number;
  /** How many reflections had actual text (not just completion). */
  reflectionsWithText: number;
  /** Sample size — how many reflections were analyzed. */
  sampleSize: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_JOURNEY_DAYS = 28;

// Score weights — behavioral score is a weighted composite
const W_COMPLETION = 0.35;   // completing days matters most
const W_REFLECTION = 0.25;   // writing reflections
const W_CONSISTENCY = 0.20;  // regularity of engagement
const W_DEPTH = 0.20;        // depth of writing

// Engagement thresholds
const LOW_THRESHOLD = 35;
const HIGH_THRESHOLD = 70;

// ---------------------------------------------------------------------------
// Core computation
// ---------------------------------------------------------------------------

/**
 * Compute behavioral signals from DB data.
 *
 * @param currentDay      From progress table (1–28).
 * @param completedDays   From progress table (sorted array of day numbers).
 * @param reflections     From reflections table (with note field at minimum).
 */
export function computeBehavioralSignals(
  currentDay: number,
  completedDays: number[],
  reflections: ReflectionForAnalysis[]
): BehavioralSignals {
  const clampedDay = Math.max(1, Math.min(TOTAL_JOURNEY_DAYS, currentDay));
  const validCompleted = completedDays.filter(
    (d) => Number.isInteger(d) && d >= 1 && d <= TOTAL_JOURNEY_DAYS
  );
  const uniqueCompleted = [...new Set(validCompleted)].sort((a, b) => a - b);

  // --- Completion rate ---
  const possibleDays = clampedDay; // days 1..currentDay
  const completionRate =
    possibleDays > 0 ? Math.min(1, uniqueCompleted.length / possibleDays) : 0;

  // --- Skipped days ---
  const completedSet = new Set(uniqueCompleted);
  const skippedDays: number[] = [];
  for (let d = 1; d <= clampedDay; d += 1) {
    if (!completedSet.has(d)) skippedDays.push(d);
  }

  // --- Reflection metrics ---
  const nonEmptyReflections = reflections.filter(
    (r) => typeof r.note === "string" && r.note.trim().length > 0
  );
  const reflectionsWithText = nonEmptyReflections.length;
  const reflectionRate =
    uniqueCompleted.length > 0
      ? Math.min(1, reflectionsWithText / uniqueCompleted.length)
      : 0;

  const noteLengths = nonEmptyReflections.map(
    (r) => (r.note ?? "").trim().length
  );
  const avgNoteLength =
    noteLengths.length > 0
      ? Math.round(noteLengths.reduce((a, b) => a + b, 0) / noteLengths.length)
      : 0;

  // --- Consistency (regularity of gaps between completed days) ---
  const { consistencyIndex, avgGap } = computeConsistency(uniqueCompleted);

  // --- Depth score (0–1): how deep are the reflections? ---
  // Scale: 0 chars → 0, 200+ chars avg → 1
  const depthScore = Math.min(1, avgNoteLength / 200);

  // --- Composite behavioral score ---
  const rawScore =
    completionRate * W_COMPLETION * 100 +
    reflectionRate * W_REFLECTION * 100 +
    consistencyIndex * W_CONSISTENCY +
    depthScore * W_DEPTH * 100;
  const behavioralScore = Math.round(Math.max(0, Math.min(100, rawScore)));

  // --- Engagement level ---
  const engagementLevel: EngagementLevel =
    behavioralScore >= HIGH_THRESHOLD
      ? "high"
      : behavioralScore >= LOW_THRESHOLD
        ? "medium"
        : "low";

  return {
    behavioralScore,
    engagementLevel,
    consistencyIndex: Math.round(consistencyIndex),
    completionRate: roundTo(completionRate, 3),
    reflectionRate: roundTo(reflectionRate, 3),
    skippedDays,
    skippedCount: skippedDays.length,
    avgGap: roundTo(avgGap, 2),
    avgNoteLength,
    reflectionsWithText,
    sampleSize: reflections.length,
  };
}

// ---------------------------------------------------------------------------
// Consistency calculation
// ---------------------------------------------------------------------------

/**
 * Consistency index: 100 = perfect daily completion, 0 = totally random.
 *
 * Algorithm: compute the standard deviation of gaps between consecutive
 * completed days. A perfect streak has stddev = 0 → index = 100.
 * A random pattern has high stddev → index approaches 0.
 *
 * Special cases:
 *   - 0 or 1 completed days → index = 0 (not enough data)
 *   - All consecutive (no gaps) → index = 100
 */
function computeConsistency(
  sortedCompleted: number[]
): { consistencyIndex: number; avgGap: number } {
  if (sortedCompleted.length < 2) {
    return { consistencyIndex: 0, avgGap: 0 };
  }

  const gaps: number[] = [];
  for (let i = 1; i < sortedCompleted.length; i += 1) {
    gaps.push(sortedCompleted[i] - sortedCompleted[i - 1]);
  }

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;

  // Standard deviation of gaps
  const variance =
    gaps.reduce((sum, g) => sum + (g - avgGap) ** 2, 0) / gaps.length;
  const stddev = Math.sqrt(variance);

  // Perfect consistency (all gaps = 1) → stddev = 0 → index = 100
  // High variance → index approaches 0
  // Scale: stddev of 0 = 100, stddev of 5+ = ~0
  const consistencyIndex = Math.max(0, Math.min(100, 100 - stddev * 20));

  return { consistencyIndex, avgGap };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roundTo(n: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}
