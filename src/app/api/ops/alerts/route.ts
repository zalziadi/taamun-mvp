import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { METRIC_SPECS } from "@/lib/ops-metrics";

export const dynamic = "force-dynamic";

const VALID_COMPARISONS = new Set([">", "<", ">=", "<=", "=="]);
const VALID_METRICS = new Set(METRIC_SPECS.map((s) => s.key));

/**
 * GET /api/ops/alerts
 * List every alert rule (active + inactive), newest first.
 */
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { data, error } = await gate.admin
    .from("ops_alerts")
    .select("id, metric, comparison, threshold, label, active, last_fired_at, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, alerts: data ?? [] });
}

/**
 * POST /api/ops/alerts
 * Body: { metric, comparison, threshold, label? }
 */
export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const body = (await req.json().catch(() => ({}))) as {
    metric?: string;
    comparison?: string;
    threshold?: number;
    label?: string;
  };

  if (!body.metric || !VALID_METRICS.has(body.metric)) {
    return NextResponse.json({ error: "invalid_metric" }, { status: 400 });
  }
  if (!body.comparison || !VALID_COMPARISONS.has(body.comparison)) {
    return NextResponse.json({ error: "invalid_comparison" }, { status: 400 });
  }
  if (typeof body.threshold !== "number" || !Number.isFinite(body.threshold)) {
    return NextResponse.json({ error: "invalid_threshold" }, { status: 400 });
  }

  const { data, error } = await gate.admin
    .from("ops_alerts")
    .insert({
      metric: body.metric,
      comparison: body.comparison,
      threshold: Math.round(body.threshold),
      label: body.label?.trim().slice(0, 120) ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "db_error", details: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, alert: data });
}

/**
 * PATCH /api/ops/alerts
 * Body: { id, active?: boolean, threshold?: number, comparison?, label? }
 */
export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const body = (await req.json().catch(() => ({}))) as {
    id?: number;
    active?: boolean;
    threshold?: number;
    comparison?: string;
    label?: string;
  };
  if (typeof body.id !== "number") {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.active === "boolean") patch.active = body.active;
  if (typeof body.threshold === "number" && Number.isFinite(body.threshold)) {
    patch.threshold = Math.round(body.threshold);
  }
  if (body.comparison && VALID_COMPARISONS.has(body.comparison)) {
    patch.comparison = body.comparison;
  }
  if (typeof body.label === "string") {
    patch.label = body.label.trim().slice(0, 120) || null;
  }

  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  const { data, error } = await gate.admin
    .from("ops_alerts")
    .update(patch)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, alert: data });
}

/**
 * DELETE /api/ops/alerts?id=123
 */
export async function DELETE(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const { error } = await gate.admin.from("ops_alerts").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
