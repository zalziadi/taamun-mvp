import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function GET() {
  const adminAuth = await requireAdmin();
  if (!adminAuth.ok) return adminAuth.response;

  const supabase = adminAuth.admin;

  const [answersRes, progressRes, awarenessRes] = await Promise.all([
    supabase.from("user_answers").select("user_id, day"),
    supabase.from("user_progress").select("user_id, current_day, completed_days"),
    supabase.from("awareness_insights").select("user_id, insight_type"),
  ]);

  if (answersRes.error || progressRes.error || awarenessRes.error) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const answerRows = answersRes.data ?? [];
  const progressRows = progressRes.data ?? [];
  const awarenessRows = awarenessRes.data ?? [];

  const uniqueUsers = new Set<string>();
  for (const row of answerRows) uniqueUsers.add(row.user_id);
  for (const row of progressRows) uniqueUsers.add(row.user_id);

  const completed28 = progressRows.filter((row) => (row.completed_days ?? []).length >= 28).length;
  const weeklyInsights = awarenessRows.filter((row) => row.insight_type === "weekly").length;
  const finalInsights = awarenessRows.filter((row) => row.insight_type === "final").length;

  return NextResponse.json({
    ok: true,
    metrics: {
      users_active: uniqueUsers.size,
      answers_total: answerRows.length,
      users_completed_28: completed28,
      weekly_insights_total: weeklyInsights,
      final_insights_total: finalInsights,
    },
  });
}
