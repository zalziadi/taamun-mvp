import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { RAMADAN_PROGRAM_KEY } from "@/lib/appConfig";

export const dynamic = "force-dynamic";
const PROGRAM_KEY = RAMADAN_PROGRAM_KEY;
const VERSION = 1;

type ResponseRow = {
  day: number;
  observe_text: string | null;
  insight_text: string | null;
  contemplate_text: string | null;
  user_id: string;
};

function isCompleted(row: ResponseRow) {
  return Boolean(
    row.observe_text?.trim() && row.insight_text?.trim() && row.contemplate_text?.trim()
  );
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.admin
    .from("ramadan_responses")
    .select("day, observe_text, insight_text, contemplate_text, user_id")
    .eq("program_key", PROGRAM_KEY)
    .eq("version", VERSION);

  if (error) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const userMap = new Map<
    string,
    {
      days: Set<number>;
      lastCompletedDay: number;
    }
  >();

  for (const row of (data ?? []) as ResponseRow[]) {
    if (!isCompleted(row)) continue;
    const existing = userMap.get(row.user_id) ?? { days: new Set<number>(), lastCompletedDay: 0 };
    existing.days.add(row.day);
    if (row.day > existing.lastCompletedDay) existing.lastCompletedDay = row.day;
    userMap.set(row.user_id, existing);
  }

  const users = Array.from(userMap.entries())
    .map(([user_id, value]) => {
      const completedDaysCount = value.days.size;
      const completionRate = Number(((completedDaysCount / 28) * 100).toFixed(2));
      return {
        user_id,
        completedDaysCount,
        completionRate,
        lastCompletedDay: value.lastCompletedDay,
      };
    })
    .sort((a, b) => b.completionRate - a.completionRate);

  return NextResponse.json({
    ok: true,
    users,
  });
}
