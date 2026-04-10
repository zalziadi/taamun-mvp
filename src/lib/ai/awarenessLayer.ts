/**
 * Awareness Layer — Gene Keys–inspired secondary interpretation.
 *
 * This module is an OBSERVATIONAL LENS on top of the existing
 * intelligence system. It does NOT replace, override, or modify
 * any existing behavioral classification, scoring, routing, or
 * UI behavior. It only ADDS a second interpretation.
 *
 * The three states:
 *   Shadow     — the user is in resistance, avoidance, or stagnation
 *   Gift       — the user is engaging, growing, noticing patterns
 *   Potential  — the user has sustained, deep, evolving engagement
 *
 * Safety guarantee:
 *   - Removing this file breaks NOTHING
 *   - No other module imports from this except /api/journey/intelligence
 *     (which wraps the output in an optional `awareness` field)
 *   - No routing, scoring, tone, or city logic reads from this
 *   - Zero side effects, zero IO, zero DB calls
 *
 * This is a LENS, not a DECISION MAKER.
 */

import type { EngagementLevel } from "./signals";
import type { StateChange } from "./feedbackLoop";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type AwarenessState = "shadow" | "gift" | "potential";
export type AwarenessStability = "stable" | "transitioning";

export interface AwarenessLayerOutput {
  /** The secondary interpretation: shadow / gift / potential. */
  awarenessState: AwarenessState;
  /** How confident we are in this classification (0–1). */
  confidence: number;
  /** Is the user firmly in this state or between two states? */
  stability: AwarenessStability;
  /** Human-readable reasoning (Arabic, observational tone). */
  reasoning: string[];
  /** Arabic label for UI display. */
  label: string;
}

// ---------------------------------------------------------------------------
// Input shape — consumes ONLY existing intelligence output
// ---------------------------------------------------------------------------

export interface AwarenessInput {
  behavioralScore: number;       // 0–100, from signals.ts
  consistencyIndex: number;      // 0–100, from signals.ts
  engagementLevel: EngagementLevel; // low / medium / high
  avgNoteLength: number;         // from signals.ts
  stateChange: StateChange;      // from feedbackLoop.ts
  completedCount: number;        // from progress
}

// ---------------------------------------------------------------------------
// Thresholds — soft, probabilistic, NOT hard gates
// ---------------------------------------------------------------------------

// Shadow zone: score < 45 OR regressing OR very low consistency
const SHADOW_SCORE_CEILING = 45;
const SHADOW_CONSISTENCY_FLOOR = 25;

// Potential zone: score > 75 AND good consistency AND evolving or stable
const POTENTIAL_SCORE_FLOOR = 75;
const POTENTIAL_CONSISTENCY_FLOOR = 60;

// Everything between = Gift zone

// Transition detection: if the user is near a boundary (within ±8 points)
// they're "transitioning" rather than firmly in one state
const BOUNDARY_FUZZ = 8;

// Minimum data threshold — below this, we can't classify meaningfully
const MIN_COMPLETED_FOR_CLASSIFICATION = 3;

// ---------------------------------------------------------------------------
// Core classification — soft probabilistic mapping
// ---------------------------------------------------------------------------

/**
 * Map existing intelligence output to an awareness state.
 *
 * This is a SECONDARY LENS — it does not modify, override, or feed
 * back into any existing system. The output is purely informational.
 *
 * Rules:
 *   Shadow:    score < 45 OR (regressing AND consistency < 25)
 *   Potential: score > 75 AND consistency > 60 AND (evolving OR stable)
 *   Gift:      everything else
 *
 * Stability:
 *   "transitioning" if score is within ±8 of a boundary
 *   "stable" otherwise
 */
