import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { readUserProgress } from "@/lib/progressStore";
import { computeCalendarDay } from "@/lib/calendarDay";
import { buildProgressState } from "@/lib/progressEngine";
import { loadAndBuildIdentity } from "@/lib/identityTracker";
import { buildNarrativeMemory } from "@/lib/narrative/memory";

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

  // Read progress from DB
  const progress = await readUserProgress(supabase, user.id);
  const storedCompletedDays: number[] = progress.ok ? progress.completedDays : [];
  const storedCurrentDay = progress.ok ? progress.currentDay : 1;

  // Get subscription start date to compute real calendar day
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_start_date")
    .eq("id", user.id)
    .maybeSingle();

  const subscriptionStartDate = profile?.subscription_start_date ?? null;
  const calendarDay = computeCalendarDay(subscriptionStartDate);
  const effectiveCurrentDay = Math.max(storedCurrentDay, calendarDay);

  // If completed_days array is empty but user is past day 1,
  // infer days 1..(effectiveCurrentDay-1) as completed
  let completedDaysArr = storedCompletedDays;
  if (completedDaysArr.length === 0 && effectiveCurrentDay > 1) {
    completedDaysArr = Array.from({ length: effectiveCurrentDay - 1 }, (_, i) => i + 1);
  }

  const completedDaysSet = new Set<number>(completedDaysArr);

  const { data: awarenessRows, error: awarenessError } = await supabase
    .from("awareness_logs")
    .select("day, level, created_at")
    .eq("user_id", user.id)
    .order("day", { ascending: true });

  // awareness_logs failure is non-fatal — continue with empty data

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
      completed: completedDaysSet.has(day),
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
    if (progress.ok) {
      const state = buildProgressState(
        storedCurrentDay,
        completedDaysArr,
        subscriptionStartDate
      );

      const identity = await loadAndBuildIdentity(
        supabase,
        user.id,
        completedDaysArr,
        effectiveCurrentDay
      );

      const identityShiftHistory = identity.identityTimeline.map((snap) => ({
        date: snap.date,
        engagementScore: snap.engagementScore,
        trajectory: snap.trajectory,
      }));

      const recentShifts = identityShiftHistory.slice(-5);
      const trajectoryBoost = recentShifts.filter((s) => s.trajectory === "improving").length / Math.max(1, recentShifts.length);
      const adjustedAvg = metrics.awareness_avg * (1 + trajectoryBoost * 0.2);

      const narrativeDays = timeline
        .filter((t) => t.completed && t.awareness_state)
        .map((t) => ({
          day: t.day,
          state: t.awareness_state ?? "shadow",
        }));
      const narrativeMemory = narrativeDays.length > 0
        ? buildNarrativeMemory({ lastDays: narrativeDays })
        : [];

      const engagementCurve = identityShiftHistory.length > 0
        ? Number((
            identityShiftHistory.reduce((sum, s) => sum + s.engagementScore, 0) /
            identityShiftHistory.length
          ).toFixed(2))
        : identity.engagementScore;

      const identityReflections = identityShiftHistory.slice(-5);

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
        identity_reflections: identityReflections,
        narrative_memory: narrativeMemory,
        engagement_curve: engagementCurve,
      };
    }
  } catch {
    // Cognitive metrics are optional
  }

  return NextResponse.json({
    ok: true,
    metrics,
    timeline,
    cognitive,
  });
}
