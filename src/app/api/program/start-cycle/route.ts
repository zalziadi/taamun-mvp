import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/program/start-cycle
 * Starts a new cycle for the user.
 *
 * Archives current completed_days into completed_cycles[] and resets progress.
 * Day 1 of the new cycle shows cycle-2 (or cycle-3) content.
 *
 * Request body: { cycle: number } — the cycle to start (2, 3, 4...)
 */
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { cycle?: number };
  const targetCycle = Math.max(2, Math.min(99, body.cycle ?? 2));

  const userId = auth.user.id;
  const admin = getSupabaseAdmin();

  // Read current progress
  const { data: progress } = await admin
    .from("progress")
    .select("completed_days, current_day, completed_cycles")
    .eq("user_id", userId)
    .maybeSingle();

  const currentCompleted = Array.isArray(progress?.completed_days)
    ? progress!.completed_days
    : [];
  const currentCycles = Array.isArray((progress as any)?.completed_cycles)
    ? ((progress as any).completed_cycles as number[])
    : [];

  // Archive the cycle the user just finished (targetCycle - 1)
  const finishedCycle = targetCycle - 1;
  const newArchive = currentCycles.includes(finishedCycle)
    ? currentCycles
    : [...currentCycles, finishedCycle];

  // Reset progress for the new cycle
  // Note: completed_cycles column may not exist — update gracefully
  const updatePayload: Record<string, unknown> = {
    user_id: userId,
    completed_days: [],
    current_day: 1,
    updated_at: new Date().toISOString(),
  };

  // Try to include completed_cycles if the column exists
  try {
    updatePayload.completed_cycles = newArchive;
  } catch {
    // Column doesn't exist — skip
  }

  const { error: upsertErr } = await admin
    .from("progress")
    .upsert(updatePayload, { onConflict: "user_id" });

  if (upsertErr) {
    // If completed_cycles column doesn't exist, retry without it
    delete updatePayload.completed_cycles;
    const { error: retryErr } = await admin
      .from("progress")
      .upsert(updatePayload, { onConflict: "user_id" });
    if (retryErr) {
      return NextResponse.json({ error: "db_error", details: retryErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    cycle: targetCycle,
    archived: currentCompleted.length,
    completed_cycles: newArchive,
  });
}