export function mapAwareness(input: AwarenessInput): AwarenessLayerOutput {
  const {
    behavioralScore,
    consistencyIndex,
    engagementLevel,
    avgNoteLength,
    stateChange,
    completedCount,
  } = input;

  // Not enough data → default to shadow with low confidence
  if (completedCount < MIN_COMPLETED_FOR_CLASSIFICATION) {
    return {
      awarenessState: "shadow",
      confidence: 0.2,
      stability: "transitioning",
      reasoning: ["لم تتشكّل بيانات كافية بعد — الرحلة في بدايتها."],
      label: "الظلّ — بداية الرؤية",
    };
  }

  // --- Classify ---

  let state: AwarenessState;
  const reasoning: string[] = [];
  let confidence = 0.5; // base

  // Check for Potential first (most specific)
  if (
    behavioralScore > POTENTIAL_SCORE_FLOOR &&
    consistencyIndex > POTENTIAL_CONSISTENCY_FLOOR &&
    (stateChange === "evolving" || stateChange === "stable")
  ) {
    state = "potential";
    reasoning.push("درجة الحضور مرتفعة ومستقرّة.");
    if (stateChange === "evolving") {
      reasoning.push("الاتّجاه العام إيجابيّ ومتصاعد.");
      confidence += 0.15;
    }
    if (avgNoteLength > 100) {
      reasoning.push("عمق الكتابة يعكس تأمّلاً حقيقيّاً.");
      confidence += 0.1;
    }
    if (consistencyIndex > 80) {
      reasoning.push("الانتظام يشير إلى ممارسة مستقرّة.");
      confidence += 0.1;
    }
  }
  // Check for Shadow
  else if (
    behavioralScore < SHADOW_SCORE_CEILING ||
    (stateChange === "regressing" && consistencyIndex < SHADOW_CONSISTENCY_FLOOR)
  ) {
    state = "shadow";
    if (behavioralScore < SHADOW_SCORE_CEILING) {
      reasoning.push("درجة الحضور منخفضة — الرحلة تحتاج إيقاعاً.");
    }
    if (stateChange === "regressing") {
      reasoning.push("الاتّجاه العام يتراجع.");
      confidence += 0.1;
    }
    if (engagementLevel === "low") {
      reasoning.push("مستوى التفاعل خفيف.");
      confidence += 0.05;
    }
    if (consistencyIndex < SHADOW_CONSISTENCY_FLOOR) {
      reasoning.push("الفجوات بين الأيام كبيرة.");
      confidence += 0.05;
    }
  }
  // Default: Gift
  else {
    state = "gift";
    reasoning.push("الرحلة في مرحلة النموّ والملاحظة.");
    if (stateChange === "evolving") {
      reasoning.push("هناك حركة إيجابية واضحة.");
      confidence += 0.1;
    }
    if (avgNoteLength > 60) {
      reasoning.push("الكتابة تدلّ على تأمّل متّصل.");
      confidence += 0.05;
    }
    if (engagementLevel === "medium" || engagementLevel === "high") {
      confidence += 0.05;
    }
  }

  // --- Stability ---

  const nearShadowBoundary =
    Math.abs(behavioralScore - SHADOW_SCORE_CEILING) <= BOUNDARY_FUZZ;
  const nearPotentialBoundary =
    Math.abs(behavioralScore - POTENTIAL_SCORE_FLOOR) <= BOUNDARY_FUZZ;
  const stability: AwarenessStability =
    nearShadowBoundary || nearPotentialBoundary || stateChange !== "stable"
      ? "transitioning"
      : "stable";

  if (stability === "transitioning" && state !== "shadow") {
    reasoning.push("الحالة قريبة من حدّ التحوّل — قد تتغيّر قريباً.");
  }

  // Clamp confidence
  confidence = Math.max(0, Math.min(1, roundTo(confidence, 2)));

  return {
    awarenessState: state,
    confidence,
    stability,
    reasoning,
    label: arabicLabel(state, stability),
  };
}

// ---------------------------------------------------------------------------
// Arabic labels
// ---------------------------------------------------------------------------

function arabicLabel(state: AwarenessState, stability: AwarenessStability): string {
  const stableTag = stability === "transitioning" ? " (في تحوّل)" : "";

  switch (state) {
    case "shadow":
      return `الظلّ — بداية الرؤية${stableTag}`;
    case "gift":
      return `الهديّة — مرحلة النموّ${stableTag}`;
    case "potential":
      return `الاحتمال الأعلى — الممارسة الراسخة${stableTag}`;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roundTo(n: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}
