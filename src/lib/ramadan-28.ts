export interface DayData {
  dayId: number;
  verse: string;
  reference: string;
  questions: {
    shadow: string;
    awareness: string;
    contemplation: string;
  };
}

/** Ramadan first day (UTC). Format: YYYY-MM-DD. Update for real Ramadan. */
export const RAMADAN_START_DATE_UTC = "2026-02-18";

export type RamadanStatus = "before" | "active" | "after";

export interface RamadanDayInfo {
  dayIndex: number;
  status: RamadanStatus;
}

/** Returns today's Ramadan day (1..28) and status for UI messaging. */
export function getRamadanDayInfo(): RamadanDayInfo {
  const start = new Date(RAMADAN_START_DATE_UTC + "T00:00:00Z").getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - start) / (24 * 60 * 60 * 1000));

  if (diffDays < 0) {
    return { dayIndex: 1, status: "before" };
  }
  if (diffDays >= 28) {
    return { dayIndex: 28, status: "after" };
  }
  return { dayIndex: diffDays + 1, status: "active" };
}

/** Returns day index 1..28 for today. */
export function getDayIndexForToday(): number {
  return getRamadanDayInfo().dayIndex;
}

/** Placeholder seed for 28 days - replace content later */
const QUESTION_SHADOW = "ما أبرز ظلّك اليوم؟";
const QUESTION_AWARENESS = "كيف أدركت نفسك؟";
const QUESTION_CONTEMPLATION = "ما أعمق تمعّن وصلت إليه؟";

export const RAMADAN_28: DayData[] = Array.from({ length: 28 }, (_, i) => ({
  dayId: i + 1,
  verse: `آية اليوم ${i + 1} - [سيتم استبدالها لاحقاً]`,
  reference: `السورة: آية`,
  questions: {
    shadow: QUESTION_SHADOW,
    awareness: QUESTION_AWARENESS,
    contemplation: QUESTION_CONTEMPLATION,
  },
}));

export function getDayData(dayId: number): DayData | undefined {
  return RAMADAN_28.find((d) => d.dayId === dayId);
}
