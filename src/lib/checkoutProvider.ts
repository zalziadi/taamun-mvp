/**
 * أي بوابة دفع تُستخدم في `/api/checkout`.
 * - `tap`: Tap — يفضّل عند وجود `TAP_SECRET_KEY` أو `PAYMENT_PROVIDER=tap`
 * - `stripe`: عند `PAYMENT_PROVIDER=stripe` أو عند عدم إعداد Tap
 */
export type CheckoutProvider = "tap" | "stripe";

export function getCheckoutProvider(): CheckoutProvider {
  const explicit = process.env.PAYMENT_PROVIDER?.toLowerCase();
  if (explicit === "tap") return "tap";
  if (explicit === "stripe") return "stripe";
  // إن وُجد مفتاح Tap نفضّل مسار Tap (حتى لو ناقصة المبالغ — نُرجع خطأ واضح من الـ API)
  if (process.env.TAP_SECRET_KEY) return "tap";
  if (process.env.TAP_AMOUNT_BASIC && process.env.TAP_AMOUNT_FULL) return "tap";
  return "stripe";
}
