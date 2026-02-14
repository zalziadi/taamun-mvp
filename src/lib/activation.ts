import { isCodeUsed } from "./storage";
import { normalizeCode } from "./storage";

/** Fixed 28 production codes — server truth, no localStorage. */
export const VALID_CODES: string[] = Array.from({ length: 28 }, (_, i) =>
  `TAAMUN-${String(i + 1).padStart(3, "0")}`
);

export type CodeStatus = "ok" | "used" | "invalid";

/** Returns: ok (valid & not used), used (valid but used on device), invalid (not in list). */
export function checkCode(code: string): CodeStatus {
  const normalized = normalizeCode(code).replace(/\s/g, "");
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
  const normalized = normalizeCode(code).replace(/\s/g, "");
  return VALID_CODES.includes(normalized);
}
