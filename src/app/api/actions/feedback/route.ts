import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

type FeedbackBody = {
  actionId?: string;
  completed?: boolean;
  impact?: "low" | "medium" | "high";
  note?: string;
};

const VALID_IMPACTS = ["low", "medium", "high"] as const;

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: FeedbackBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const actionId = body.actionId;
  if (!actionId || typeof actionId !== "string") {
    return NextResponse.json({ ok: false, error: "missing_action_id" }, { status: 400 });
  }

  const completed = body.completed ?? false;
  const impact = VALID_IMPACTS.includes(body.impact as any) ? body.impact : null;
  const note = body.note ? String(body.note).slice(0, 1000) : null;
  const effectivenessScore = impact === "high" ? 8 : impact === "medium" ? 5 : impact === "low" ? 2 : null;

  const { supabase, user } = auth;

  const { error } = await supabase
    .from("cognitive_actions")
    .update({
      status: completed ? "completed" : "skipped",
      feedback_impact: impact,
      feedback_note: note,
      effectiveness_score: effectivenessScore,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", actionId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    actionId,
    status: completed ? "completed" : "skipped",
    impact,
  });
}
