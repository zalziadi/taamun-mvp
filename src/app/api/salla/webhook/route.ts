import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SallaCustomer {
  id?: number | string;
  name?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface SallaOrderItem {
  product_id?: number | string;
}

interface SallaWebhookPayload {
  event?: string;
  data?: {
    id?: number | string;
    reference_id?: string;
    customer?: SallaCustomer;
    items?: SallaOrderItem[];
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateActivationCode(): string {
  const digits = Math.floor(100000 + Math.random() * 900000).toString();
  return `RAMADAN-${digits}`;
}

function verifyHmac(secret: string, rawBody: string, signature: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

async function sendActivationEmail(opts: {
  customerName: string;
  customerEmail: string;
  code: string;
  activationUrl: string;
}): Promise<void> {
  const { customerName, customerEmail, code, activationUrl } = opts;

  const resendKey = process.env.RESEND_API_KEY ?? "";
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "taamun@resend.dev";

  const subject = `مرحباً ${customerName}، رحلتك مع تمعّن بدأت 🌙`;
  const htmlBody = `
<div dir="rtl" style="font-family: sans-serif; font-size: 16px; color: #1a1a1a; max-width: 560px; margin: 0 auto;">
  <h2 style="color: #7c3aed;">مرحباً ${customerName} 🌙</h2>
  <p>شكراً لاشتراكك في <strong>تمعّن</strong> — رحلتك القرآنية لمدة ٢٨ يوماً.</p>
  <p>كود التفعيل الخاص بك:</p>
  <div style="background: #f3f0ff; border-radius: 8px; padding: 16px 24px; text-align: center; margin: 24px 0;">
    <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #7c3aed;">${code}</span>
  </div>
  <p>أو انقر على الرابط لتفعيل حسابك مباشرةً:</p>
  <a href="${activationUrl}" style="display: inline-block; background: #7c3aed; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
    ابدأ رحلتك الآن
  </a>
  <p style="color: #666; font-size: 13px; margin-top: 32px;">
    إذا لم تطلب هذا الاشتراك، يمكنك تجاهل هذا الإيميل.
  </p>
</div>
`;

  if (!resendKey) {
    // Development fallback
    console.log("[salla/webhook] ✉️  Email (DEV — no RESEND_API_KEY):");
    console.log(`  To: ${customerEmail}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Code: ${code}`);
    console.log(`  URL: ${activationUrl}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [customerEmail],
      subject,
      html: htmlBody,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[salla/webhook] Resend error:", res.status, text);
    throw new Error(`resend_failed:${res.status}`);
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: Request): Promise<NextResponse> {
  // 1. Read raw body for HMAC verification
  const rawBody = await req.text();

  // 2. Verify HMAC signature
  const secret = process.env.SALLA_WEBHOOK_SECRET ?? "";
  const signature = req.headers.get("x-salla-signature") ?? "";

  if (!secret) {
    console.error("[salla/webhook] Missing SALLA_WEBHOOK_SECRET env var");
    return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 500 });
  }

  if (!signature || !verifyHmac(secret, rawBody, signature)) {
    console.warn("[salla/webhook] Invalid HMAC signature");
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  // 3. Parse payload
  let payload: SallaWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as SallaWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Only handle order.completed events (ignore everything else silently)
  if (payload.event !== "order.completed") {
    return NextResponse.json({ ok: true, skipped: true, event: payload.event ?? "unknown" });
  }

  const data = payload.data;
  const orderId = String(data?.id ?? data?.reference_id ?? "");
  const customer = data?.customer;
  const customerEmail = (customer?.email ?? "").trim().toLowerCase();
  const customerName =
    customer?.name?.trim() ||
    [customer?.first_name, customer?.last_name].filter(Boolean).join(" ").trim() ||
    "عزيزي العميل";
  const productId = String(data?.items?.[0]?.product_id ?? "");

  if (!customerEmail) {
    console.warn("[salla/webhook] Missing customer email in order", orderId);
    return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });
  }

  // 4. Generate unique activation code with collision retry
  const supabase = getSupabaseAdmin();
  let code = "";
  let inserted = false;

  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateActivationCode();

    // expires_at: 60 days from now (generous window to allow activation)
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase.from("activation_codes").insert({
      code,
      plan: "base",
      max_uses: 1,
      uses: 0,
      expires_at: expiresAt,
      salla_order_id: orderId || null,
      customer_email: customerEmail,
      customer_name: customerName,
      salla_product_id: productId || null,
    });

    if (!insertError) {
      inserted = true;
      break;
    }

    // 23505 = unique_violation (duplicate code) — retry with a new code
    if ((insertError as { code?: string }).code !== "23505") {
      console.error("[salla/webhook] Supabase insert error:", insertError);
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }
  }

  if (!inserted) {
    console.error("[salla/webhook] Could not generate unique code after 5 attempts");
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  // 5. Send activation email
  const origin =
    process.env.NEXT_PUBLIC_APP_ORIGIN?.replace(/\/$/, "") ?? "https://taamun.app";
  const activationUrl = `${origin}/activate?code=${code}`;

  try {
    await sendActivationEmail({ customerName, customerEmail, code, activationUrl });
  } catch (err) {
    // Log but don't fail — code is already saved, email can be resent manually
    console.error("[salla/webhook] Email send failed:", err);
  }

  console.log(`[salla/webhook] ✅ Created code ${code} for ${customerEmail} (order ${orderId})`);

  return NextResponse.json({ ok: true, code });
}
