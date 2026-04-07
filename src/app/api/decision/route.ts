import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { runDecisionPipeline, type DecisionInput } from "@/lib/decisionEngine";

export const dynamic = "force-dynamic";

/**
 * POST /api/decision
 * Runs the DPOS decision pipeline on user input.
 * Returns ONE clear decision + action step + anti-focus list.
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: DecisionInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Validate
  if (!body.goal?.shortTerm || body.goal.shortTerm.trim().length < 3) {
    return NextResponse.json({ ok: false, error: "missing_goal" }, { status: 400 });
  }

  // Run pipeline
  const decision = runDecisionPipeline(body);

  // Persist as a cognitive_action (best-effort)
  try {
    await auth.supabase.from("cognitive_actions").insert({
      user_id: auth.user.id,
      day: 1,
      type: "decision",
      label: decision.decision.slice(0, 200),
      description: decision.reasoning.slice(0, 500),
      suggested_next_step: decision.actionStep.slice(0, 500),
      priority: "high",
    });
  } catch {
    // Table may not exist yet
  }

  return NextResponse.json({
    ok: true,
    ...decision,
  });
}
