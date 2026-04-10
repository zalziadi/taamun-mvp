/**
 * Pattern Detection Engine — pure analytics over a user's reflections.
 *
 * Phase 5 (intelligence) · Task 1.
 *
 * Takes a sequence of reflections (already fetched from Supabase) and
 * returns a structured PatternInsight describing the user's recent
 * emotional, cognitive, and behavioral trajectory. No AI calls, no IO,
 * no React, no side effects.
 *
 * What this module does NOT do:
 *   - Does not fetch data (caller provides reflections)
 *   - Does not write to DB
 *   - Does not generate guidance text — it produces structured facts,
 *     and a higher layer (future task) will turn those facts into
 *     adaptive responses / decisions
 *   - Does not use the AI model at all
 *
 * The output is deterministic: same input → same PatternInsight.
 * This makes it trivially testable (future task) and safe to call
 * from any server or client context.
 */

// ---------------------------------------------------------------------------
// Input type — flexible enough to accept MemoryReflectionRow,
// a raw Supabase row, or any compatible shape.
// ---------------------------------------------------------------------------

export interface ReflectionForAnalysis {
  day: number;
  note: string | null;
  ai_sentiment: string | null;
  ai_theme: string | null;
  ai_mirror?: string | null;
  updated_at?: string | null;
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export type SentimentValue = "resistant" | "neutral" | "open";

export type SentimentTrajectory =
  | "deepening"    // moving toward resistance (getting heavier)
  | "opening"      // moving toward openness (getting lighter)
  | "oscillating"  // flipping back and forth
  | "stable"       // staying roughly the same
  | "unknown";     // not enough data

export type DepthTrend = "deepening" | "thinning" | "stable" | "unknown";

export type HealthLabel =
  | "stuck"         // mostly resistant, low theme variety
  | "flowing"       // mostly open, consistent
  | "mixed"         // balanced distribution, uncertain
  | "awakening"     // trajectory clearly opening
  | "silent_doer"   // many reflections, all very short (no words)
  | "new"           // too few reflections to classify
  | "unknown";      // insufficient signal

export interface SentimentStats {
  distribution: {
    resistant: number;
    neutral: number;
    open: number;
    unknown: number;
  };
  trajectory: SentimentTrajectory;
  /** Average sentiment score across entire sample: -1 (all resistant) → +1 (all open). */
  meanScore: number;
  /** Dominant sentiment in the most recent third of the sample. */
  recentDominant: SentimentValue | null;
}

export interface ThemeFrequency {
  theme: string;
  count: number;
}

export interface CadenceStats {
  totalReflections: number;
  daySpan: { first: number; last: number } | null;
  /** Longest stretch of days without a reflection. 0 if fewer than 2 reflections. */
  longestGap: number;
  /** Longest run of consecutive days with a reflection. 0 if fewer than 2. */
  consecutiveStreak: number;
  /** Average note length in characters across non-empty notes. */
  avgNoteLength: number;
}

export interface EvolutionSignals {
  /** Days where sentiment shifted by more than one step from the previous entry. */
  pivotDays: number[];
  /** Is the user writing longer notes over time, shorter, or stable? */
  depthTrend: DepthTrend;
}

export interface HealthAssessment {
  label: HealthLabel;
  /** 0..1 — how well the input supports this label. */
  confidence: number;
}

export interface PatternInsight {
  sampleSize: number;
  sentiment: SentimentStats;
  recurringThemes: ThemeFrequency[];
  cadence: CadenceStats;
  evolution: EvolutionSignals;
  health: HealthAssessment;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_SENTIMENTS = new Set(["resistant", "neutral", "open"]);

const SENTIMENT_SCORE: Record<SentimentValue, number> = {
  resistant: -1,
  neutral: 0,
  open: 1,
};

/** A sentiment jump of this many "steps" counts as a pivot. */
const PIVOT_DELTA_THRESHOLD = 1.5; // i.e., resistant (-1) → open (+1) = delta 2 ≥ 1.5

/** Trajectory thresholds on the mean-delta between first-half and second-half. */
const TRAJECTORY_OPENING_THRESHOLD = 0.4;
const TRAJECTORY_DEEPENING_THRESHOLD = -0.4;

/** How much oscillation we tolerate before calling the trajectory "oscillating". */
const OSCILLATION_VARIANCE_THRESHOLD = 0.7;

// ---------------------------------------------------------------------------
// Helpers — pure, no side effects
// ---------------------------------------------------------------------------

function normalizeSentiment(raw: string | null | undefined): SentimentValue | null {
  if (!raw) return null;
  return VALID_SENTIMENTS.has(raw) ? (raw as SentimentValue) : null;
}

function sortByDay(rows: ReflectionForAnalysis[]): ReflectionForAnalysis[] {
  return [...rows].sort((a, b) => a.day - b.day);
}

function calcSentimentStats(rows: ReflectionForAnalysis[]): SentimentStats {
  const distribution = { resistant: 0, neutral: 0, open: 0, unknown: 0 };
  const scores: number[] = [];

  for (const r of rows) {
    const s = normalizeSentiment(r.ai_sentiment);
    if (s === null) {
      distribution.unknown += 1;
      continue;
    }
    distribution[s] += 1;
    scores.push(SENTIMENT_SCORE[s]);
  }

  if (scores.length === 0) {
    return {
      distribution,
      trajectory: "unknown",
      meanScore: 0,
      recentDominant: null,
    };
  }

  const meanScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Trajectory: compare first half vs second half
  const half = Math.floor(scores.length / 2);
  const trajectory: SentimentTrajectory =
    scores.length < 3
      ? "unknown"
      : computeTrajectory(scores.slice(0, half), scores.slice(half));

  // Recent dominant — last third of the sample
  const recentStart = Math.max(0, rows.length - Math.ceil(rows.length / 3));
  const recentRows = rows.slice(recentStart);
  const recentCounts: Record<SentimentValue, number> = {
    resistant: 0,
    neutral: 0,
    open: 0,
  };
  for (const r of recentRows) {
    const s = normalizeSentiment(r.ai_sentiment);
    if (s) recentCounts[s] += 1;
  }
  const recentDominant = dominantKey(recentCounts);

  return {
    distribution,
    trajectory,
    meanScore: roundTo(meanScore, 3),
    recentDominant,
  };
}

function computeTrajectory(first: number[], second: number[]): SentimentTrajectory {
  if (first.length === 0 || second.length === 0) return "unknown";

  const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
  const avgSecond = second.reduce((a, b) => a + b, 0) / second.length;
  const delta = avgSecond - avgFirst;

  // Oscillation check — high variance in the SECOND half signals instability
  const varSecond = variance(second);
  if (varSecond >= OSCILLATION_VARIANCE_THRESHOLD) return "oscillating";

  if (delta >= TRAJECTORY_OPENING_THRESHOLD) return "opening";
  if (delta <= TRAJECTORY_DEEPENING_THRESHOLD) return "deepening";
  return "stable";
}

function variance(xs: number[]): number {
  if (xs.length === 0) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const squaredDiffs = xs.map((x) => (x - mean) ** 2);
  return squaredDiffs.reduce((a, b) => a + b, 0) / xs.length;
}

function dominantKey(counts: Record<SentimentValue, number>): SentimentValue | null {
  let max = 0;
  let winner: SentimentValue | null = null;
  (Object.keys(counts) as SentimentValue[]).forEach((k) => {
    if (counts[k] > max) {
      max = counts[k];
      winner = k;
    }
  });
  return winner;
}

function rankThemes(rows: ReflectionForAnalysis[], topN = 5): ThemeFrequency[] {
  const freq = new Map<string, number>();

  for (const r of rows) {
    const theme = (r.ai_theme ?? "").trim();
    if (!theme) continue;
    freq.set(theme, (freq.get(theme) ?? 0) + 1);
  }

  return Array.from(freq.entries())
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.theme.localeCompare(b.theme);
    })
    .slice(0, topN);
}

