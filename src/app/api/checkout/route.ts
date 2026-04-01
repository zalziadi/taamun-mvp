import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { getCheckoutProvider } from "@/lib/checkoutProvider";
import { sallaProductUrl } from "@/lib/salla";
import type { CheckoutTier } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const VALID_TIERS: CheckoutTier[] = ["eid", "monthly", "yearly", "vip"];

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => ({}))) as { tier?: string };
  const tier = body?.tier as CheckoutTier | undefined;

  if (!tier || !VALID_TIERS.includes(tier)) {
    return NextResponse.json({ error: "invalid_tier" }, { status: 400 });
  }

  const provider = getCheckoutProvider();

  /* ── Salla: redirect to product page ── */
  if (provider === "salla") {
    const url = sallaProductUrl(tier);
    if (!url) {
      return NextResponse.json({ error: "salla_not_configured" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, url, provider: "salla" });
  }

  /* ── Stripe (fallback) ── */
  const { getStripe, STRIPE_PRICES } = await import("@/lib/stripe");
  // Map checkout tiers to stripe tiers
  const stripeMap: Record<string, string | undefined> = {
    eid: STRIPE_PRICES.basic,
    monthly: STRIPE_PRICES.basic,
    yearly: STRIPE_PRICES.full,
    vip: STRIPE_PRICES.full,
  };

  const priceId = stripeMap[tier];
  if (!priceId) {
    return NextResponse.json({ error: "price_not_configured" }, { status: 500 });
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_ORIGIN ?? "https://taamun-mvp.vercel.app";

  const { getSupabaseAdmin } = await import("@/lib/supabaseAdmin");
  const admin = getSupabaseAdmin();
  const { data: existing } = await admin
    .from("customer_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id as string | undefined;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: auth.user.email,
      metadata: { supabase_uid: auth.user.id },
    });
    customerId = customer.id;
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing/cancel`,
    metadata: { supabase_uid: auth.user.id, tier },
  });

  return NextResponse.json({ ok: true, url: session.url, provider: "stripe" });
}
