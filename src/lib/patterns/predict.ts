/**
 * Predictive Decision Trigger
 *
 * Triggers decision BEFORE repetition by detecting hesitation signals
 * in patterns + recent reflections.
 *
 * Returns a probability 0-1 that the user needs decision support now.
 */

const HESITATION_KEYWORDS = ["تردد", "حيرة", "تأجيل", "مقاومة", "توقف", "تأخير"];

export interface PredictInput {
  patterns: string[];
  recentEntries: string[];
  commitmentScore?: number;
}

export interface PredictionResult {
  probability: number;
  signals: string[];      // why we predict (for transparency)
}

function patternsContainHesitation(patterns: string[]): { yes: boolean; matched: string[] } {
  const matched: string[] = [];
  for (const pattern of patterns) {
    for (const kw of HESITATION_KEYWORDS) {
      if (pattern.includes(kw) && !matched.includes(kw)) {
        matched.push(kw);
      }
    }
  }
  return { yes: matched.length > 0, matched };
}

function entriesRepeatHesitation(entries: string[]): { repeated: boolean; count: number } {
  if (entries.length === 0) return { repeated: false, count: 0 };

  // Check last 3 entries
  const recent = entries.slice(-3);
  let count = 0;
  for (const entry of recent) {
    const lower = entry.toLowerCase();
    if (HESITATION_KEYWORDS.some((kw) => lower.includes(kw))) {
      count++;
    }
  }
  return { repeated: count >= 2, count };
}

/**
 * Returns probability 0-1 that user needs decision support.
 * Returns just the number for backward compatibility with caller spec.
 */
export function predictDecisionNeed(input: PredictInput): number {
  let probability = 0;

  const patternCheck = patternsContainHesitation(input.patterns);
  if (patternCheck.yes) probability += 0.4;

  const entryCheck = entriesRepeatHesitation(input.recentEntries);
  if (entryCheck.repeated) probability += 0.3;

  const commitment = input.commitmentScore ?? 100;
  if (commitment < 40) probability += 0.2;

  // Bonus signal: pattern + entry repeat (compounding evidence)
  if (patternCheck.yes && entryCheck.repeated) probability += 0.1;

  return Math.max(0, Math.min(1, Math.round(probability * 100) / 100));
}

/**
 * Detailed version returning signals for orchestrator transparency.
 */
export function predictDecisionNeedDetailed(input: PredictInput): PredictionResult {
  const signals: string[] = [];
  let probability = 0;

  const patternCheck = patternsContainHesitation(input.patterns);
  if (patternCheck.yes) {
    probability += 0.4;
    signals.push(`أنماط تردد: ${patternCheck.matched.join("، ")}`);
  }

  const entryCheck = entriesRepeatHesitation(input.recentEntries);
  if (entryCheck.repeated) {
    probability += 0.3;
    signals.push(`تكرار في ${entryCheck.count} من آخر التأملات`);
  }

  const commitment = input.commitmentScore ?? 100;
  if (commitment < 40) {
    probability += 0.2;
    signals.push(`الالتزام منخفض (${commitment})`);
  }

  if (patternCheck.yes && entryCheck.repeated) {
    probability += 0.1;
    signals.push("الأدلة تتقاطع — إشارة قوية");
  }

  return {
    probability: Math.max(0, Math.min(1, Math.round(probability * 100) / 100)),
    signals,
  };
}

// Export for testing
export { patternsContainHesitation, entriesRepeatHesitation, HESITATION_KEYWORDS };
