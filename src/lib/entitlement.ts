/**
 * نظام الـ Entitlement — HMAC-SHA256
 *
 * - الرمز: HMAC-SHA256 مُشفّر، يُخزَّن في cookie باسم `taamun_entitled`
 * - السر: متغير بيئة `ENTITLEMENT_SECRET` (مطلوب على الخادم)
 * - أنواع الأكواد: باقة 280 (TAAMUN-XXX) أو باقة 820 (TAAMUN-820-XXX)
 */
import { createHmac } from "crypto";

const COOKIE_NAME = "taamun_entitled";

function getSecret(): string {
  const secret = process.env.ENTITLEMENT_SECRET;
  if (!secret) throw new Error("ENTITLEMENT_SECRET is not set");
  return secret;
}

/** أنشئ token مُشفّر للمستخدم — يتضمن تاريخ الانتهاء
 *
 * Delimiter changed from `:` to `|` in v1.4 to fix ISO-timestamp colon-split bug
 * discovered during v1.2 Phase 9 research. ISO strings like `2026-04-21T12:34:56.789Z`
 * contain colons which broke the parser. Pipe character `|` appears in neither
 * UUIDs, tier enums, epoch ms, nor ISO timestamps — safe delimiter.
 *
 * Old `:`-delimited tokens are still parsed (backward compat) but treated as
 * expired to force re-issue with the new format.
 */
export function makeEntitlementToken(userId: string, tier: string, expiresAt?: string): string {
  const exp = expiresAt ?? "";
  const payload = `${userId}|${tier}|${Date.now()}|${exp}`;
  const hmac = createHmac("sha256", getSecret());
  hmac.update(payload);
  const signature = hmac.digest("hex");
  const raw = `${payload}|${signature}`;
  return Buffer.from(raw).toString("base64");
}

/** تحقّق من صلاحية الـ token — يرفض التوكن المنتهي */
export function verifyEntitlementToken(token: string): {
  valid: boolean;
  userId?: string;
  tier?: string;
  expiresAt?: string;
  expired?: boolean;
} {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");

    // Detect delimiter. New tokens use `|`; old pre-v1.4 tokens use `:`.
    // Old tokens are treated as expired to force re-issue with new format.
    if (!decoded.includes("|")) {
      // Old format — split on `:`, treat as expired.
      // This handles both 4-part and 5-part old tokens without double-parsing.
      const oldParts = decoded.split(":");
      if (oldParts.length < 4) return { valid: false };
      const userId = oldParts[0];
      const tier = oldParts[1];
      return { valid: false, userId, tier, expired: true };
    }

    const parts = decoded.split("|");
    // format: userId|tier|timestamp|expiresAt|signature
    if (parts.length !== 5) return { valid: false };

    const [userId, tier, timestamp, expiresAt, signature] = parts;

    const payload = `${userId}|${tier}|${timestamp}|${expiresAt}`;
    const hmac = createHmac("sha256", getSecret());
    hmac.update(payload);
    const expected = hmac.digest("hex");
    if (signature !== expected) return { valid: false };

    // Check expiry (expiresAt is ISO string with colons — safely preserved now)
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return { valid: false, userId, tier, expiresAt, expired: true };
    }

    return { valid: true, userId, tier, expiresAt };
  } catch {
    return { valid: false };
  }
}

/** اسم الكوكي */
export { COOKIE_NAME };
