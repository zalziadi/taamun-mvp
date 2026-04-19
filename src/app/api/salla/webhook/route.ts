import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { calcExpiresAt } from "@/lib/subscriptionDurations";
import crypto from "crypto";

export const dynamic = "force-dynamic";

type SallaWebhookPayload = {
  event?: string;
  merchant?: number;
  data?: {
    id?: number;
    status?: { slug?: string; name?: string };
    payment?: { method?: string; status?: string };
    customer?: { email?: string; mobile?: string; first_name?: string };
    amounts?: { total?: { amount?: number }; currency?: string };
    meta?: Record<string, string>;
    reference_id?: string;
  };
};

function verifySallaSignature(
  rawBody: string,
  secret: string,
  receivedSignature: string | null
): boolean {
  if (!receivedSignature || !secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(receivedSignature, "hex")
  );
}

/**
 * POST /api/salla/webhook
 * يستقبل أحداث الدفع من سلة ويفعّل الاشتراك.
 */
export async function POST(req: Request) {
  const secret = process.env.SALLA_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "salla_webhook_not_configured" },
      { status: 500 }
    );
  }

  const raw = await req.text();
  const signature = req.headers.get("x-salla-signature");

  if (!verifySallaSignature(raw, secret, signature)) {
    console.warn("Salla webhook: invalid signature");
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  let body: SallaWebhookPayload;
  try {
    body = JSON.parse(raw) as SallaWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const event = body.event ?? "";
  console.log(`Salla webhook received: ${event}`);

  // نعالج فقط أحداث الطلبات المكتملة
  const paymentEvents = [
    "order.created",
    "order.payment.updated",
    "order.updated",
  ];

  if (!paymentEvents.includes(event)) {
    return NextResponse.json({ received: true });
  }

  const data = body.data;
  if (!data) {
    return NextResponse.json({ received: true });
  }

  // التحقق من حالة الدفع
  const paymentStatus = data.payment?.status ?? data.status?.slug ?? "";
  const isPaid =
    paymentStatus === "paid" ||
    paymentStatus === "completed" ||
    paymentStatus === "in_progress"; // بعض الحالات في سلة

  if (!isPaid && event !== "order.created") {
    return NextResponse.json({ received: true });
  }

  // البحث عن المستخدم عبر البريد
  const email = data.customer?.email;
  if (!email) {
    console.warn("Salla webhook: no customer email");
    return NextResponse.json({ received: true });
  }

  const admin = getSupabaseAdmin();

  // البحث عن المستخدم بالبريد
  // 1) نبحث أولاً في profiles (indexed, سريع)
  const { data: profileMatch } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  let userId = profileMatch?.id as string | undefined;

  // 2) fallback: بحث في auth.users (أبطأ — يُستخدم فقط إذا profiles ما فيه email)
  if (!userId) {
    const { data: allUsers } = await admin.auth.admin.listUsers();
    const found = allUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    userId = found?.id;
  }

  if (!userId) {
    console.warn(`Salla webhook: no user found for email ${email}`);
    return NextResponse.json({ received: true, note: "user_not_found" });
  }

  const matchedUser = { id: userId };

  // تحديد الباقة من المبلغ أو البيانات الوصفية
  const amount = data.amounts?.total?.amount ?? 0;
  const meta = data.meta ?? {};
  let tier = meta.tier ?? "quarterly";
  if (!meta.tier) {
    if (amount >= 4000) tier = "vip";       // 4,999 ر.س
    else if (amount >= 500) tier = "yearly"; // 699 ر.س
    else if (amount >= 100) tier = "quarterly"; // 199 ر.س
    else tier = "quarterly"; // fallback
  }

  const periodDaysMap: Record<string, number> = { trial: 7, quarterly: 90, yearly: 365, vip: 365, eid: 30, monthly: 30 };
  const periodDays = periodDaysMap[tier] ?? 90;
  const periodEnd = new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString();

  const { error: upsertError } = await admin.from("customer_subscriptions").upsert(
    {
      user_id: matchedUser.id,
      payment_provider: "salla",
      tap_charge_id: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      status: isPaid ? "active" : "pending",
      price_id: `SAR:${amount.toFixed(2)}`,
      tier,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (upsertError) {
    console.error("Salla webhook: subscription upsert failed", upsertError);
    return NextResponse.json({ ok: false, error: "upsert_failed" }, { status: 500 });
  }

  // تحديث profiles — نفس النمط المستخدم في /api/activate
  // هذا ضروري لأن صفحة الحساب تقرأ من profiles وليس customer_subscriptions
  if (isPaid) {
    const now = new Date();
    const expiresAt = calcExpiresAt(tier, now);

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: matchedUser.id,
        subscription_status: "active",
        subscription_tier: tier,
        tier,
        activated_at: now.toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("Salla webhook: profiles upsert failed", profileError);
      // لا نرجع خطأ — customer_subscriptions تم تحديثه بنجاح
    } else {
      console.log(`Salla webhook: profiles updated for ${matchedUser.id}`);
    }

    // Phase 9 RENEW-03: tag first-seen gateway for renewal CTA routing.
    // Guarded by .is("original_gateway", null) so first-gateway-wins.
    // Best-effort: failure is logged but never blocks webhook 2xx.
    try {
      const { error: gatewayTagError } = await admin
        .from("profiles")
        .update({ original_gateway: "salla" })
        .eq("id", matchedUser.id)
        .is("original_gateway", null);
      if (gatewayTagError) {
        console.warn(
          "[salla webhook] original_gateway tag failed (non-blocking):",
          gatewayTagError.message
        );
      }
    } catch (e) {
      console.warn("[salla webhook] original_gateway tag threw (non-blocking):", e);
    }
  }

  console.log(`Salla webhook: activated ${tier} for ${matchedUser.id} (${email})`);
  return NextResponse.json({ received: true, activated: true });
}
