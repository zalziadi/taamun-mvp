import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripeServer } from "@/lib/stripeServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  if (!secret || secret.includes("YOUR_STRIPE_WEBHOOK_SECRET")) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  }
  return secret;
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "missing_signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripeServer();
    const secret = getWebhookSecret();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true, skipped: true, event: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const sessionId = session.id;
  const paymentIntent =
    typeof session.payment_intent === "string" ? session.payment_intent : null;
  const orderId = session.metadata?.orderId ?? null;
  const userId = session.metadata?.userId ?? null;

  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  if (orderId) {
    await admin
      .from("orders")
      .update({
        status: "paid",
        stripe_session_id: sessionId,
        stripe_payment_intent: paymentIntent,
        updated_at: nowIso,
      })
      .eq("id", orderId);
  } else {
    await admin
      .from("orders")
      .update({
        status: "paid",
        stripe_payment_intent: paymentIntent,
        updated_at: nowIso,
      })
      .eq("stripe_session_id", sessionId);
  }

  if (userId) {
    const { data: existingOrderItems } = await admin
      .from("order_items")
      .select("id")
      .eq("user_id", userId)
      .eq("order_id", orderId ?? "");

    if (!existingOrderItems || existingOrderItems.length === 0) {
      const { data: cartItems } = await admin
        .from("cart_items")
        .select("product_key, title, unit_amount, currency, qty")
        .eq("user_id", userId)
        .eq("stripe_checkout_session_id", sessionId);

      if (cartItems && cartItems.length > 0 && orderId) {
        await admin.from("order_items").insert(
          cartItems.map((item) => ({
            order_id: orderId,
            user_id: userId,
            product_key: item.product_key,
            title: item.title,
            unit_amount: item.unit_amount,
            currency: item.currency,
            qty: item.qty,
            line_total: item.unit_amount * item.qty,
          }))
        );
      }
    }
  }

  return NextResponse.json({ ok: true });
}