function calcCadence(rows: ReflectionForAnalysis[]): CadenceStats {
  if (rows.length === 0) {
    return {
      totalReflections: 0,
      daySpan: null,
      longestGap: 0,
      consecutiveStreak: 0,
      avgNoteLength: 0,
    };
  }

  const sorted = sortByDay(rows);
  const days = sorted.map((r) => r.day);
  const first = days[0];
  const last = days[days.length - 1];

  // Longest gap and longest consecutive streak
  let longestGap = 0;
  let currentStreak = 1;
  let longestStreak = 1;

  for (let i = 1; i < days.length; i += 1) {
    const diff = days[i] - days[i - 1];
    if (diff === 1) {
      currentStreak += 1;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
      // gap is (diff - 1) days of silence between entries
      longestGap = Math.max(longestGap, diff - 1);
    }
  }

  // Average note length (non-empty only)
  const nonEmptyLengths = rows
    .map((r) => (r.note ?? "").trim().length)
    .filter((n) => n > 0);

  const avgNoteLength =
    nonEmptyLengths.length === 0
      ? 0
      : Math.round(
          nonEmptyLengths.reduce((a, b) => a + b, 0) / nonEmptyLengths.length
        );

  return {
    totalReflections: rows.length,
    daySpan: { first, last },
    longestGap,
    // Streak only meaningful when we have 2+ reflections
    consecutiveStreak: rows.length >= 2 ? longestStreak : 0,
    avgNoteLength,
  };
}

