/**
 * Memory Evolution — compressed user identity fingerprint.
 *
 * Converts raw behavioral signals + patterns + feedback loop data
 * into a minimal "identity fingerprint" that summarizes WHO this
 * user is in the journey. Stored as a small JSON-serializable
 * object, NOT as raw logs.
 *
 * The fingerprint is:
 *   - Small (< 500 bytes JSON) — safe to inject into AI prompts
 *   - Stable (doesn't flicker between renders)
 *   - Meaningful (captures behavioral patterns, not individual events)
 *   - Deterministic (same inputs → same fingerprint)
 *
 * The shift detector compares two fingerprints and returns only
 * MEANINGFUL changes — not noise.
 *
 * Pure module: zero IO, zero localStorage, zero React.
 */

import type { BehavioralSignals, EngagementLevel } from "./signals";
import type { BehavioralState } from "./orchestrate";
import type { StateChange } from "./feedbackLoop";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface UserFingerprint {
  /** Primary behavioral classification. */
  archetype: BehavioralState;
  /** Quantified engagement. */
  score: number;
  /** Engagement band. */
  engagement: EngagementLevel;
  /** Regularity of practice. */
  consistency: number;
  /** Writing depth band: shallow (<50 avg chars), moderate (50–150), deep (>150). */
  depthBand: "shallow" | "moderate" | "deep";
  /** Evolution direction from feedback loop. */
  evolution: StateChange;
  /** Top 3 recurring theme keywords (empty if none). */
  topThemes: string[];
  /** The day the user is on (for temporal context). */
  journeyDay: number;
  /** Total days completed. */
  completedCount: number;
  /** ISO timestamp of when this fingerprint was computed. */
  computedAt: string;
}

export interface FingerprintShift {
  /** Did the fingerprint change meaningfully? */
  changed: boolean;
  /** What specific fields shifted. Empty if no change. */
  shifts: Array<{
    field: string;
    from: string | number;
    to: string | number;
    significance: "low" | "medium" | "high";
  }>;
  /** Arabic summary of the shift (voice v2). Empty if no change. */
  summary: string;
}

// ---------------------------------------------------------------------------
// Fingerprint construction
// ---------------------------------------------------------------------------

/**
 * Build a compressed identity fingerprint from behavioral data.
 *
 * This is the "who is this user right now" snapshot that the AI,
 * city, and journey layers can all consume as context.
 */
export function buildFingerprint(inputs: {
  archetype: BehavioralState;
  signals: BehavioralSignals;
  evolution: StateChange;
  topThemes: string[];
  currentDay: number;
  completedCount: number;
}): UserFingerprint {
  const { archetype, signals, evolution, topThemes, currentDay, completedCount } =
    inputs;

  return {
    archetype,
    score: signals.behavioralScore,
    engagement: signals.engagementLevel,
    consistency: signals.consistencyIndex,
    depthBand: classifyDepthBand(signals.avgNoteLength),
    evolution,
    topThemes: topThemes.slice(0, 3),
    journeyDay: currentDay,
    completedCount,
    computedAt: new Date().toISOString(),
  };
}

function classifyDepthBand(
  avgNoteLength: number
): UserFingerprint["depthBand"] {
  if (avgNoteLength > 150) return "deep";
  if (avgNoteLength >= 50) return "moderate";
  return "shallow";
}

// ---------------------------------------------------------------------------
// Shift detection — compare two fingerprints
// ---------------------------------------------------------------------------

/**
 * Detect meaningful shifts between a previous and current fingerprint.
 *
 * Only reports changes that matter — not noise. Thresholds:
 *   - archetype change: always significant
 *   - score change ≥ 10: significant
 *   - engagement band change: significant
 *   - depth band change: significant
 *   - evolution direction change: significant
 *   - consistency change ≥ 15: significant
 *
 * Returns { changed: false } if no meaningful shift.
 */
