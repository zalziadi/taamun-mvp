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

/** أنشئ token مُشفّر للمستخدم — يتضمن تاريخ الانتهاء */
export function makeEntitlementToken(userId: string, tier: string, expiresAt?: string): string {
  const exp = expiresAt ?? "";
  const payload = `${userId}:${tier}:${Date.now()}:${exp}`;
  const hmac = createHmac("sha256", getSecret());
  hmac.update(payload);
  const signature = hmac.digest("hex");
  const raw = `${payload}:${signature}`;
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
    const parts = decoded.split(":");
    // format: userId:tier:timestamp:expiresAt:signature
    if (parts.length < 5) {
      // Backward compat: old tokens without expiresAt (4 parts)
      if (parts.length === 4) {
        const [userId, tier, timestamp, signature] = parts;
        const payload = `${userId}:${tier}:${timestamp}`;
        const hmac = createHmac("sha256", getSecret());
        hmac.update(payload);
        const expected = hmac.digest("hex");
        if (signature !== expected) return { valid: false };
        // Old token without expiry — treat as expired to force re-login
        return { valid: false, expired: true };
      }
      return { valid: false };
    }

    const userId = parts[0];
    const tier = parts[1];
    const timestamp = parts[2];
    const expiresAt = parts[3];
    const signature = parts.slice(4).join(":");

    const payload = `${userId}:${tier}:${timestamp}:${expiresAt}`;
    const hmac = createHmac("sha256", getSecret());
    hmac.update(payload);
    const expected = hmac.digest("hex");
    if (signature !== expected) return { valid: false };

    // Check expiry
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