function calcEvolution(rows: ReflectionForAnalysis[]): EvolutionSignals {
  const sorted = sortByDay(rows);

  // Pivots: day-to-day sentiment jumps of PIVOT_DELTA_THRESHOLD or more
  const pivotDays: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = normalizeSentiment(sorted[i - 1].ai_sentiment);
    const curr = normalizeSentiment(sorted[i].ai_sentiment);
    if (prev === null || curr === null) continue;

    const delta = Math.abs(SENTIMENT_SCORE[curr] - SENTIMENT_SCORE[prev]);
    if (delta >= PIVOT_DELTA_THRESHOLD) {
      pivotDays.push(sorted[i].day);
    }
  }

  // Depth trend: are later notes longer or shorter?
  const depthTrend = computeDepthTrend(sorted);

  return { pivotDays, depthTrend };
}

function computeDepthTrend(sortedRows: ReflectionForAnalysis[]): DepthTrend {
  const lengths = sortedRows
    .map((r) => (r.note ?? "").trim().length)
    .filter((n) => n > 0);

  if (lengths.length < 3) return "unknown";

  const half = Math.floor(lengths.length / 2);
  const avgFirst = avg(lengths.slice(0, half));
  const avgSecond = avg(lengths.slice(half));

  // Relative change ≥ 25% is meaningful
  if (avgFirst === 0) return "unknown";
  const ratio = (avgSecond - avgFirst) / avgFirst;

  if (ratio >= 0.25) return "deepening";
  if (ratio <= -0.25) return "thinning";
  return "stable";
}

function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function assessHealth(
  sentiment: SentimentStats,
  cadence: CadenceStats,
  themes: ThemeFrequency[]
): HealthAssessment {
  const total = cadence.totalReflections;

  // Too few to classify
  if (total === 0) {
    return { label: "unknown", confidence: 0 };
  }
  if (total < 3) {
    return { label: "new", confidence: 0.3 };
  }

  const classifiedCount =
    sentiment.distribution.resistant +
    sentiment.distribution.neutral +
    sentiment.distribution.open;

  // No AI signal at all
  if (classifiedCount === 0) {
    // Check if the user writes very short notes — signal of silent_doer
    if (cadence.avgNoteLength > 0 && cadence.avgNoteLength < 30) {
      return { label: "silent_doer", confidence: 0.5 };
    }
    return { label: "unknown", confidence: 0.2 };
  }

  // Silent doer — writes often but very short
  if (total >= 4 && cadence.avgNoteLength > 0 && cadence.avgNoteLength < 25) {
    return { label: "silent_doer", confidence: 0.65 };
  }

  // Awakening — trajectory clearly opening
  if (sentiment.trajectory === "opening") {
    return { label: "awakening", confidence: clampConfidence(0.6 + total * 0.03) };
  }

  // Stuck — mostly resistant AND low theme variety
  const resistantRatio = sentiment.distribution.resistant / classifiedCount;
  if (resistantRatio >= 0.6 && themes.length <= 2) {
    return { label: "stuck", confidence: clampConfidence(0.55 + resistantRatio * 0.3) };
  }

  // Flowing — mostly open
  const openRatio = sentiment.distribution.open / classifiedCount;
  if (openRatio >= 0.6) {
    return { label: "flowing", confidence: clampConfidence(0.55 + openRatio * 0.3) };
  }

  // Mixed — balanced distribution
  return { label: "mixed", confidence: 0.5 };
}

function clampConfidence(n: number): number {
  return Math.max(0, Math.min(1, roundTo(n, 2)));
}

