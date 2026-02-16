export type ValidationError = "not_found" | "expired" | "used" | "invalid_format";

const CODE_PATTERN = /^TAAMUN-[A-Z0-9]{4}$/i;

function getValidCodes(): Set<string> {
  const raw = process.env.ACTIVATION_CODES ?? "";
  if (!raw.trim()) return new Set();
  return new Set(raw.split(",").map((c) => c.trim().toUpperCase()));
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
