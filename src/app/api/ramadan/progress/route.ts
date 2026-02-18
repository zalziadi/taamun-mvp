import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RAMADAN_PROGRAM_KEY } from "@/lib/appConfig";

export const dynamic = "force-dynamic";

const DEFAULT_PROGRAM_KEY = RAMADAN_PROGRAM_KEY;
const DEFAULT_VERSION = 1;
const TOTAL_DAYS = 28;

function isCompleted(row: {
  observe_text?: string | null;
  insight_text?: string | null;
  contemplate_text?: string | null;
}) {
  return Boolean(
    row.observe_text?.trim() && row.insight_text?.trim() && row.contemplate_text?.trim()
  );
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("ramadan_responses")
    .select("day,observe_text,insight_text,contemplate_text,updated_at")
    .eq("user_id", user.id)
    .eq("program_key", DEFAULT_PROGRAM_KEY)
    .eq("version", DEFAULT_VERSION)
    .order("day", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const rows = data ?? [];
  const completedDays = rows
    .filter((row) => isCompleted(row))
    .map((row) => Number(row.day))
    .filter((day, i, arr) => Number.isInteger(day) && day >= 1 && day <= TOTAL_DAYS && arr.indexOf(day) === i)
    .sort((a, b) => a - b);

  const savedDays = rows
    .map((row) => Number(row.day))
    .filter((day, i, arr) => Number.isInteger(day) && day >= 1 && day <= TOTAL_DAYS && arr.indexOf(day) === i)
    .sort((a, b) => a - b);

  const lastSavedDay = savedDays.length ? savedDays[savedDays.length - 1] : null;
  const lastCompletedDay = completedDays.length ? completedDays[completedDays.length - 1] : null;

  let streak = 0;
  if (lastCompletedDay !== null) {
    streak = 1;
    for (let i = completedDays.length - 1; i > 0; i--) {
      if (completedDays[i] - completedDays[i - 1] === 1) streak++;
      else break;
    }
  }

  const nextDay = lastCompletedDay ? Math.min(TOTAL_DAYS, lastCompletedDay + 1) : 1;

  return NextResponse.json({
    ok: true,
    totals: {
      totalDays: TOTAL_DAYS,
      completedCount: completedDays.length,
      completionRate: Math.round((completedDays.length / TOTAL_DAYS) * 100),
    },
    lastSavedDay,
    lastCompletedDay,
    streak,
    nextDay,
    completedDays,
  });
}
