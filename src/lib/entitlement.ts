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

/** أنشئ token مُشفّر للمستخدم */
export function makeEntitlementToken(userId: string, tier: string): string {
  const payload = `${userId}:${tier}:${Date.now()}`;
  const hmac = createHmac("sha256", getSecret());
  hmac.update(payload);
  const signature = hmac.digest("hex");
  // token = base64(payload:signature)
  const raw = `${payload}:${signature}`;
  return Buffer.from(raw).toString("base64");
}

/** تحقّق من صلاحية الـ token */
export function verifyEntitlementToken(token: string): {
  valid: boolean;
  userId?: string;
  tier?: string;
} {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length < 4) return { valid: false };
    const [userId, tier, timestamp, signature] = [
      parts[0],
      parts[1],
      parts[2],
      parts.slice(3).join(":"),
    ];
    const payload = `${userId}:${tier}:${timestamp}`;
    const hmac = createHmac("sha256", getSecret());
    hmac.update(payload);
    const expected = hmac.digest("hex");
    if (signature !== expected) return { valid: false };
    return { valid: true, userId, tier };
  } catch {
    return { valid: false };
  }
}

/** اسم الكوكي */
export { COOKIE_NAME };
