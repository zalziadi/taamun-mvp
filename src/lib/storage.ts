import type { DayEntry, ProgressState } from "./types";
import type { Phase } from "./types";
import { APP_SLUG } from "@/lib/appConfig";

const STORAGE_KEY = `${APP_SLUG}.progress.v1`;
const ADMIN_KEY = `${APP_SLUG}.admin`;

/** Returns true only if localStorage has app admin flag enabled. */
export function isAdminEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ADMIN_KEY) === "1";
}

const PHASES: Phase[] = ["shadow", "awareness", "contemplation"];

function isValidPhase(v: unknown): v is Phase {
  return typeof v === "string" && PHASES.includes(v as Phase);
}

function isValidAnsweredAtISO(v: unknown): boolean {
  if (typeof v !== "string") return false;
  const d = new Date(v);
  return !isNaN(d.getTime());
}

function normalizeEntry(raw: unknown): DayEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const dayId = typeof o.dayId === "number" ? o.dayId : parseInt(String(o.dayId), 10);
  if (isNaN(dayId) || dayId < 0 || dayId > 28) return null;
  if (!isValidPhase(o.phase)) return null;
  if (!isValidAnsweredAtISO(o.answeredAtISO)) return null;
  const note = typeof o.note === "string" ? o.note : undefined;
  return {
    dayId,
    phase: o.phase as Phase,
    note: note?.trim() || undefined,
    answeredAtISO: o.answeredAtISO as string,
  };
}

function normalizeEntries(raw: unknown): Record<string, DayEntry> {
  if (!raw || typeof raw !== "object") return {};
  const entries: Record<string, DayEntry> = {};
  const obj = raw as Record<string, unknown>;
  for (const [, v] of Object.entries(obj)) {
    const entry = normalizeEntry(v);
    if (entry) entries[String(entry.dayId)] = entry;
  }
  return entries;
}

function resetAndSave(): ProgressState {
  const state: ProgressState = { version: 1, entries: {} };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }
  return state;
}

const emptyState: ProgressState = {
  version: 1,
  entries: {},
};

function load(): ProgressState {
  if (typeof window === "undefined") return emptyState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return resetAndSave();
    if (parsed.version !== 1) return resetAndSave();
    const entries = normalizeEntries(parsed.entries);
    const lastSavedUtcDate =
      typeof parsed.lastSavedUtcDate === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(parsed.lastSavedUtcDate)
        ? parsed.lastSavedUtcDate
        : undefined;
    return {
      version: 1,
      entries,
      lastSavedUtcDate,
    };
  } catch {
    return resetAndSave();
  }
}

function save(state: ProgressState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function getTodayUtcDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function loadProgress(): ProgressState {
  return load();
}

export function saveProgress(state: ProgressState): void {
  save(state);
}

export function upsertEntry(entry: DayEntry): ProgressState {
  const state = load();
  const normalized = normalizeEntry(entry);
  if (!normalized) return state;
  const isScanSession = normalized.dayId === 0;
  const next: ProgressState = {
    ...state,
    entries: {
      ...state.entries,
      [String(normalized.dayId)]: normalized,
    },
    lastSavedUtcDate: isScanSession ? state.lastSavedUtcDate : getTodayUtcDateKey(),
  };
  save(next);
  return next;
}

export function clearProgress(): ProgressState {
  const state: ProgressState = { version: 1, entries: {} };
  save(state);
  return state;
}
