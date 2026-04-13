import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

async function upsertSubscription(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  sub: Stripe.Subscription,
  tier?: string
) {
  const periodEnd = (sub as unknown as { current_period_end: number })
    .current_period_end;

  const { error } = await admin.from("customer_subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: sub.customer as string,
      stripe_subscription_id: sub.id,
      stripe_price_id: sub.items.data[0]?.price.id ?? null,
      status: sub.status,
      tier: tier ?? sub.metadata?.tier ?? null,
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );
  if (error) {
    console.error("[stripe/webhook] subscription upsert failed:", error);
    throw error;
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.supabase_uid;
    if (userId && session.subscription) {
      const sub = await getStripe().subscriptions.retrieve(
        session.subscription as string
      );
      await upsertSubscription(admin, userId, sub, session.metadata?.tier);
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const customer = await getStripe().customers.retrieve(sub.customer as string);
    const userId = (customer as Stripe.Customer).metadata?.supabase_uid;
    if (userId) await upsertSubscription(admin, userId, sub);
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const { error: cancelErr } = await admin
      .from("customer_subscriptions")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", sub.id);
    if (cancelErr) {
      console.error("[stripe/webhook] cancel update failed:", cancelErr);
      return NextResponse.json({ error: "db_update_failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
