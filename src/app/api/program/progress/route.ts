import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { ensureUserProgress, upsertUserProgress } from "@/lib/progressStore";
import { isRamadanProgramClosed } from "@/lib/season";
import { computeCalendarDay } from "@/lib/calendarDay";
import { buildProgressState, buildCatchUpData } from "@/lib/progressEngine";
import { buildJourneyState, classifyDepth, type JourneyInputs } from "@/lib/journeyState";
import { emitEvent } from "@/lib/analytics/server";

export const dynamic = "force-dynamic";

const TOTAL_DAYS = 28;

async function getSubscriptionStartDate(supabase: any, userId: string): Promise<string | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_start_date")
    .eq("id", userId)
    .maybeSingle();
  return profile?.subscription_start_date ?? null;
}

async function getRecentRecovery(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("cognitive_actions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function getJourneyInputs(supabase: any, userId: string, progress: any): Promise<JourneyInputs> {
  const [reflectionsRes, actionsRes] = await Promise.all([
    supabase.from("reflections").select("day, note").eq("user_id", userId).order("day", { ascending: false }).limit(5),
    supabase.from("cognitive_actions").select("id").eq("user_id", userId).eq("status", "completed").gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
  ]);

  const reflections = reflectionsRes.data ?? [];
  const lastNote = reflections[0]?.note ?? "";
  const lastDay = reflections[0]?.day ?? 0;
  const daysSinceLastReflection = lastDay > 0 ? progress.currentDay - lastDay : progress.currentDay;

  return {
    progress,
    reflectionCount: reflections.length,
    lastReflectionDepth: classifyDepth(lastNote.length),
    actionsCompletedRecently: actionsRes.data?.length ?? 0,
    daysSinceLastReflection,
  };
}

function normalizeCompletedDays(values: unknown): number[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 1 && value <= TOTAL_DAYS)
    )
  ).sort((a, b) => a - b);
}

export async function GET() {
  if (isRamadanProgramClosed()) {
    return NextResponse.json({ ok: false, error: "season_closed" }, { status: 403 });
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const progress = await ensureUserProgress(auth.supabase, auth.user.id);
  if (!progress.ok) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const startDate = await getSubscriptionStartDate(auth.supabase, auth.user.id);
  const hasRecovery = await getRecentRecovery(auth.supabase, auth.user.id);

  const state = buildProgressState(
    progress.currentDay,
    progress.completedDays,
    startDate,
    hasRecovery
  );

  // Sync DB if effective day moved ahead
  if (state.currentDay > progress.currentDay) {
    await upsertUserProgress(auth.supabase, auth.user.id, {
      currentDay: state.currentDay,
      completedDays: progress.completedDays,
    });
  }

  // Track drift history
  if (state.drift > 0) {
    try {
      await auth.supabase.rpc("append_drift_history", {
        p_user_id: auth.user.id,
        p_drift: state.drift,
      });
    } catch {
      // RPC may not exist yet — safe to ignore
    }
  }

  // Build journey state
  const journeyInputs = await getJourneyInputs(auth.supabase, auth.user.id, state);
  const journeyState = buildJourneyState(journeyInputs);

  const catchUp = buildCatchUpData(state);
  const percent = Math.round((progress.completedDays.length / TOTAL_DAYS) * 100);

  // Fetch cycle columns (graceful fallback if schema not yet migrated)
  let currentCycle = 1;
  let completedCycles: number[] = [];
  try {
    const { data: cycleRow } = await auth.supabase
      .from("progress")
      .select("current_cycle, completed_cycles")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (cycleRow?.current_cycle) currentCycle = cycleRow.current_cycle;
    if (Array.isArray(cycleRow?.completed_cycles)) completedCycles = cycleRow.completed_cycles;
  } catch {
    // Schema doesn't have cycle columns yet — default to cycle 1
  }

  return NextResponse.json({
    ok: true,
    total_days: TOTAL_DAYS,
    current_day: state.currentDay,
    completed_days: state.completedDays,
    completed_count: state.completedDays.length,
    percent,
    // Cycle fields
    current_cycle: currentCycle,
    completed_cycles: completedCycles,
    // Cognitive fields
    drift: state.drift,
    mode: state.mode,
    missed_days: state.missedDays,
    streak: state.streak,
    completion_rate: state.completionRate,
    momentum: state.momentum,
    emotional_drift: state.emotionalDrift,
    catch_up: catchUp,
    journey_state: journeyState,
  });
}

export async function POST(request: Request) {
  if (isRamadanProgramClosed()) {
    return NextResponse.json({ ok: false, error: "season_closed" }, { status: 403 });
  }

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: { day?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const day = Number(body.day);
  if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) {
    return NextResponse.json({ ok: false, error: "invalid_day" }, { status: 400 });
  }

  const progress = await ensureUserProgress(auth.supabase, auth.user.id);
  if (!progress.ok) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const completedDays = Array.from(new Set([...progress.completedDays, day])).sort((a, b) => a - b);

  const startDate = await getSubscriptionStartDate(auth.supabase, auth.user.id);
  const calendarDay = computeCalendarDay(startDate);
  const completionDay = completedDays.includes(progress.currentDay)
    ? Math.min(TOTAL_DAYS, progress.currentDay + 1)
    : progress.currentDay;
  // Only factor in calendarDay if user has been actively participating
  const currentDay = completedDays.length > 0
    ? Math.max(completionDay, calendarDay)
    : completionDay;

  const saved = await upsertUserProgress(auth.supabase, auth.user.id, {
    currentDay,
    completedDays,
  });
  if (!saved.ok) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  // --- ANALYTICS-03: day_complete event (Plan 06.04) ---
  // Fires ONLY on successful upsert. Uses the shared `progress` table's
  // current_cycle column with graceful fallback (matches the GET handler's
  // pattern — schema may not yet have the cycle columns in all envs).
  // Tier is sourced from profiles.subscription_tier (the project's canonical
  // column; see src/app/auth/callback/route.ts and others).
  let currentCycle = 1;
  try {
    const { data: cycleRow } = await auth.supabase
      .from("progress")
      .select("current_cycle")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (cycleRow?.current_cycle) currentCycle = cycleRow.current_cycle;
  } catch {
    // Schema doesn't have cycle columns yet — default to cycle 1.
  }

  let tier = "unknown";
  try {
    const { data: profileRow } = await auth.supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (profileRow?.subscription_tier) tier = String(profileRow.subscription_tier);
  } catch {
    // Non-fatal — emit event with "unknown" tier.
  }

  // Fire-and-forget — emitEvent is already best-effort and never throws.
  void emitEvent(
    {
      name: "day_complete",
      properties: {
        day_number: day,
        cycle_number: Number(currentCycle ?? 1),
        tier,
      },
    },
    auth.user.id,
  );

  return NextResponse.json({
    ok: true,
    total_days: TOTAL_DAYS,
    current_day: currentDay,
    completed_days: completedDays,
    completed_count: completedDays.length,
    percent: Math.round((completedDays.length / TOTAL_DAYS) * 100),
    day_completed: day,
  });
}
