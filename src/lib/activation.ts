export type ValidationError = "not_found" | "expired" | "used" | "invalid_format";

const CODE_PATTERN = /^TAAMUN-[A-Z0-9]{4}$/i;

function parseCodes(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
}

// Exported for admin codes page
export const BASE_CODES = parseCodes(process.env.ACTIVATION_CODES).length
  ? parseCodes(process.env.ACTIVATION_CODES)
  : ["TAAMUN-DEMO", "TAAMUN-1234"];

// Optional plan codes; kept separate for admin display
export const PLAN_820_CODES = parseCodes(process.env.ACTIVATION_CODES_820);

function getValidCodes(): Set<string> {
  return new Set([...BASE_CODES, ...PLAN_820_CODES]);
}

export function validateCode(code: unknown): { ok: true } | { ok: false; error: ValidationError } {
  if (typeof code !== "string") {
    return { ok: false, error: "invalid_format" };
  }

  const trimmed = code.trim();
  if (!trimmed) {
    return { ok: false, error: "invalid_format" };
  }

  if (!CODE_PATTERN.test(trimmed)) {
    return { ok: false, error: "invalid_format" };
  }

  const validCodes = getValidCodes();
  if (!validCodes.has(trimmed.toUpperCase())) {
    return { ok: false, error: "not_found" };
  }

  return { ok: true };
}
