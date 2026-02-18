import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { buildAwareness, type JournalAnswer } from "@/lib/awareness-engine";

export const dynamic = "force-dynamic";

function mapAnswer(row: Record<string, unknown>): JournalAnswer {
  return {
    day: Number(row.day ?? 0),
    observe: String(row.observe ?? ""),
    insight: String(row.insight ?? ""),
    contemplate: String(row.contemplate ?? ""),
    rebuild: row.rebuild ? String(row.rebuild) : null,
    ai_reflection: row.ai_reflection ? String(row.ai_reflection) : null,
  };
}

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { supabase, user } = auth;
  const { data, error } = await supabase
    .from("awareness_insights")
    .select(
      "week_number, insight_type, insight_text, clarity, responsibility, trust, surrender, evolution, updated_at"
    )
    .eq("user_id", user.id)
    .order("week_number", { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const weekly = (data ?? [])
    .filter((row) => row.insight_type === "weekly")
    .map((row) => ({
      week: row.week_number,
      insight: row.insight_text,
      scores: {
        clarity: row.clarity,
        responsibility: row.responsibility,
        trust: row.trust,
        surrender: row.surrender,
      },
      updated_at: row.updated_at,
    }));

  const final = (data ?? []).find((row) => row.insight_type === "final");

  return NextResponse.json({
    ok: true,
    weekly,
    final: final
      ? {
          insight: final.insight_text,
          scores: {
            clarity: final.clarity,
            responsibility: final.responsibility,
            trust: final.trust,
            surrender: final.surrender,
          },
          evolution: final.evolution ?? [],
          updated_at: final.updated_at,
        }
      : null,
  });
}

export async function POST() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { supabase, user } = auth;
  const { data: answers, error } = await supabase
    .from("user_answers")
    .select("day, observe, insight, contemplate, rebuild, ai_reflection")
    .eq("user_id", user.id)
    .order("day", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const engine = buildAwareness((answers ?? []).map((row) => mapAnswer(row)));
  const now = new Date().toISOString();
  const weeklyRows = engine.weeks.map((week) => ({
    user_id: user.id,
    week_number: week.week,
    insight_type: "weekly",
    insight_text: week.insight,
    clarity: week.scores.clarity,
    responsibility: week.scores.responsibility,
    trust: week.scores.trust,
    surrender: week.scores.surrender,
    evolution: null,
    updated_at: now,
  }));
  const finalRow = {
    user_id: user.id,
    week_number: null,
    insight_type: "final",
    insight_text: engine.finalInsight,
    clarity: engine.finalScores.clarity,
    responsibility: engine.finalScores.responsibility,
    trust: engine.finalScores.trust,
    surrender: engine.finalScores.surrender,
    evolution: engine.evolution,
    updated_at: now,
  };

  const { error: upsertWeeklyError } = await supabase
    .from("awareness_insights")
    .upsert(weeklyRows, { onConflict: "user_id,insight_type,week_number" });

  if (upsertWeeklyError) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const { error: upsertFinalError } = await supabase
    .from("awareness_insights")
    .upsert(finalRow, { onConflict: "user_id,insight_type,week_number" });
  if (upsertFinalError) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    weekly: engine.weeks,
    final: {
      insight: engine.finalInsight,
      scores: engine.finalScores,
      evolution: engine.evolution,
    },
  });
}
