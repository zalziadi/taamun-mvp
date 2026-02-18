import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

const TOTAL_DAYS = 28;

function uniqueSortedDays(values: number[]) {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: { day?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const day = Number(body.day);
  if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) {
    return NextResponse.json({ ok: false, error: "invalid_day" }, { status: 400 });
  }

  const { supabase, user } = auth;

  const { data: answer, error: answerError } = await supabase
    .from("user_answers")
    .select("day")
    .eq("user_id", user.id)
    .eq("day", day)
    .maybeSingle();

  if (answerError) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
  if (!answer) {
    return NextResponse.json({ ok: false, error: "answers_required" }, { status: 403 });
  }

  const { data: progress, error: progressError } = await supabase
    .from("user_progress")
    .select("current_day, completed_days")
    .eq("user_id", user.id)
    .maybeSingle();

  if (progressError) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const currentDay = progress?.current_day ?? 1;
  const completedDays = Array.isArray(progress?.completed_days) ? progress.completed_days : [];

  if (day > currentDay) {
    return NextResponse.json(
      { ok: false, error: "locked_day", current_day: currentDay },
      { status: 400 }
    );
  }

  const nextCompleted = uniqueSortedDays([...completedDays, day]);
  const nextCurrent = day === currentDay ? Math.min(TOTAL_DAYS, currentDay + 1) : currentDay;

  const { error: upsertError } = await supabase.from("user_progress").upsert(
    {
      user_id: user.id,
      current_day: nextCurrent,
      completed_days: nextCompleted,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (upsertError) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    current_day: nextCurrent,
    completed_days: nextCompleted,
    total_days: TOTAL_DAYS,
  });
}
