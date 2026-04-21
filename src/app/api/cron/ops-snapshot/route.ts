import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { captureAllMetrics } from "@/lib/ops-metrics";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/ops-snapshot
 *
 * Daily at 23:55 UTC. Snapshots every canonical ops metric into
 * `ops_snapshots`. Upsert-by-(captured_on, metric) makes manual
 * reruns safe.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const metrics = await captureAllMetrics(admin);

  // Use UTC date so the row key is stable regardless of server timezone.
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const rows = metrics.map((m) => ({
    captured_on: today,
    metric: m.key,
    value: m.value,
  }));

  const { error } = await admin
    .from("ops_snapshots")
    .upsert(rows, { onConflict: "captured_on,metric" });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, captured_on: today, metrics: rows.length });
}
