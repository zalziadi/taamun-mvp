import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripeServer() {
  if (stripe) return stripe;

  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key || key.includes("YOUR_STRIPE_KEY")) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  stripe = new Stripe(key);
  return stripe;
}
