import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { getCheckoutProvider } from "@/lib/checkoutProvider";
import type { CheckoutTier } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const VALID_TIERS: CheckoutTier[] = ["trial", "quarterly", "yearly", "vip", "eid", "monthly"];

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => ({}))) as { tier?: string };
  const tier = body?.tier as CheckoutTier | undefined;

  if (!tier || !VALID_TIERS.includes(tier)) {
    return NextResponse.json({ error: "invalid_tier" }, { status: 400 });
  }

  /* ── Trial: تجربة مجانية — تفعيل مباشر بدون دفع ── */
  if (tier === "trial") {
    const { getSupabaseAdmin } = await import("@/lib/supabaseAdmin");
    const { calcExpiresAt } = await import("@/lib/subscriptionDurations");
    const admin = getSupabaseAdmin();
    const now = new Date();
    const expiresAt = calcExpiresAt("trial", now);

    await admin.from("profiles").upsert(
      {
        id: auth.user.id,
        subscription_status: "active",
        subscription_tier: "trial",
        tier: "trial",
        activated_at: now.toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: "id" }
    );

    return NextResponse.json({ ok: true, url: "/pricing/success", provider: "free" });
  }

  const provider = getCheckoutProvider();

  /* ── Salla أُلغيت (2026-06-26): الدفع يدوي عبر STC Pay/تحويل — واتساب برسالة الباقة ── */
  if (provider === "salla") {
    const labels: Record<string, string> = {
      quarterly: "الربع سنوية (199 ر.س)",
      yearly: "السنوية (699 ر.س)",
      vip: "VIP (4,999 ر.س)",
    };
    const plan = labels[tier] ?? "";
    const text = `السلام عليكم، أرغب في الاشتراك في تمعّن — الباقة ${plan}\nالبريد: ${auth.user.email ?? ""}`;
    const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "966553930885";
    const url = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
    return NextResponse.json({ ok: true, url, provider: "manual" });
  }

  /* ── Stripe (fallback) ── */
  const { getStripe, STRIPE_PRICES } = await import("@/lib/stripe");
  const stripeMap: Record<string, string | undefined> = {
    quarterly: STRIPE_PRICES.basic,
    yearly: STRIPE_PRICES.full,
    vip: STRIPE_PRICES.full,
    // Legacy
    eid: STRIPE_PRICES.basic,
    monthly: STRIPE_PRICES.basic,
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