function roundTo(n: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Serialize a PatternInsight into a short Arabic block suitable for
 * injecting into the AI prompt as "background signals".
 *
 * Rules:
 *   - Returns empty string when the insight is too thin to say
 *     anything meaningful (sampleSize < 3 OR health === "unknown")
 *     so the analyzer falls back to memory-only or single-shot mode.
 *   - Never leaks raw numbers or probabilities — translates
 *     everything to Arabic labels.
 *   - Caps at ~300 chars so memory + pattern + current text still
 *     fit comfortably in the model's context window.
 *   - Pure: same input → same output, no IO.
 */
export function compressPatternToPromptBlock(insight: PatternInsight): string {
  if (insight.sampleSize < 3) return "";
  if (insight.health.label === "unknown" || insight.health.label === "new") {
    return "";
  }

  const lines: string[] = [
    "— إشارات من رحلته السابقة (للخلفيّة فقط، لا تُشر إليها بشكل مباشر) —",
  ];

  // Trajectory
  const trajectoryAr = arabicTrajectory(insight.sentiment.trajectory);
  if (trajectoryAr) {
    lines.push(`اتّجاه المشاعر: ${trajectoryAr}`);
  }

  // Health label
  const healthAr = arabicHealth(insight.health.label);
  if (healthAr) {
    const confidencePct = Math.round(insight.health.confidence * 100);
    lines.push(`الحالة العامّة: ${healthAr} (ثقة ${confidencePct}%)`);
  }

  // Top 3 recurring themes
  const topThemes = insight.recurringThemes.slice(0, 3);
  if (topThemes.length > 0) {
    const themeText = topThemes
      .map((t) => (t.count > 1 ? `${t.theme} (×${t.count})` : t.theme))
      .join("، ");
    lines.push(`مواضيع متكرّرة: ${themeText}`);
  }

  // Pivot days
  if (insight.evolution.pivotDays.length > 0) {
    const pivotDaysText = insight.evolution.pivotDays
      .slice(0, 3)
      .map((d) => `يوم ${d}`)
      .join("، ");
    lines.push(`نقاط تحوّل سابقة: ${pivotDaysText}`);
  }

  // Cadence signal
  if (insight.cadence.longestGap >= 3) {
    lines.push(`أطول انقطاع: ${insight.cadence.longestGap} أيام`);
  }

  lines.push("— نهاية الإشارات —");

  let block = lines.join("\n");

  // Hard cap
  const MAX_CHARS = 400;
  if (block.length > MAX_CHARS) {
    block = block.slice(0, MAX_CHARS).trimEnd() + "…";
  }

  return block;
}

function arabicTrajectory(t: SentimentTrajectory): string {
  switch (t) {
    case "opening":
      return "ميل نحو الانفتاح";
    case "deepening":
      return "ميل نحو الثقل";
    case "oscillating":
      return "تذبذب وتقلّب";
    case "stable":
      return "استقرار";
    case "unknown":
    default:
      return "";
  }
}

function arabicHealth(label: HealthLabel): string {
  switch (label) {
    case "awakening":
      return "استيقاظ";
    case "flowing":
      return "انسياب";
    case "stuck":
      return "توقّف";
    case "mixed":
      return "متشابك";
    case "silent_doer":
      return "فاعلٌ صامت";
    case "new":
    case "unknown":
    default:
      return "";
  }
}

/**
 * Analyze a batch of reflections and return a structured PatternInsight.
 *
 * The function is pure: same input → same output. Handles empty input
 * and null fields gracefully. Never throws.
 *
 * Recommended usage: feed it 5-28 recent reflections. Very small
 * samples (< 3) are detected and reflected in `health.label = "new"`.
 */
export function analyzePatterns(
  reflections: ReflectionForAnalysis[]
): PatternInsight {
  // Defensive: filter out any rows with invalid day
  const valid = (reflections ?? []).filter(
    (r) => Number.isInteger(r.day) && r.day >= 1 && r.day <= 28
  );

  const sentiment = calcSentimentStats(valid);
  const cadence = calcCadence(valid);
  const themes = rankThemes(valid);
  const evolution = calcEvolution(valid);
  const health = assessHealth(sentiment, cadence, themes);

  return {
    sampleSize: valid.length,
    sentiment,
    recurringThemes: themes,
    cadence,
    evolution,
    health,
  };
}
