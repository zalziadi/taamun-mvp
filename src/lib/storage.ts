import type { DayEntry, ProgressState } from "./types";
import type { Entitlement, Phase } from "./types";

const STORAGE_KEY = "taamun.progress.v1";
const ADMIN_KEY = "taamun.admin";
const ENTITLEMENT_KEY = "taamun.entitlement.v1";
const PLAN_820_KEY = "taamun.plan820.v1";
export const USED_CODES_KEY = "taamun.activation.used.v1";
export const SCAN_AYAH_KEY = "tmn.scan.ayahText.v1";

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase();
}

function loadStringArray(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string").map(normalizeCode);
  } catch {
    return [];
  }
}

function saveStringArray(key: string, arr: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

export function getUsedCodes(): string[] {
  return loadStringArray(USED_CODES_KEY);
}

export function isCodeUsed(code: string): boolean {
  const normalized = normalizeCode(code);
  return getUsedCodes().includes(normalized);
}

export function markCodeUsed(code: string): void {
  const normalized = normalizeCode(code);
  const used = getUsedCodes();
  if (used.includes(normalized)) return;
  saveStringArray(USED_CODES_KEY, [...used, normalized]);
}

export function clearUsedCodes(): void {
  saveStringArray(USED_CODES_KEY, []);
}

/** Returns true only if localStorage has taamun.admin=1 (admin flag for reset, etc.) */
export function isAdminEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ADMIN_KEY) === "1";
}

export function getEntitlement(): Entitlement {
  if (typeof window === "undefined") return "none";
  const v = window.localStorage.getItem(ENTITLEMENT_KEY);
  if (v === "pending" || v === "active") return v;
  return "none";
}

export function setEntitlement(v: Entitlement): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ENTITLEMENT_KEY, v);
  } catch {
    // ignore
  }
}

/** Returns true if admin OR entitlement is pending or active */
export function isEntitled(): boolean {
  if (isAdminEnabled()) return true;
  const e = getEntitlement();
  return e === "pending" || e === "active";
}

/** Returns true if user has plan 820 (Ayah Scan). Admin always has access. */
export function hasPlan820(): boolean {
  if (isAdminEnabled()) return true;
  if (!isEntitled()) return false;
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(PLAN_820_KEY) === "1";
}

/** Grant plan 820 access (e.g. after purchase). */
export function setPlan820(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PLAN_820_KEY, enabled ? "1" : "0");
  } catch {
    // ignore
  }
}

export function getScanAyahText(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(SCAN_AYAH_KEY) ?? "";
}

export function setScanAyahText(text: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SCAN_AYAH_KEY, text);
  } catch {
    // ignore
  }
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
