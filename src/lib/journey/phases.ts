/**
 * Phase metadata — labels, subtitles, ranges.
 * The type `JourneyPhase` and `phaseFromDay` live in ./memory.ts (V9).
 * This file only adds presentation metadata on top.
 */

import type { JourneyPhase } from "./memory";

export const TOTAL_DAYS = 28;

export const PHASE_RANGES: Record<JourneyPhase, { start: number; end: number }> = {
  entry: { start: 1, end: 7 },
  deepening: { start: 8, end: 14 },
  integrating: { start: 15, end: 21 },
  mastery: { start: 22, end: 28 },
};

export const PHASE_LABEL_AR: Record<JourneyPhase, string> = {
  entry: "البداية",
  deepening: "التعمّق",
  integrating: "الاندماج",
  mastery: "الإتقان",
};

export const PHASE_SUBTITLE_AR: Record<JourneyPhase, string> = {
  entry: "لحظة السؤال — تبدأ الرحلة حين تسأل.",
  deepening: "لحظة الملاحظة — ترى ما لم تكن تراه.",
  integrating: "لحظة التطبيق — يصبح الوعي حركة.",
  mastery: "لحظة العيش — ما تعلّمته يصبح أنت.",
};

export function phaseOrder(): JourneyPhase[] {
  return ["entry", "deepening", "integrating", "mastery"];
}

export function daysInPhase(phase: JourneyPhase): number[] {
  const { start, end } = PHASE_RANGES[phase];
  const out: number[] = [];
  for (let d = start; d <= end; d += 1) out.push(d);
  return out;
}
