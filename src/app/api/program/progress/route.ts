import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { ensureUserProgress, upsertUserProgress } from "@/lib/progressStore";
import { isRamadanProgramClosed } from "@/lib/season";
import { computeCalendarDay } from "@/lib/calendarDay";

export const dynamic = "force-dynamic";

const TOTAL_DAYS = 28;

/** Fetch subscription_start_date from profiles and compute the calendar day. */
async function getCalendarDay(supabase: any, userId: string): Promise<number> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_start_date")
    .eq("id", userId)
    .maybeSingle();

  return computeCalendarDay(profile?.subscription_start_date);
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

  // Use the higher of stored progress vs calendar-based day
  const calendarDay = await getCalendarDay(auth.supabase, auth.user.id);
  const currentDay = Math.max(progress.currentDay, calendarDay);

  // Sync DB if calendar day moved ahead
  if (currentDay > progress.currentDay) {
    await upsertUserProgress(auth.supabase, auth.user.id, {
      currentDay,
      completedDays: progress.completedDays,
    });
  }

  const percent = Math.round((progress.completedDays.length / TOTAL_DAYS) * 100);

  return NextResponse.json({
    ok: true,
    total_days: TOTAL_DAYS,
    current_day: currentDay,
    completed_days: progress.completedDays,
    completed_count: progress.completedDays.length,
    percent,
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

  // Calendar day is the minimum unlocked day based on time elapsed
  const calendarDay = await getCalendarDay(auth.supabase, auth.user.id);
  // Completion-based advancement: if user completed current day, bump by 1
  const completionDay = completedDays.includes(progress.currentDay)
    ? Math.min(TOTAL_DAYS, progress.currentDay + 1)
    : progress.currentDay;
  // Use the highest of: stored, calendar-based, or completion-based
  const currentDay = Math.max(completionDay, calendarDay);

  const saved = await upsertUserProgress(auth.supabase, auth.user.id, {
    currentDay,
    completedDays,
  });
  if (!saved.ok) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

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
