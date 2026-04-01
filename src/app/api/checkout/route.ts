import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { getStripe, STRIPE_PRICES, StripeTier } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({})) as { tier?: string };
  const tier = body?.tier as StripeTier | undefined;

  if (!tier || !STRIPE_PRICES[tier]) {
    return NextResponse.json({ error: "invalid_tier" }, { status: 400 });
  }

  const priceId = STRIPE_PRICES[tier];
  if (!priceId) {
    return NextResponse.json({ error: "price_not_configured" }, { status: 500 });
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_ORIGIN ?? "https://taamun-mvp.vercel.app";

  // Get or create Stripe customer
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

  return NextResponse.json({ url: session.url });
}
