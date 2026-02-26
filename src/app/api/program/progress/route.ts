import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { ensureUserProgress, upsertUserProgress } from "@/lib/progressStore";

export const dynamic = "force-dynamic";

const TOTAL_DAYS = 28;

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
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const progress = await ensureUserProgress(auth.supabase, auth.user.id);
  if (!progress.ok) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const percent = Math.round((progress.completedDays.length / TOTAL_DAYS) * 100);

  return NextResponse.json({
    ok: true,
    total_days: TOTAL_DAYS,
    current_day: progress.currentDay,
    completed_days: progress.completedDays,
    completed_count: progress.completedDays.length,
    percent,
  });
}

export async function POST(request: Request) {
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
  const currentDay = completedDays.includes(progress.currentDay)
    ? Math.min(TOTAL_DAYS, progress.currentDay + 1)
    : progress.currentDay;

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
