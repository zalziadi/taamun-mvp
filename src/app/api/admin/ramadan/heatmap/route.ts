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
    .select("day, observe_text, insight_text, contemplate_text")
    .eq("program_key", PROGRAM_KEY)
    .eq("version", VERSION);

  if (error) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const counts = Array.from({ length: 28 }, (_, i) => ({ day: i + 1, completedCount: 0 }));
  for (const row of (data ?? []) as ResponseRow[]) {
    if (isCompleted(row) && row.day >= 1 && row.day <= 28) {
      counts[row.day - 1].completedCount += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    days: counts,
  });
}
