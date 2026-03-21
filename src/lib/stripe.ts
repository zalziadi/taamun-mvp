import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  _stripe = new Stripe(key, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
  return _stripe;
}

export type CheckoutTier = "basic" | "full" | "support";

export function priceIdForTier(tier: CheckoutTier): string | undefined {
  const map: Record<CheckoutTier, string | undefined> = {
    basic: process.env.STRIPE_PRICE_BASIC,
    full: process.env.STRIPE_PRICE_FULL,
    support: process.env.STRIPE_PRICE_SUPPORT,
  };
  return map[tier];
}
