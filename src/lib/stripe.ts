import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
      apiVersion: "2026-02-25.clover" as const,
      typescript: true,
    });
  }
  return _stripe;
}

export const STRIPE_PRICES = {
  basic: process.env.STRIPE_PRICE_BASIC ?? "",
  full:  process.env.STRIPE_PRICE_FULL  ?? "",
} as const;

export type StripeTier = keyof typeof STRIPE_PRICES;
