import taamunDays from "@/content/taamun-28days.json";
import { getDayIndexForToday } from "@/lib/ramadan-28";

export interface TaamunDailyEntry {
  day: number;
  week: number;
  theme: string;
  title: string;
  verse: {
    arabic: string;
    surah: string;
    ayah: number;
  };
  question: string;
  exercise: string;
  whisper: {
    text: string;
    source: string;
  };
}

const DAYS = (taamunDays.days as TaamunDailyEntry[]) ?? [];

export function getTaamunDailyByDay(day: number): TaamunDailyEntry | undefined {
  return DAYS.find((entry) => entry.day === day);
}

export function getTodayTaamunDaily(): TaamunDailyEntry {
  const today = getDayIndexForToday();
  return getTaamunDailyByDay(today) ?? DAYS[0];
}

export const TAAMUN_DAYS_COUNT = DAYS.length;
