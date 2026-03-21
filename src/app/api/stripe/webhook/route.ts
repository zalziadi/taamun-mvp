import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

async function syncSubscriptionRow(params: {
  userId: string;
  customerId: string | null;
  subscriptionId: string;
  tierFallback: string;
}) {
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(params.subscriptionId);
  const priceId = sub.items.data[0]?.price?.id ?? "";
  const tier = sub.metadata?.tier ?? params.tierFallback;
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? params.customerId;

  const admin = getSupabaseAdmin();
  const periodEnd =
    typeof sub.current_period_end === "number"
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null;

  const { error } = await admin.from("customer_subscriptions").upsert(
    {
      user_id: params.userId,
      payment_provider: "stripe",
      tap_charge_id: null,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      status: sub.status,
      price_id: priceId,
      tier,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("customer_subscriptions upsert error", error);
    throw error;
  }
}

async function markSubscriptionStatus(subscriptionId: string, status: string) {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("customer_subscriptions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscriptionId);
  if (error) console.error("subscription status update error", error);
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "webhook_not_configured" }, { status: 500 });
  }

  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 500 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ ok: false, error: "no_signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    console.error("Stripe webhook signature error", e);
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const userId = session.client_reference_id ?? session.metadata?.user_id;
        if (!userId) {
          console.error("checkout.session.completed missing user id");
          break;
        }
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (!subId) break;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
        const tier = session.metadata?.tier ?? "full";
        await syncSubscriptionRow({
          userId: userId,
          customerId,
          subscriptionId: subId,
          tierFallback: tier,
        });
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (!userId) break;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
        await syncSubscriptionRow({
          userId,
          customerId,
          subscriptionId: sub.id,
          tierFallback: sub.metadata?.tier ?? "full",
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await markSubscriptionStatus(sub.id, "canceled");
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("Stripe webhook handler error", e);
    return NextResponse.json({ ok: false, error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
