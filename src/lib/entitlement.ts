import crypto from "crypto";
import { ENTITLEMENT_COOKIE_NAME } from "@/lib/entitlement-constants";

function base64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sign(payload: string, secret: string) {
  const sig = crypto.createHmac("sha256", secret).update(payload).digest();
  return base64url(sig);
}

export function makeEntitlementToken(daysValid = 45) {
  const secret = process.env.ENTITLEMENT_SECRET;
  if (!secret) throw new Error("ENTITLEMENT_SECRET is missing");

  const exp = Date.now() + daysValid * 24 * 60 * 60 * 1000;
  const payload = JSON.stringify({ exp });
  const payloadB64 = base64url(Buffer.from(payload, "utf8"));
  const sig = sign(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

export function verifyEntitlementToken(token: string | undefined) {
  if (!token) return { ok: false as const, reason: "missing" as const };

  const secret = process.env.ENTITLEMENT_SECRET;
  if (!secret) {
    return { ok: false as const, reason: "server_misconfig" as const };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { ok: false as const, reason: "bad_format" as const };
  }

  const [payloadB64, sig] = parts;
  const expected = sign(payloadB64, secret);

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false as const, reason: "bad_sig" as const };
  }

  let payload: { exp?: number };
  try {
    const raw = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    payload = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    return { ok: false as const, reason: "bad_payload" as const };
  }

  if (!payload?.exp || typeof payload.exp !== "number") {
    return { ok: false as const, reason: "bad_payload" as const };
  }

  if (Date.now() > payload.exp) {
    return { ok: false as const, reason: "expired" as const };
  }

  return { ok: true as const };
}

export { ENTITLEMENT_COOKIE_NAME };
