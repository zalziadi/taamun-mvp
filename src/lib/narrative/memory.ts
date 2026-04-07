/**
 * Narrative Memory Engine
 *
 * Turns scattered usage into a continuous story.
 * Reads last N days and produces a narrative thread (Arabic).
 *
 * Example output:
 * [
 *   "قبل 5 أيام كنت مشتت",
 *   "قبل يومين بدأت تلاحظ التردد",
 *   "اليوم أنت تحسم القرار"
 * ]
 */

export interface NarrativeMemoryDay {
  day: number;
  state: string;            // "shadow" | "gift" | "best_possibility" | other
  keyEvent?: string;        // optional event description
}

export interface NarrativeMemoryInput {
  lastDays: NarrativeMemoryDay[];
}

// ── State → Arabic descriptors ──

const STATE_DESCRIPTORS: Record<string, string> = {
  shadow: "مشتت",
  gift: "تلاحظ",
  best_possibility: "تحسم القرار",
  emerging: "تبدأ بالظهور",
  deepening: "تتعمّق",
  hesitating: "تتردد",
  flow: "في تدفّق",
  recovery: "في عودة",
  breakthrough: "في اختراق",
};

function describeState(state: string): string {
  return STATE_DESCRIPTORS[state] ?? state;
}

// ── Time descriptors ──

function describeTimeAgo(daysAgo: number): string {
  if (daysAgo === 0) return "اليوم";
  if (daysAgo === 1) return "أمس";
  if (daysAgo === 2) return "قبل يومين";
  if (daysAgo <= 6) return `قبل ${daysAgo} أيام`;
  if (daysAgo <= 13) return `قبل أسبوع`;
  if (daysAgo <= 27) return `قبل ${Math.floor(daysAgo / 7)} أسابيع`;
  return `قبل أكثر من شهر`;
}

// ── Sentence Builder ──

function buildSentence(timeLabel: string, state: string, keyEvent?: string): string {
  const descriptor = describeState(state);
  const isToday = timeLabel === "اليوم";

  if (keyEvent) {
    return isToday ? `اليوم: ${keyEvent}` : `${timeLabel}: ${keyEvent}`;
  }

  if (isToday) {
    return `اليوم أنت ${descriptor}`;
  }
  return `${timeLabel} كنت ${descriptor}`;
}

// ── Main ──

export function buildNarrativeMemory(input: NarrativeMemoryInput): string[] {
  if (input.lastDays.length === 0) return [];

  // Sort ascending by day so we process oldest first
  const sorted = [...input.lastDays].sort((a, b) => a.day - b.day);
  const latestDay = sorted[sorted.length - 1].day;

  // Pick up to 3 anchors: oldest meaningful + middle shift + most recent
  const anchors: NarrativeMemoryDay[] = [];
  if (sorted.length >= 3) {
    anchors.push(sorted[0]);
    anchors.push(sorted[Math.floor(sorted.length / 2)]);
    anchors.push(sorted[sorted.length - 1]);
  } else {
    anchors.push(...sorted);
  }

  return anchors.map((entry) => {
    const daysAgo = latestDay - entry.day;
    const timeLabel = describeTimeAgo(daysAgo);
    return buildSentence(timeLabel, entry.state, entry.keyEvent);
  });
}

// Export internals for testing
export { describeState, describeTimeAgo, buildSentence, STATE_DESCRIPTORS };
