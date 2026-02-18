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

  const rows = (data ?? []) as ResponseRow[];
  const totalEntries = rows.length;
  const completedEntries = rows.filter(isCompleted).length;
  const completionRateOverall = totalEntries
    ? Number(((completedEntries / totalEntries) * 100).toFixed(2))
    : 0;

  const uniqueUsers = new Set(rows.map((row) => row.user_id)).size;

  const completedPerDay = new Map<number, number>();
  for (let day = 1; day <= 28; day++) completedPerDay.set(day, 0);
  for (const row of rows) {
    if (isCompleted(row)) {
      completedPerDay.set(row.day, (completedPerDay.get(row.day) ?? 0) + 1);
    }
  }

  const dayStats = Array.from(completedPerDay.entries()).map(([day, count]) => ({ day, count }));
  const bestDay = dayStats.reduce(
    (best, current) => (current.count > best.count ? current : best),
    { day: 1, count: -1 }
  );
  const nonZeroDays = dayStats.filter((d) => d.count > 0);
  const worstPool = nonZeroDays.length > 0 ? nonZeroDays : dayStats;
  const worstDay = worstPool.reduce(
    (worst, current) => (current.count < worst.count ? current : worst),
    worstPool[0] ?? { day: 1, count: 0 }
  );

  return NextResponse.json({
    ok: true,
    totalUsersDistinct: uniqueUsers,
    totalEntries,
    completedEntries,
    completionRateOverall,
    bestDay,
    worstDay,
  });
}
