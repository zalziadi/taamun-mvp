import { isCodeUsed } from "./storage";
import { normalizeCode } from "./storage";

const DYNAMIC_CODES_KEY = "taamun.activation.codes.v1";

/** Static valid codes */
export const VALID_CODES: string[] = [
  "TAAMUN001",
  "TAAMUN002",
  "TAAMUN003",
  "TAAMUN004",
  "TAAMUN005",
  "TAAMUN006",
  "TAAMUN007",
  "TAAMUN008",
  "TAAMUN009",
  "TAAMUN010",
];

function loadDynamicCodes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DYNAMIC_CODES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string").map(normalizeCode);
  } catch {
    return [];
  }
}

function saveDynamicCodes(arr: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DYNAMIC_CODES_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

export function getDynamicCodes(): string[] {
  return loadDynamicCodes();
}

export function addDynamicCode(code: string): void {
  const normalized = normalizeCode(code);
  const current = loadDynamicCodes();
  if (current.includes(normalized)) return;
  saveDynamicCodes([...current, normalized]);
}

export function clearDynamicCodes(): void {
  saveDynamicCodes([]);
}

function getAllValidCodesSet(): Set<string> {
  const dynamic = getDynamicCodes();
  return new Set([...VALID_CODES, ...dynamic]);
}

/** Returns true if code is valid (in static or dynamic) AND not yet used */
export function validateCode(code: string): boolean {
  const normalized = normalizeCode(code);
  if (!getAllValidCodesSet().has(normalized)) return false;
  if (isCodeUsed(normalized)) return false;
  return true;
}

/** Returns true if code is in valid list (used or not) */
export function isValidCode(code: string): boolean {
  const normalized = normalizeCode(code);
  return getAllValidCodesSet().has(normalized);
}

/** All codes (static + dynamic), deduplicated, sorted */
export function getAllCodes(): string[] {
  const set = getAllValidCodesSet();
  return [...set].sort();
}

/** Generate new code: TAAMUN-YYYYMMDD-XXXX */
export function generateNewCode(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `TAAMUN-${date}-${suffix}`;
}
