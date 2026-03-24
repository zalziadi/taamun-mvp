/**
 * Which payment gateway is used in `/api/checkout`.
 * - `salla`: Salla store — preferred when PAYMENT_PROVIDER=salla or product URLs exist
 * - `tap`: Tap — preferred when TAP_SECRET_KEY or PAYMENT_PROVIDER=tap
 * - `stripe`: when PAYMENT_PROVIDER=stripe or when Tap is not configured
 */
export type CheckoutProvider = "salla" | "tap" | "stripe";

export function getCheckoutProvider(): CheckoutProvider {
    const explicit = process.env.PAYMENT_PROVIDER?.toLowerCase();
    if (explicit === "salla") return "salla";
    if (explicit === "tap") return "tap";
    if (explicit === "stripe") return "stripe";
    if (process.env.SALLA_PRODUCT_MONTHLY || process.env.SALLA_STORE_SLUG) return "salla";
    if (process.env.TAP_SECRET_KEY) return "tap";
    if (process.env.TAP_AMOUNT_MONTHLY) return "tap";
    return "stripe";
}
