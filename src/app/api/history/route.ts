import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { supabase, user } = auth;

  const { data: answers, error: answersError } = await supabase
    .from("user_answers")
    .select("day, observe, insight, contemplate, rebuild, ai_reflection, updated_at")
    .eq("user_id", user.id)
    .order("day", { ascending: true });

  if (answersError) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const days = (answers ?? []).map((row) => ({
    day: row.day,
    observe: row.observe ?? "",
    insight: row.insight ?? "",
    contemplate: row.contemplate ?? "",
    rebuild: row.rebuild ?? "",
    ai_reflection: row.ai_reflection ?? "",
    updated_at: row.updated_at,
  }));

  return NextResponse.json({
    ok: true,
    total_entries: days.length,
    days,
  });
}
