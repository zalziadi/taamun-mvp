import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { supabase, user } = auth;

  // Primary source: legacy program answers.
  const { data: answers, error: answersError } = await supabase
    .from("user_answers")
    .select("day, observe, insight, contemplate, rebuild, ai_reflection, updated_at")
    .eq("user_id", user.id)
    .order("day", { ascending: true });

  if (!answersError) {
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
      source: "user_answers",
      total_entries: days.length,
      days,
    });
  }

  // Fallback source: current reflections table.
  const { data: reflections, error: reflectionsError } = await supabase
    .from("reflections")
    .select("day, note, updated_at")
    .eq("user_id", user.id)
    .order("day", { ascending: true });

  if (!reflectionsError) {
    const days = (reflections ?? []).map((row) => ({
      day: row.day,
      observe: row.note ?? "",
      insight: "",
      contemplate: "",
      rebuild: "",
      ai_reflection: "",
      updated_at: row.updated_at,
    }));

    return NextResponse.json({
      ok: true,
      source: "reflections",
      total_entries: days.length,
      days,
    });
  }

  // Last fallback: keep journal page functional with empty payload.
  return NextResponse.json({
    ok: true,
    source: "empty_fallback",
    total_entries: 0,
    days: [],
    warning: "history_unavailable",
  });
}
