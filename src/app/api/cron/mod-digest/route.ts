import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/mod-digest
 *
 * Runs daily (08:00 UTC). Counts flagged rows across all four UGC surfaces
 * and emails a single summary to ADMIN_EMAIL via Resend. Silent no-op when
 * RESEND_API_KEY or ADMIN_EMAIL are missing, or when everything is zero
 * (so the founder's inbox stays quiet on clean days).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  const [threads, replies, journeys, insights] = await Promise.all([
    admin.from("threads").select("id", { count: "exact", head: true }).eq("status", "flagged"),
    admin.from("thread_replies").select("id", { count: "exact", head: true }).eq("status", "flagged"),
    admin.from("creator_journeys").select("slug", { count: "exact", head: true }).eq("status", "flagged"),
    admin.from("shared_insights").select("slug", { count: "exact", head: true }).eq("status", "flagged"),
  ]);

  const counts = {
    threads: threads.count ?? 0,
    replies: replies.count ?? 0,
    journeys: journeys.count ?? 0,
    insights: insights.count ?? 0,
  };

  const total =
    counts.threads + counts.replies + counts.journeys + counts.insights;

  if (total === 0) {
    return NextResponse.json({ ok: true, total: 0, skipped: "empty_queue" });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!resendKey || !adminEmail) {
    return NextResponse.json({
      ok: true,
      total,
      skipped: "email_not_configured",
      counts,
    });
  }

  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://taamun.com";
  const today = new Date().toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const subject = `تمعّن — ${total} عنصر بانتظار المراجعة (${today})`;
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<body style="font-family: -apple-system, system-ui, sans-serif; background:#f4f1ea; color:#2f2619; margin:0; padding:32px 16px;">
  <div style="max-width:480px; margin:0 auto; background:#ffffff; padding:24px; border-top:3px solid #5a4a35;">
    <h1 style="font-size:16px; font-weight:bold; color:#2f2619; margin:0 0 12px;">مركز المراجعة — ملخّص يومي</h1>
    <p style="font-size:13px; color:#5a4a35; margin:0 0 16px;">${total} عنصر في قائمة الانتظار اليوم:</p>
    <ul style="list-style:none; padding:0; margin:0 0 20px; font-size:13px; color:#3d342a;">
      ${counts.threads > 0 ? `<li style="padding:6px 0; border-bottom:1px solid #e8e1d9;">خيوط: <strong>${counts.threads}</strong></li>` : ""}
      ${counts.replies > 0 ? `<li style="padding:6px 0; border-bottom:1px solid #e8e1d9;">ردود: <strong>${counts.replies}</strong></li>` : ""}
      ${counts.journeys > 0 ? `<li style="padding:6px 0; border-bottom:1px solid #e8e1d9;">رحلات مبدعين: <strong>${counts.journeys}</strong></li>` : ""}
      ${counts.insights > 0 ? `<li style="padding:6px 0; border-bottom:1px solid #e8e1d9;">رؤى مشاركة: <strong>${counts.insights}</strong></li>` : ""}
    </ul>
    <a href="${origin}/admin/moderation" style="display:inline-block; padding:10px 20px; background:#5a4a35; color:#fcfaf7; text-decoration:none; font-size:12px; font-weight:bold;">افتح مركز المراجعة ←</a>
  </div>
</body>
</html>`.trim();

  const text = [
    `تمعّن — ${total} عنصر بانتظار المراجعة`,
    "",
    counts.threads > 0 ? `خيوط: ${counts.threads}` : null,
    counts.replies > 0 ? `ردود: ${counts.replies}` : null,
    counts.journeys > 0 ? `رحلات مبدعين: ${counts.journeys}` : null,
    counts.insights > 0 ? `رؤى مشاركة: ${counts.insights}` : null,
    "",
    `${origin}/admin/moderation`,
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? "تمعّن <noreply@taamun.com>",
      to: [adminEmail],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    return NextResponse.json(
      { ok: false, error: "resend_failed", details: errBody, counts },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, total, counts, sent: true });
}
