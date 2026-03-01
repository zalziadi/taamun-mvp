import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { listAllProgressRows } from "@/lib/progressStore";

export const dynamic = "force-dynamic";

interface ProgressRow {
  user_id: string;
  current_day: number | null;
  completed_days: string[] | null;
}

interface AwarenessRow {
  user_id: string;
  insight_type: string;
}

interface AnswerRow {
  user_id: string;
  day: number;
}

export async function GET() {
  let adminAuth: Awaited<ReturnType<typeof requireAdmin>>;

  try {
    adminAuth = await requireAdmin();
  } catch (err) {
    const message = err instanceof Error ? err.message : "server_error";
    const isMissingEnv =
      message.includes("Missing Supabase env") ||
      message.includes("SUPABASE_URL") ||
      message.includes("SUPABASE_ANON_KEY");

    return NextResponse.json(
      {
        ok: false,
        error: isMissingEnv ? "missing_supabase_env" : "server_error",
        detail: isMissingEnv
          ? "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in environment"
          : message,
      },
      { status: 500 }
    );
  }

  if (!adminAuth.ok) return adminAuth.response;

  const supabase = adminAuth.admin;

  const [answersRes, progressRes, awarenessRes] = await Promise.all([
    supabase.from("user_answers").select("user_id, day"),
    listAllProgressRows(supabase),
    supabase.from("awareness_insights").select("user_id, insight_type"),
  ]);

  if (answersRes.error || !progressRes.ok || awarenessRes.error) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const answerRows = (answersRes.data ?? []) as AnswerRow[];
  const progressRows = (progressRes.data ?? []) as ProgressRow[];
  const awarenessRows = (awarenessRes.data ?? []) as AwarenessRow[];

  const uniqueUsers = new Set<string>();
  for (const row of answerRows) uniqueUsers.add(row.user_id);
  for (const row of progressRows) uniqueUsers.add(row.user_id);

  const completed28 = progressRows.filter(
    (row) => (row.completed_days ?? []).length >= 28
  ).length;

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
