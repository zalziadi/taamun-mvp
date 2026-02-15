import { isCodeUsed } from "./storage";
import { normalizeCode } from "./storage";

/** Code kind: base (entitlement only) or plan820 (entitlement + scan) */
export type CodeKind = "base" | "plan820";

/** Base codes: TAAMUN-001 … TAAMUN-028 */
export const BASE_CODES: string[] = Array.from({ length: 28 }, (_, i) =>
  `TAAMUN-${String(i + 1).padStart(3, "0")}`
);

/** Plan 820 codes: TAAMUN-820-001 … TAAMUN-820-010 */
export const PLAN_820_CODES: string[] = Array.from({ length: 10 }, (_, i) =>
  `TAAMUN-820-${String(i + 1).padStart(3, "0")}`
);

/** All valid codes (base + plan820) */
export const VALID_CODES: string[] = [...BASE_CODES, ...PLAN_820_CODES];

export type CodeStatus = "ok" | "used" | "invalid";

function normalizeInput(raw: string): string {
  return normalizeCode(raw).replace(/\s/g, "");
}

/** Returns code kind or null if invalid */
export function getCodeKind(code: string): CodeKind | null {
  const n = normalizeInput(code);
  if (PLAN_820_CODES.includes(n)) return "plan820";
  if (BASE_CODES.includes(n)) return "base";
  return null;
}

/** Returns: ok (valid & not used), used (valid but used on device), invalid (not in list). */
export function checkCode(code: string): CodeStatus {
  const normalized = normalizeInput(code);
  if (!VALID_CODES.includes(normalized)) return "invalid";
  if (isCodeUsed(normalized)) return "used";
  return "ok";
}

/** Returns true only if checkCode returns "ok". */
export function validateCode(code: string): boolean {
  return checkCode(code) === "ok";
}

/** Returns true if code is in fixed list (used or not). */
export function isValidCode(code: string): boolean {
  const normalized = normalizeInput(code);
  return VALID_CODES.includes(normalized);
}
