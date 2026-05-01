import type { Progress } from "./types";

export const STORAGE_KEY = "wafrah.progress.v1";

export function emptyProgress(): Progress {
  return { version: 1, startedAt: null, days: {} };
}

export function readProgress(): Progress {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.version === 1) {
      return { startedAt: null, days: {}, ...parsed } as Progress;
    }
    return emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function writeProgress(p: Progress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // quota / private mode — silently ignore
  }
}

export function isDayUnlocked(progress: Progress, dayId: number): boolean {
  if (dayId <= 1) return true;
  return progress.days[dayId - 1]?.completed === true;
}

export function completedCount(progress: Progress): number {
  return Object.values(progress.days).filter((d) => d.completed).length;
}

export function progressPercent(progress: Progress, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completedCount(progress) / total) * 100);
}

export function cn(...classes: Array<string | false | undefined | null>): string {
  return classes.filter(Boolean).join(" ");
}
