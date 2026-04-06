import { computeCalendarDay } from "./calendarDay";

const TOTAL_DAYS = 28;

export type ProgressMode = "normal" | "catch_up" | "intervention" | "recovery_boost";

export interface ProgressState {
  currentDay: number;
  storedDay: number;
  calendarDay: number;
  drift: number;
  mode: ProgressMode;
  completedDays: number[];
  missedDays: number[];
  streak: number;
  completionRate: number;
}

export interface CatchUpOption {
  type: "continue" | "review" | "summary";
  label: string;
  days?: number[];
}

export interface CatchUpData {
  message: string;
  missedDays: number[];
  options: CatchUpOption[];
}

function computeStreak(completedDays: number[], currentDay: number): number {
  if (!completedDays.length) return 0;
  const set = new Set(completedDays);
  let streak = 0;
  for (let d = currentDay; d >= 1; d--) {
    if (set.has(d)) streak++;
    else break;
  }
  return streak;
}

function computeMissedDays(completedDays: number[], currentDay: number): number[] {
  const set = new Set(completedDays);
  const missed: number[] = [];
  for (let d = 1; d < currentDay; d++) {
    if (!set.has(d)) missed.push(d);
  }
  return missed;
}

function deriveMode(drift: number, hasRecentRecovery: boolean): ProgressMode {
  if (hasRecentRecovery && drift > 0) return "recovery_boost";
  if (drift <= 2) return "normal";
  if (drift <= 5) return "catch_up";
  return "intervention";
}

export function buildProgressState(
  storedDay: number,
  completedDays: number[],
  subscriptionStartDate: string | null | undefined,
  hasRecentRecovery = false,
  now?: Date
): ProgressState {
  const calendarDay = computeCalendarDay(subscriptionStartDate, now);
  const currentDay = Math.max(storedDay, calendarDay);
  const drift = Math.max(0, calendarDay - storedDay);
  const missedDays = computeMissedDays(completedDays, currentDay);
  const streak = computeStreak(completedDays, currentDay);
  const completionRate = currentDay > 0 ? completedDays.length / currentDay : 0;

  return {
    currentDay,
    storedDay,
    calendarDay,
    drift,
    mode: deriveMode(drift, hasRecentRecovery),
    completedDays,
    missedDays,
    streak,
    completionRate: Math.round(completionRate * 100) / 100,
  };
}

export function buildCatchUpData(state: ProgressState): CatchUpData | null {
  if (state.mode === "normal") return null;

  const options: CatchUpOption[] = [
    { type: "continue", label: `تابع من اليوم ${state.currentDay}` },
  ];

  if (state.missedDays.length > 0) {
    options.push({
      type: "review",
      label: "راجع الأيام الفائتة",
      days: state.missedDays,
    });
  }

  if (state.missedDays.length >= 3) {
    options.push({ type: "summary", label: "ملخص ذكي للأيام الفائتة" });
  }

  const messages: Record<string, string> = {
    catch_up: `فاتتك ${state.missedDays.length} أيام — لكن الرحلة ما توقفت`,
    intervention: `مرّت ${state.drift} أيام. الرحلة تنتظرك — خذ لحظة وقرر كيف تكمل`,
    recovery_boost: `رجعت بقوة! خلنا نبني على هذا الزخم`,
  };

  return {
    message: messages[state.mode] ?? "",
    missedDays: state.missedDays,
    options,
  };
}
