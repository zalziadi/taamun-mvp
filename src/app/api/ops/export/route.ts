import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";

export const dynamic = "force-dynamic";

/**
 * GET /api/ops/export
 *
 * Streams the full ops_snapshots table as CSV for offline analysis
 * (sheets, BI tools). Admin-only. Columns: captured_on, metric, value.
 * Sorted by date ASC so imports preserve chronology.
 */
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { data, error } = await gate.admin
    .from("ops_snapshots")
    .select("captured_on, metric, value")
    .order("captured_on", { ascending: true })
    .order("metric", { ascending: true })
    .limit(100000);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const rows = data ?? [];
  const header = "captured_on,metric,value";
  const body = rows
    .map((r) => `${r.captured_on},${r.metric},${r.value}`)
    .join("\n");
  const csv = header + "\n" + body + "\n";

  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="taamun-ops-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
