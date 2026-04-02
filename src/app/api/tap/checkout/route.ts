import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { tapFetch, TAP_AMOUNTS, TapTier, TapCharge } from "@/lib/tap";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({})) as { tier?: string };
  const tier = body?.tier as TapTier | undefined;

  if (!tier || !(tier in TAP_AMOUNTS)) {
    return NextResponse.json({ error: "invalid_tier" }, { status: 400 });
  }

  const origin   = process.env.NEXT_PUBLIC_APP_ORIGIN ?? "https://taamun-mvp.vercel.app";
  const currency = process.env.TAP_CURRENCY           ?? "SAR";
  const label    = tier === "basic" ? "Starter — ٣ شهور" : "Growth — سنة كاملة";

  const payload: Record<string, unknown> = {
    amount: TAP_AMOUNTS[tier],
    currency,
    customer_initiated: true,
    threeDSecure: true,
    save_card: false,
    description: `اشتراك تمعّن — ${label}`,
    source: { id: process.env.TAP_SOURCE_ID ?? "src_all" },
    redirect: { url: `${origin}/pricing/success?provider=tap&tier=${tier}` },
    post:     { url: `${origin}/api/tap/webhook` },
    customer: { email: auth.user.email ?? "" },
    metadata: { udf1: tier, udf2: auth.user.id },
  };

  if (process.env.TAP_MERCHANT_ID) {
    payload.merchant = { id: process.env.TAP_MERCHANT_ID };
  }

  const charge = await tapFetch<TapCharge>("/charges", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  // حفظ الشحنة المعلّقة
  const admin = getSupabaseAdmin();
  await admin.from("customer_subscriptions").upsert(
    {
      user_id:           auth.user.id,
      stripe_customer_id: `tap_${auth.user.id}`,
      tap_charge_id:     charge.id,
      status:            "pending",
      tier,
      updated_at:        new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return NextResponse.json({ url: charge.transaction?.url });
}
