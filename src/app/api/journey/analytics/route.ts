import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { readUserProgress } from "@/lib/progressStore";
import { buildProgressState } from "@/lib/progressEngine";
import { loadAndBuildIdentity } from "@/lib/identityTracker";

export const dynamic = "force-dynamic";

const TOTAL_DAYS = 28;

const LEGACY_TO_STATE: Record<string, "shadow" | "gift" | "best_possibility"> = {
  distracted: "shadow",
  tried: "gift",
  present: "best_possibility",
};

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { supabase, user } = auth;

  const [{ data: awarenessRows, error: awarenessError }, { data: answerRows, error: answersError }] =
    await Promise.all([
      supabase
        .from("awareness_logs")
        .select("day, level, created_at")
        .eq("user_id", user.id)
        .order("day", { ascending: true }),
      supabase
        .from("user_answers")
        .select("day, updated_at")
        .eq("user_id", user.id)
        .order("day", { ascending: true }),
    ]);

  if (awarenessError || answersError) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const answersSet = new Set<number>((answerRows ?? []).map((row) => Number(row.day)));
  const awarenessByDay = new Map<
    number,
    { state: "shadow" | "gift" | "best_possibility"; created_at: string | null }
  >();
  (awarenessRows ?? []).forEach((row) => {
    const day = Number(row.day);
    const state = LEGACY_TO_STATE[String(row.level ?? "")];
    if (!state) return;
    awarenessByDay.set(day, { state, created_at: row.created_at ?? null });
  });

  const timeline = Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const day = i + 1;
    const awareness = awarenessByDay.get(day);
    return {
      day,
      completed: answersSet.has(day),
      awareness_state: awareness?.state ?? null,
      awareness_score:
        awareness?.state === "shadow" ? 1 : awareness?.state === "gift" ? 2 : awareness?.state === "best_possibility" ? 3 : null,
      recorded_at: awareness?.created_at ?? null,
    };
  });

  const completedCount = timeline.filter((item) => item.completed).length;
  const awarenessScores = timeline
    .map((item) => item.awareness_score)
    .filter((item): item is number => typeof item === "number");

  const metrics = {
    completion_percent: Math.round((completedCount / TOTAL_DAYS) * 100),
    completed_days: completedCount,
    total_days: TOTAL_DAYS,
    awareness_avg: awarenessScores.length
      ? Number((awarenessScores.reduce((sum, value) => sum + value, 0) / awarenessScores.length).toFixed(2))
      : 0,
    awareness_entries: awarenessScores.length,
  };

  // V2: Real-time cognitive metrics
  let cognitive = null;
  try {
    const progress = await readUserProgress(supabase, user.id);
    if (progress.ok) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_start_date")
        .eq("id", user.id)
        .maybeSingle();

      const state = buildProgressState(
        progress.currentDay,
        progress.completedDays,
        profile?.subscription_start_date
      );

      const identity = await loadAndBuildIdentity(
        supabase,
        user.id,
        progress.completedDays,
        progress.currentDay
      );

      // Identity shift history (last N snapshots)
      const identityShiftHistory = identity.identityTimeline.map((snap) => ({
        date: snap.date,
        engagementScore: snap.engagementScore,
        trajectory: snap.trajectory,
      }));

      // Adjust awareness_avg weighting by recent identity shifts
      const recentShifts = identityShiftHistory.slice(-5);
      const trajectoryBoost = recentShifts.filter((s) => s.trajectory === "improving").length / Math.max(1, recentShifts.length);
      const adjustedAvg = metrics.awareness_avg * (1 + trajectoryBoost * 0.2);

      cognitive = {
        momentum: state.momentum,
        emotional_drift: state.emotionalDrift,
        mode: state.mode,
        streak: state.streak,
        trajectory: identity.trajectory,
        transformation_signal: identity.transformationSignal,
        engagement_score: identity.engagementScore,
        identity_shift_history: identityShiftHistory,
        adjusted_awareness_avg: Number(adjustedAvg.toFixed(2)),
      };
    }
  } catch {
    // Cognitive metrics are optional — fall back to legacy response
  }

  return NextResponse.json({
    ok: true,
    metrics,
    timeline,
    cognitive,
  });
}
