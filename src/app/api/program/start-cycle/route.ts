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

  // Read current progress (including cycle columns if they exist)
  const { data: progress } = await admin
    .from("progress")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const currentCompleted = Array.isArray(progress?.completed_days)
    ? progress!.completed_days
    : [];
  const currentCycles = Array.isArray(progress?.completed_cycles)
    ? (progress.completed_cycles as number[])
    : [];

  // Archive the cycle the user just finished (targetCycle - 1)
  const finishedCycle = targetCycle - 1;
  const newArchive = currentCycles.includes(finishedCycle)
    ? currentCycles
    : [...currentCycles, finishedCycle];

  // Build upsert payload — include cycle columns optimistically
  const fullPayload: Record<string, unknown> = {
    user_id: userId,
    completed_days: [],
    current_day: 1,
    current_cycle: targetCycle,
    completed_cycles: newArchive,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertErr } = await admin
    .from("progress")
    .upsert(fullPayload, { onConflict: "user_id" });

  // Fallback: if cycle columns don't exist yet, retry without them
  if (upsertErr) {
    const minimalPayload = {
      user_id: userId,
      completed_days: [],
      current_day: 1,
      updated_at: new Date().toISOString(),
    };
    const { error: retryErr } = await admin
      .from("progress")
      .upsert(minimalPayload, { onConflict: "user_id" });
    if (retryErr) {
      return NextResponse.json(
        { error: "db_error", details: retryErr.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    cycle: targetCycle,
    archived: currentCompleted.length,
    completed_cycles: newArchive,
  });
}
