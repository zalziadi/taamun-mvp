import type { DayEntry, Phase } from "./types";

export const PHASE_POINTS: Record<Phase, number> = {
  shadow: 1,
  awareness: 2,
  contemplation: 3,
};

export interface Totals {
  counts: Record<Phase, number>;
  points: Record<Phase, number>;
  totalDays: number;
}

export function computeTotals(entries: Record<string, DayEntry>): Totals {
  const counts: Record<Phase, number> = {
    shadow: 0,
    awareness: 0,
    contemplation: 0,
  };
  const points: Record<Phase, number> = {
    shadow: 0,
    awareness: 0,
    contemplation: 0,
  };
  for (const e of Object.values(entries)) {
    counts[e.phase]++;
    points[e.phase] += PHASE_POINTS[e.phase];
  }
  return {
    counts,
    points,
    totalDays: Object.keys(entries).length,
  };
}

const PHASE_ORDER: Phase[] = ["shadow", "awareness", "contemplation"];

/** Tie-break: taamun > idrak > shadow */
function phaseRank(a: Phase, b: Phase): number {
  return PHASE_ORDER.indexOf(b) - PHASE_ORDER.indexOf(a);
}

export function computeDominantStage(
  counts: Record<Phase, number>,
  points: Record<Phase, number>
): Phase | null {
  const total = counts.shadow + counts.awareness + counts.contemplation;
  if (total === 0) return null;

  const byCount = [...PHASE_ORDER].sort((a, b) => counts[b] - counts[a]);
  const maxCount = counts[byCount[0]];
  const tiedByCount = byCount.filter((p) => counts[p] === maxCount);

  if (tiedByCount.length === 1) return tiedByCount[0];

  const byPoints = [...tiedByCount].sort((a, b) => points[b] - points[a]);
  const maxPoints = points[byPoints[0]];
  const tiedByPoints = byPoints.filter((p) => points[p] === maxPoints);

  if (tiedByPoints.length === 1) return tiedByPoints[0];

  return tiedByPoints.sort(phaseRank)[0];
}

const INSIGHTS: Record<Phase, string> = {
  shadow:
    "أنت في مرحلة المراقبة: ركّز على رؤية الواقع بدون تبرير.",
  awareness:
    "أنت في مرحلة الإدراك: ابحث عن المعنى الأعلى والباب التالي.",
  contemplation:
    "أنت في مرحلة التمعّن: ثبّت النظام وكرّر السلوك، النتائج تتبعك.",
};

export function getDailyInsight(phase: Phase): string {
  return INSIGHTS[phase];
}
