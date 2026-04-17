import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * GET /api/community/stats
 * Returns community-level stats (no PII):
 * - completedThisWeek: how many users completed day 28 in the last 7 days
 * - totalCompleted: how many users ever completed all 28 days
 * - activeToday: how many users logged awareness today
 */
export async function GET() {
  const admin = getSupabaseAdmin();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [completedWeekRes, totalCompletedRes, activeTodayRes] = await Promise.all([
    admin
      .from("awareness_logs")
      .select("user_id", { count: "exact", head: true })
      .eq("day", 28)
      .gte("created_at", weekAgo),
    admin
      .from("awareness_logs")
      .select("user_id", { count: "exact", head: true })
      .eq("day", 28),
    admin
      .from("awareness_logs")
      .select("user_id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
  ]);

  return NextResponse.json({
    ok: true,
    completedThisWeek: completedWeekRes.count ?? 0,
    totalCompleted: totalCompletedRes.count ?? 0,
    activeToday: activeTodayRes.count ?? 0,
  });
}
