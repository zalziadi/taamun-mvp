import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";

export const dynamic = "force-dynamic";

/**
 * GET /api/ops/trends?days=30
 *
 * Returns 30-day (or custom range) time series per metric from the
 * ops_snapshots table. Shape:
 *   { [metricKey]: Array<{ date: 'YYYY-MM-DD', value: number }> }
 *
 * Missing days are left out rather than zero-filled — the client
 * sparkline draws what it has; zero-fill would misrepresent silence.
 */
export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const url = new URL(req.url);
  const days = Math.min(365, Math.max(7, parseInt(url.searchParams.get("days") ?? "30", 10)));

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const { data, error } = await gate.admin
    .from("ops_snapshots")
    .select("captured_on, metric, value")
    .gte("captured_on", cutoffStr)
    .order("captured_on", { ascending: true })
    .limit(10000);

  if (error) {
    return NextResponse.json(
      { ok: false, error: "db_error", details: error.message },
      { status: 500 }
    );
  }

  const series: Record<string, Array<{ date: string; value: number }>> = {};
  for (const row of data ?? []) {
    const metric = row.metric as string;
    if (!series[metric]) series[metric] = [];
    series[metric].push({
      date: row.captured_on as string,
      value: Number(row.value ?? 0),
    });
  }

  return NextResponse.json({ ok: true, days, series });
}
