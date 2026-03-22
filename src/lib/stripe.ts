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

export type CheckoutTier = "eid" | "monthly" | "yearly" | "vip" | "support";

export function priceIdForTier(tier: CheckoutTier): string | undefined {
  const map: Record<CheckoutTier, string | undefined> = {
    eid: process.env.STRIPE_PRICE_EID,
    monthly: process.env.STRIPE_PRICE_MONTHLY,
    yearly: process.env.STRIPE_PRICE_YEARLY,
    vip: process.env.STRIPE_PRICE_VIP,
    support: process.env.STRIPE_PRICE_SUPPORT,
  };
  return map[tier];
}
