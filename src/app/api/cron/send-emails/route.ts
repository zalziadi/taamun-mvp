import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  buildActivationEmail,
  type ActivationEmailPayload,
} from "@/lib/emails/activation-template";
import { buildExpiryWarningEmail } from "@/lib/emails/expiry-warning-template";
import { buildExpiredEmail } from "@/lib/emails/expired-template";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 10;

/**
 * Cron endpoint — يُستدعى كل دقيقة من Vercel Cron
 * يرسل الإيميلات المستحقة (send_after <= now) عبر Resend
 */
export async function GET(req: Request) {
  // تحقق من سر الـ Cron
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "resend_not_configured" }, { status: 500 });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_ORIGIN ?? "https://www.taamun.com";

  const admin = getSupabaseAdmin();

  // جلب الإيميلات المستحقة
  const { data: pending, error: fetchErr } = await admin
    .from("email_queue")
    .select("*")
    .eq("status", "pending")
    .lte("send_after", new Date().toISOString())
    .order("send_after", { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchErr) {
    console.error("Cron: fetch email_queue failed", fetchErr);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  if (!pending || pending.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sentCount = 0;

  for (const row of pending) {
    try {
      const payload = row.payload as Record<string, any>;
      const template = row.template as string | null;

      let emailData: { subject: string; html: string; text: string };

      if (template === "expiry_warning") {
        emailData = buildExpiryWarningEmail({
          userName: payload.userName ?? row.email.split("@")[0],
          daysLeft: payload.daysLeft ?? 7,
          tier: payload.tier ?? "monthly",
          appUrl,
        });
      } else if (template === "expired") {
        emailData = buildExpiredEmail({
          userName: payload.userName ?? row.email.split("@")[0],
          tier: payload.tier ?? "monthly",
          appUrl,
        });
      } else {
        // Default: activation email
        const activationPayload = payload as Partial<ActivationEmailPayload>;
        const { data: sub } = await admin
          .from("customer_subscriptions")
          .select("tier")
          .eq("user_id", row.user_id)
          .single();

        emailData = buildActivationEmail({
          userName: activationPayload.userName ?? row.email.split("@")[0],
          activationCode: await getActivationCode(admin, row.user_id),
          tier: activationPayload.tier ?? sub?.tier ?? "full",
          appUrl,
        });
      }

      // إرسال عبر Resend
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? "تمعّن <noreply@taamun.com>",
          to: [row.email],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Resend ${res.status}: ${errBody}`);
      }

      // تحديث الحالة إلى sent
      await admin
        .from("email_queue")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id);

      sentCount++;
    } catch (err) {
      console.error(`Cron: failed to send email ${row.id}`, err);
      await admin
        .from("email_queue")
        .update({
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
        })
        .eq("id", row.id);
    }
  }

  return NextResponse.json({ sent: sentCount, total: pending.length });
}

/**
 * جلب كود التفعيل المرتبط بالمستخدم
 * يبحث أولاً في entitlement cookie أو يولّد كود من الاشتراك
 */
async function getActivationCode(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string
): Promise<string> {
  // محاولة جلب الكود من الاشتراك
  const { data } = await admin
    .from("customer_subscriptions")
    .select("tap_charge_id, tier")
    .eq("user_id", userId)
    .single();

  if (data?.tap_charge_id) {
    // اختصار الـ charge ID كمرجع
    const shortId = data.tap_charge_id.replace(/^chg_/, "").slice(0, 8).toUpperCase();
    const prefix = data.tier === "vip" || data.tier === "yearly" ? "TAAMUN-820" : "TAAMUN";
    return `${prefix}-${shortId}`;
  }

  return "TAAMUN-ACTIVE";
}
