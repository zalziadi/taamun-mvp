import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { emitEvent } from "@/lib/analytics/server";

/**
 * POST /api/program/start-cycle
 * Starts a new cycle for the user.
 *
 * Archives current completed_days into completed_cycles[] and resets progress.
 * Day 1 of the new cycle shows cycle-2 (or cycle-3) content.
 *
 * Request body: {
 *   cycle?: number;                   // the cycle to start (2, 3, 4...)
 *   expected_current_cycle?: number;  // optimistic-concurrency guard (RETURN-02)
 * }
 *
 * Concurrency model (Phase 7 / RETURN-02):
 *   - Client sends `expected_current_cycle` = the cycle it BELIEVES the user is
 *     on. Server compares against the DB row; on mismatch the request is the
 *     race-loser and returns 409 with no side effects (no row mutation, no
 *     analytics event). This delivers ROADMAP Phase 7 Success Criterion #3.
 *
 * Analytics (RETURN-07):
 *   - EXACTLY ONE `cycle_start` TypedEvent is fired on the success path via
 *     the analytics emitter. Never fired on 401 / 409 / 500. Plan 07.02's
 *     grep probe enforces the single-call-site invariant structurally.
 */
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    cycle?: number;
    expected_current_cycle?: number;
  };
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

  // --- RETURN-02: Optimistic-concurrency guard ---
  // If the client declared an expected current cycle and the DB disagrees,
  // another device/tab already won the transition. Return 409 WITHOUT any
  // mutation and WITHOUT firing the analytics event.
  const dbCurrentCycle =
    typeof progress?.current_cycle === "number" ? progress.current_cycle : undefined;
  const expectedCurrentCycle =
    typeof body.expected_current_cycle === "number"
      ? body.expected_current_cycle
      : dbCurrentCycle ?? 1;

  if (dbCurrentCycle !== undefined && dbCurrentCycle !== expectedCurrentCycle) {
    return NextResponse.json(
      { error: "cycle_race", current_cycle: dbCurrentCycle },
      { status: 409 },
    );
  }

  // Two-step write pattern:
  //   (a) If a row exists → conditional .update() guarded by .eq("current_cycle", expected).
  //       The conditional WHERE clause is the DB-level race-loser check for the window
  //       between our SELECT and our UPDATE.
  //   (b) If no row exists → .insert() (new-user edge case).
  //
  // plan-checker gap #1 (2026-04-19): the update ALSO sets `cycle_paused_at =
  // now()` so that Plan 07.01's new column earns its place — future
  // race-detection windows can read it to distinguish "paused mid-transition"
  // from "never started a transition".

  let upsertErr: { code?: string; message?: string } | null = null;

  if (progress) {
    // Existing row → conditional update with optimistic concurrency
    const { data: updated, error: updErr } = await admin
      .from("progress")
      .update({
        completed_days: [],
        current_day: 1,
        current_cycle: targetCycle,
        completed_cycles: newArchive,
        cycle_paused_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("current_cycle", expectedCurrentCycle)
      .select();

    if (updErr) {
      upsertErr = updErr;
    } else if (!updated || updated.length === 0) {
      // Zero rows matched the guard — another writer won the race between our
      // SELECT above and this UPDATE. Return 409 with a best-effort report of
      // the latest `current_cycle` value we observed.
      return NextResponse.json(
        { error: "cycle_race", current_cycle: dbCurrentCycle ?? expectedCurrentCycle },
        { status: 409 },
      );
    }
  } else {
    // New-user edge case → plain insert
    const { error: insErr } = await admin.from("progress").insert({
      user_id: userId,
      completed_days: [],
      current_day: 1,
      current_cycle: targetCycle,
      completed_cycles: newArchive,
      updated_at: new Date().toISOString(),
    });
    if (insErr) upsertErr = insErr;
  }

  // PITFALL #2: silent fallback narrowed to undefined_column only — do not
  // swallow other errors. The legacy "retry without cycle columns" path
  // existed to survive pre-migration environments where `current_cycle` /
  // `completed_cycles` / `cycle_paused_at` columns did not yet exist. Any
  // OTHER DB failure (RLS, constraint, connectivity) must NOT be silently
  // reset to cycle 1 — that's how users lost their transition state before
  // Plan 07.01.
  if (upsertErr) {
    if (upsertErr.code === "42703") {
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
          { status: 500 },
        );
      }
    } else {
      return NextResponse.json(
        { error: "db_error", details: upsertErr.message },
        { status: 500 },
      );
    }
  }

  // --- RETURN-07: emit `cycle_start` event exactly ONCE on success path ---
  // Tier is sourced from profiles.subscription_tier (the project's canonical
  // column; see src/app/api/program/progress/route.ts for the same pattern).
  // Graceful fallback to "unknown" when the SELECT fails or returns null.
  let tier = "unknown";
  try {
    const { data: profileRow } = await admin
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .maybeSingle();
    if (profileRow?.subscription_tier) tier = String(profileRow.subscription_tier);
  } catch {
    // Non-fatal — emit event with "unknown" tier.
  }

  // Fire-and-forget — emitEvent is already best-effort and never throws.
  void emitEvent(
    {
      name: "cycle_start",
      properties: {
        new_cycle_number: targetCycle,
        prior_cycle_days_completed: currentCompleted.length,
        tier,
      },
    },
    userId,
  );

  return NextResponse.json({
    ok: true,
    cycle: targetCycle,
    archived: currentCompleted.length,
    completed_cycles: newArchive,
  });
}
