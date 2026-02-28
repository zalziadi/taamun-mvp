import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getStripeServer } from "@/lib/stripeServer";

async function supabaseServer() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !anonKey) {
    throw new Error("Missing Supabase env: SUPABASE_URL/SUPABASE_ANON_KEY");
  }

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // no-op in immutable phases
        }
      },
    },
  });
}

function getAppUrl(req: Request) {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_APP_ORIGIN ?? "";
  if (envUrl) return envUrl.replace(/\/$/, "");
  return new URL(req.url).origin;
}

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select("id, product_key, title, unit_amount, currency, qty")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (cartError) {
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ ok: false, error: "empty_cart" }, { status: 400 });
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + item.unit_amount * item.qty, 0);
    const currency = cartItems[0]?.currency ?? "sar";

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: "pending",
        total_amount: totalAmount,
        currency,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (orderError || !order?.id) {
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }

    let sessionUrl: string | null = null;
    let sessionId: string | null = null;
    try {
      const stripe = getStripeServer();
      const appUrl = getAppUrl(req);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: cartItems.map((item) => ({
          quantity: item.qty,
          price_data: {
            currency: item.currency,
            unit_amount: item.unit_amount,
            product_data: {
              name: item.title,
            },
          },
        })),
        success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/subscribe?checkout=cancelled`,
        metadata: {
          userId: user.id,
          orderId: order.id,
        },
      });
      sessionUrl = session.url;
      sessionId = session.id;
    } catch {
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ ok: false, error: "stripe_not_configured" }, { status: 503 });
    }

    const nowIso = new Date().toISOString();
    await supabase.from("orders").update({ stripe_session_id: sessionId, updated_at: nowIso }).eq("id", order.id);
    await supabase
      .from("cart_items")
      .update({ stripe_checkout_session_id: sessionId, updated_at: nowIso })
      .eq("user_id", user.id);

    return NextResponse.json({ ok: true, url: sessionUrl });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