export function detectShift(
  previous: UserFingerprint | null,
  current: UserFingerprint
): FingerprintShift {
  if (!previous) {
    return {
      changed: true,
      shifts: [
        {
          field: "archetype",
          from: "unknown",
          to: current.archetype,
          significance: "high",
        },
      ],
      summary: "بصمة جديدة — النظام بدأ يتعرّف عليك.",
    };
  }

  const shifts: FingerprintShift["shifts"] = [];

  // Archetype change
  if (previous.archetype !== current.archetype) {
    shifts.push({
      field: "archetype",
      from: previous.archetype,
      to: current.archetype,
      significance: "high",
    });
  }

  // Score change ≥ 10
  if (Math.abs(current.score - previous.score) >= 10) {
    shifts.push({
      field: "score",
      from: previous.score,
      to: current.score,
      significance: Math.abs(current.score - previous.score) >= 20 ? "high" : "medium",
    });
  }

  // Engagement band change
  if (previous.engagement !== current.engagement) {
    shifts.push({
      field: "engagement",
      from: previous.engagement,
      to: current.engagement,
      significance: "high",
    });
  }

  // Depth band change
  if (previous.depthBand !== current.depthBand) {
    shifts.push({
      field: "depthBand",
      from: previous.depthBand,
      to: current.depthBand,
      significance: "medium",
    });
  }

  // Evolution direction change
  if (previous.evolution !== current.evolution) {
    shifts.push({
      field: "evolution",
      from: previous.evolution,
      to: current.evolution,
      significance: "medium",
    });
  }

  // Consistency change ≥ 15
  if (Math.abs(current.consistency - previous.consistency) >= 15) {
    shifts.push({
      field: "consistency",
      from: previous.consistency,
      to: current.consistency,
      significance: Math.abs(current.consistency - previous.consistency) >= 25 ? "high" : "medium",
    });
  }

  if (shifts.length === 0) {
    return {
      changed: false,
      shifts: [],
      summary: "",
    };
  }

  return {
    changed: true,
    shifts,
    summary: buildShiftSummary(shifts),
  };
}

// ---------------------------------------------------------------------------
// Arabic shift summary
// ---------------------------------------------------------------------------

function buildShiftSummary(shifts: FingerprintShift["shifts"]): string {
  const highShifts = shifts.filter((s) => s.significance === "high");

  if (highShifts.length === 0) {
    return "تحرّكات صغيرة في رحلتك — النظام يلاحظها.";
  }

  const first = highShifts[0];

  switch (first.field) {
    case "archetype":
      return `تحوّلت من "${arabicArchetype(String(first.from))}" إلى "${arabicArchetype(String(first.to))}".`;
    case "engagement":
      return `مستوى حضورك انتقل من "${arabicEngagement(String(first.from))}" إلى "${arabicEngagement(String(first.to))}".`;
    case "score": {
      const delta = Number(first.to) - Number(first.from);
      return delta > 0
        ? `تقدّمك ارتفع بـ ${Math.abs(delta)} نقطة.`
        : `تقدّمك انخفض بـ ${Math.abs(delta)} نقطة.`;
    }
    default:
      return `تغيّر ملحوظ في ${first.field}.`;
  }
}

function arabicArchetype(a: string): string {
  const map: Record<string, string> = {
    silent_progressor: "متقدّم بصمت",
    deep_reflector: "متأمّل عميق",
    inconsistent: "متذبذب",
    avoidant: "متجنّب",
    new_user: "في البداية",
  };
  return map[a] ?? a;
}

function arabicEngagement(e: string): string {
  const map: Record<string, string> = {
    low: "منخفض",
    medium: "متوسّط",
    high: "مرتفع",
  };
  return map[e] ?? e;
}

// ---------------------------------------------------------------------------
// Prompt serialization — compress fingerprint for AI injection
// ---------------------------------------------------------------------------

/**
 * Serialize a fingerprint into a short Arabic block for the AI prompt.
 * Max ~200 chars. Returns empty string if fingerprint is too thin.
 */
export function fingerprintToPromptBlock(fp: UserFingerprint): string {
  if (fp.completedCount < 2) return "";

  const lines = [
    "— بصمة المتأمّل —",
    `النمط: ${arabicArchetype(fp.archetype)}`,
    `الحضور: ${arabicEngagement(fp.engagement)} (${fp.score}/100)`,
    `الاتّجاه: ${fp.evolution === "evolving" ? "يتطوّر" : fp.evolution === "regressing" ? "يتراجع" : "مستقرّ"}`,
  ];

  if (fp.topThemes.length > 0) {
    lines.push(`المواضيع: ${fp.topThemes.join("، ")}`);
  }

  lines.push("— نهاية البصمة —");
  return lines.join("\n");
}
