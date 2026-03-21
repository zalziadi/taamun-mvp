import crypto from "crypto";
import { formatTapAmount } from "@/lib/tap";

/** مطابقة hashstring كما في وثائق Tap (Charges). */
export function verifyTapChargeWebhookHash(
  body: Record<string, unknown>,
  secret: string,
  receivedHash: string | null
): boolean {
  if (!receivedHash) return false;
  const id = String(body.id ?? "");
  const currency = String(body.currency ?? "");
  const amountNum = Number(body.amount ?? 0);
  const amount = formatTapAmount(amountNum, currency || "SAR");
  const ref = body.reference as Record<string, unknown> | undefined;
  const gateway_reference = String(ref?.gateway ?? "");
  const payment_reference = String(ref?.payment ?? "");
  const status = String(body.status ?? "");
  const tx = body.transaction as Record<string, unknown> | undefined;
  const created = String(tx?.created ?? "");
  const toBeHashedString = `x_id${id}x_amount${amount}x_currency${currency}x_gateway_reference${gateway_reference}x_payment_reference${payment_reference}x_status${status}x_created${created}`;
  const hmac = crypto.createHmac("sha256", secret).update(toBeHashedString).digest("hex");
  return hmac === receivedHash;
}
