import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/moderation
 *
 * Returns every UGC row currently flagged across the four community surfaces:
 *   - threads (v1.4 Phase 2)
 *   - thread_replies (v1.4 Phase 2)
 *   - creator_journeys (v1.4 Phase 3)
 *   - shared_insights (v1.3)
 *
 * Admin-only (requireAdmin enforces cookie or profile role).
 */
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const admin = gate.admin;

  const [threads, replies, journeys, insights] = await Promise.all([
    admin
      .from("threads")
      .select("id, title, body, display_name, user_id, anchor_type, anchor_value, created_at, status")
      .eq("status", "flagged")
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("thread_replies")
      .select("id, thread_id, body, display_name, user_id, created_at, status")
      .eq("status", "flagged")
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("creator_journeys")
      .select("slug, title, description, creator_display_name, creator_user_id, created_at, status")
      .eq("status", "flagged")
      .order("created_at", { ascending: false })
      .limit(100),
    // shared_insights may or may not exist depending on v1.3 activation; use try/catch shape
    admin
      .from("shared_insights")
      .select("slug, content, display_name, user_id, created_at, status")
      .eq("status", "flagged")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return NextResponse.json({
    ok: true,
    threads: threads.data ?? [],
    replies: replies.data ?? [],
    journeys: journeys.data ?? [],
    insights: insights.data ?? [],
  });
}

/**
 * POST /api/admin/moderation
 * Body: { kind: 'thread'|'reply'|'journey'|'insight', id: string, action: 'approve'|'remove'|'keep' }
 */
export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const admin = gate.admin;

  const body = (await req.json().catch(() => ({}))) as {
    kind?: "thread" | "reply" | "journey" | "insight";
    id?: string;
    action?: "approve" | "remove" | "keep";
  };

  if (!body.kind || !body.id || !body.action) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const nextStatus =
    body.action === "approve"
      ? "published"
      : body.action === "remove"
      ? "removed"
      : "flagged";

  const tableMap: Record<string, { table: string; pk: string }> = {
    thread: { table: "threads", pk: "id" },
    reply: { table: "thread_replies", pk: "id" },
    journey: { table: "creator_journeys", pk: "slug" },
    insight: { table: "shared_insights", pk: "slug" },
  };

  const target = tableMap[body.kind];
  if (!target) {
    return NextResponse.json({ error: "unknown_kind" }, { status: 400 });
  }

  const { error } = await admin
    .from(target.table)
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq(target.pk, body.id);

  if (error) {
    return NextResponse.json(
      { error: "db_error", details: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, status: nextStatus });
}
