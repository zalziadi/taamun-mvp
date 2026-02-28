import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getStripeServer } from "@/lib/stripeServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { ENTITLEMENT_COOKIE_NAME } from "@/lib/entitlement-constants";
import { makeEntitlementToken } from "@/lib/entitlement";

function createActivationCode() {
  const digits = Math.floor(100000 + Math.random() * 900000).toString();
  return `STRIPE-${digits}`;
}

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

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id")?.trim();
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "missing_session_id" }, { status: 400 });
  }

  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    let session;
    try {
      session = await getStripeServer().checkout.sessions.retrieve(sessionId);
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 400 });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({ ok: false, error: "not_paid" }, { status: 400 });
    }

    if (session.metadata?.userId && session.metadata.userId !== user.id) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    const nowIso = new Date().toISOString();

    let orderId = session.metadata?.orderId ?? null;
    if (!orderId) {
      const { data: existingOrder } = await admin
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .eq("stripe_session_id", sessionId)
        .maybeSingle();
      orderId = existingOrder?.id ?? null;
    }

    if (!orderId) {
      const amountTotal = typeof session.amount_total === "number" ? session.amount_total : 0;
      const currency = session.currency ?? "sar";
      const { data: createdOrder } = await admin
        .from("orders")
        .insert({
          user_id: user.id,
          status: "paid",
          total_amount: amountTotal,
          currency,
          stripe_session_id: sessionId,
          stripe_payment_intent:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
          updated_at: nowIso,
        })
        .select("id")
        .single();
      orderId = createdOrder?.id ?? null;
    } else {
      await admin
        .from("orders")
        .update({
          status: "paid",
          stripe_payment_intent:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
          updated_at: nowIso,
        })
        .eq("id", orderId);
    }

    const { data: orderRow } = await admin
      .from("orders")
      .select("id, entitlement_activated, activation_code")
      .eq("id", orderId ?? "")
      .maybeSingle();

    let activationCode = orderRow?.activation_code ?? null;
    let endsAtIso = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (orderRow && !orderRow.entitlement_activated) {
      let insertedCode = false;
      for (let i = 0; i < 5; i++) {
        const candidate = createActivationCode();
        const { error } = await admin.from("activation_codes").insert({
          code: candidate,
          plan: "base",
          max_uses: 1,
          uses: 0,
          expires_at: endsAtIso,
          customer_email: user.email ?? null,
          customer_name: user.user_metadata?.full_name ?? null,
        });
        if (!error) {
          activationCode = candidate;
          insertedCode = true;
          break;
        }
        if ((error as { code?: string }).code !== "23505") {
          return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
        }
      }

      if (!insertedCode || !activationCode) {
        return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
      }

      const { error: entitlementError } = await admin.from("entitlements").upsert(
        {
          activation_code: activationCode,
          plan: "base",
          starts_at: nowIso,
          ends_at: endsAtIso,
          status: "active",
        },
        { onConflict: "activation_code" }
      );
      if (entitlementError) {
        return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
      }

      await admin
        .from("orders")
        .update({
          activation_code: activationCode,
          entitlement_activated: true,
          updated_at: nowIso,
        })
        .eq("id", orderRow.id);
    } else if (orderRow?.entitlement_activated) {
      const { data: entitlement } = await admin
        .from("entitlements")
        .select("ends_at")
        .eq("activation_code", orderRow.activation_code ?? "")
        .eq("status", "active")
        .order("ends_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (entitlement?.ends_at) {
        endsAtIso = entitlement.ends_at;
      }
    }

    await admin
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
      .eq("stripe_checkout_session_id", sessionId);

    const expMs = Date.parse(endsAtIso);
    const maxAge = Math.max(1, Math.floor((expMs - Date.now()) / 1000));
    const token = makeEntitlementToken("base", expMs);

    const res = NextResponse.json({ ok: true, redirect: "/day/1" });
    res.cookies.set({
      name: ENTITLEMENT_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
