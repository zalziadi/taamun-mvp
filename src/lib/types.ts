/** Phase: shadow | awareness | contemplation */
export type Phase = "shadow" | "awareness" | "contemplation";

export interface DayEntry {
  dayId: number;
  phase: Phase;
  note?: string;
  answeredAtISO: string;
}

export interface ProgressState {
  version: 1;
  entries: Record<string, DayEntry>;
  /** UTC date key "YYYY-MM-DD" - last day user saved (daily lock) */
  lastSavedUtcDate?: string;
}
