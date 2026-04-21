import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { captureAllMetrics, METRIC_SPECS } from "@/lib/ops-metrics";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/check-alerts
 *
 * Daily at 00:05 UTC (right after the 23:55 snapshot cron). Reads all
 * active alert rules, evaluates each against a fresh live capture
 * (rather than relying on the snapshot, so we catch the same moment),
 * and emails a single digest to ADMIN_EMAIL via Resend. Debounced to
 * 12h per rule.
 *
 * Silent no-op when:
 *   - no rules triggered
 *   - RESEND_API_KEY or ADMIN_EMAIL missing
 */

interface AlertRow {
  id: number;
  metric: string;
  comparison: string;
  threshold: number;
  label: string | null;
  active: boolean;
  last_fired_at: string | null;
}

function evaluate(value: number, comparison: string, threshold: number): boolean {
  switch (comparison) {
    case ">":
      return value > threshold;
    case "<":
      return value < threshold;
    case ">=":
      return value >= threshold;
    case "<=":
      return value <= threshold;
    case "==":
      return value === threshold;
    default:
      return false;
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  const { data: rules } = await admin
    .from("ops_alerts")
    .select("*")
    .eq("active", true);

  if (!rules || rules.length === 0) {
    return NextResponse.json({ ok: true, skipped: "no_active_rules" });
  }

  const metrics = await captureAllMetrics(admin);
  const metricMap = new Map(metrics.map((m) => [m.key, m.value]));

  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

  const triggered: Array<{
    rule: AlertRow;
    currentValue: number;
    metricLabel: string;
  }> = [];

  for (const rule of rules as AlertRow[]) {
    const value = metricMap.get(rule.metric);
    if (value === undefined) continue;

    if (!evaluate(value, rule.comparison, rule.threshold)) continue;

    // Debounce: skip if fired within last 12h
    if (rule.last_fired_at && new Date(rule.last_fired_at) > twelveHoursAgo) {
      continue;
    }

    const spec = METRIC_SPECS.find((s) => s.key === rule.metric);
    triggered.push({
      rule,
      currentValue: value,
      metricLabel: spec?.label ?? rule.metric,
    });
  }

  if (triggered.length === 0) {
    return NextResponse.json({ ok: true, evaluated: rules.length, triggered: 0 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!resendKey || !adminEmail) {
    return NextResponse.json({
      ok: true,
      triggered: triggered.length,
      skipped: "email_not_configured",
      rules: triggered.map((t) => ({
        metric: t.rule.metric,
        value: t.currentValue,
        threshold: t.rule.threshold,
      })),
    });
  }

  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN || "https://taamun.com";
  const today = new Date().toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const rows = triggered
    .map((t) => {
      const name = t.rule.label || t.metricLabel;
      return `<tr>
  <td style="padding:8px;border-bottom:1px solid #e8e1d9">${name}</td>
  <td style="padding:8px;border-bottom:1px solid #e8e1d9;text-align:center">${t.currentValue} ${t.rule.comparison} ${t.rule.threshold}</td>
</tr>`;
    })
    .join("\n");

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<body style="font-family:-apple-system,system-ui,sans-serif;background:#f4f1ea;color:#2f2619;margin:0;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;padding:24px;border-top:3px solid #5a4a35;">
    <h1 style="font-size:16px;font-weight:bold;margin:0 0 12px">تنبيه تشغيلي — تمعّن</h1>
    <p style="font-size:13px;color:#5a4a35;margin:0 0 16px">
      ${triggered.length} تنبيه اجتاز عتبته اليوم (${today}):
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;color:#3d342a;margin-bottom:20px">
      <thead>
        <tr>
          <th style="padding:8px;border-bottom:2px solid #5a4a35;text-align:right">التنبيه</th>
          <th style="padding:8px;border-bottom:2px solid #5a4a35;text-align:center">القيمة</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <a href="${origin}/admin/ops" style="display:inline-block;padding:10px 20px;background:#5a4a35;color:#fcfaf7;text-decoration:none;font-size:12px;font-weight:bold">افتح نظرة تشغيلية ←</a>
  </div>
</body>
</html>`.trim();

  const text = [
    `تنبيه تشغيلي — ${triggered.length} اجتاز العتبة`,
    "",
    ...triggered.map(
      (t) =>
        `- ${t.rule.label || t.metricLabel}: ${t.currentValue} ${t.rule.comparison} ${t.rule.threshold}`
    ),
    "",
    `${origin}/admin/ops`,
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? "تمعّن <noreply@taamun.com>",
      to: [adminEmail],
      subject: `تمعّن — ${triggered.length} تنبيه تشغيلي`,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ ok: false, error: "resend_failed", details: err }, { status: 500 });
  }

  // Mark fired timestamps
  const now = new Date().toISOString();
  const ids = triggered.map((t) => t.rule.id);
  await admin
    .from("ops_alerts")
    .update({ last_fired_at: now })
    .in("id", ids);

  return NextResponse.json({
    ok: true,
    triggered: triggered.length,
    sent: true,
  });
}
