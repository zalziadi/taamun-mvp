import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { getAppOriginServer } from "@/lib/appOrigin";
import { getCheckoutProvider } from "@/lib/checkoutProvider";
import { createTapCharge } from "@/lib/tap";
import { getStripe, priceIdForTier, type CheckoutTier } from "@/lib/stripe";
import { sallaProductUrl } from "@/lib/salla";

export const dynamic = "force-dynamic";

const VALID_TIERS: CheckoutTier[] = ["eid", "monthly", "yearly", "vip", "support"];

export async function POST(req: Request) {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;

  let body: { tier?: string; source?: string };
    try {
          body = await req.json();
    } catch {
          return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }

  const tier = (body.tier ?? "monthly") as CheckoutTier;
    const sourceOverride = body.source === "src_stc_pay" ? "src_stc_pay" : undefined;
    if (!VALID_TIERS.includes(tier)) {
          return NextResponse.json({ ok: false, error: "invalid_tier" }, { status: 400 });
    }

  if (tier === "support") {
        return NextResponse.json(
          { ok: false, error: "tier_requires_contact", message: "تواصل معنا لباقة الدعم الخاص." },
          { status: 400 }
              );
  }

  const origin = await getAppOriginServer();
    const provider = getCheckoutProvider();

  /* ── سلة ── */
  if (provider === "salla") {
        const url = sallaProductUrl(tier);
        if (!url) {
                return NextResponse.json(
                  {
                              ok: false,
                              error: "salla_not_configured",
                              provider: "salla" as const,
                              hint: "SALLA_PRODUCT_MONTHLY or SALLA_STORE_SLUG + SALLA_PRODUCT_ID_MONTHLY",
                  },
                  { status: 503 }
                        );
        }
        return NextResponse.json({ ok: true, url, provider: "salla" as const });
  }

  if (provider === "tap") {
        if (!process.env.TAP_SECRET_KEY?.trim()) {
                return NextResponse.json(
                  { ok: false, error: "tap_not_configured", provider: "tap" as const, hint: "TAP_SECRET_KEY" },
                  { status: 503 }
                        );
        }
        if (!process.env.TAP_AMOUNT_MONTHLY?.trim()) {
                return NextResponse.json(
                  { ok: false, error: "tap_amounts_missing", provider: "tap" as const, hint: "TAP_AMOUNT_*" },
                  { status: 503 }
                        );
        }
        try {
                const meta = auth.user.user_metadata as Record<string, unknown> | undefined;
                const fullName = typeof meta?.full_name === "string" ? meta.full_name : null;
                const { url } = await createTapCharge({
                          tier,
                          userId: auth.user.id,
                          email: auth.user.email ?? `${auth.user.id}@users.invalid`,
                          userName: fullName,
                          origin,
                          sourceId: sourceOverride,
                });
                return NextResponse.json({ ok: true, url, provider: "tap" as const });
        } catch (e) {
                console.error("Tap checkout error", e);
                return NextResponse.json(
                  { ok: false, error: "tap_checkout_failed", provider: "tap" as const },
                  { status: 503 }
                        );
        }
  }

  const priceId = priceIdForTier(tier);
    if (!priceId) {
          return NextResponse.json(
            { ok: false, error: "price_not_configured", tier, provider: "stripe" as const },
            { status: 503 }
                );
    }

  let stripe;
    try {
          stripe = getStripe();
    } catch {
          return NextResponse.json(
            { ok: false, error: "stripe_not_configured", provider: "stripe" as const },
            { status: 503 }
                );
    }

  const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing/cancel`,
        client_reference_id: auth.user.id,
        customer_email: auth.user.email ?? undefined,
        metadata: { user_id: auth.user.id, tier },
        subscription_data: { metadata: { user_id: auth.user.id, tier } },
        allow_promotion_codes: true,
  });

  if (!session.url) {
        return NextResponse.json({ ok: false, error: "no_checkout_url", provider: "stripe" as const }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: session.url, provider: "stripe" as const });
}
