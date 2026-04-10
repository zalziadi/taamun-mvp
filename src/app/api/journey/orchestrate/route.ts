/**
 * GET /api/journey/orchestrate
 *
 * The single endpoint that returns the full adaptive context for
 * any consumer (home page, city, debug page, future AI calls).
 *
 * Data flow:
 *   1. Read progress from Supabase (progress table)
 *   2. Read reflections from Supabase (reflections table with ai_* fields)
 *   3. Pass both into orchestrate() — the pure intelligence layer
 *   4. Return the full OrchestratorOutput
 *
 * Auth: requireUser (session cookies).
 * No localStorage, no V9 state, no client-side stores involved.
 */

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { ensureUserProgress } from "@/lib/progressStore";
import { orchestrate } from "@/lib/ai/orchestrate";
import type { ReflectionForAnalysis } from "@/lib/ai/patterns";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { supabase, user } = auth;

  // 1. Read progress from DB
  const progress = await ensureUserProgress(supabase, user.id);
  if (!progress.ok) {
    return NextResponse.json(
      { ok: false, error: "progress_read_failed" },
      { status: 500 }
    );
  }

  // 2. Read reflections with AI fields from DB
  const { data: reflectionRows, error: refError } = await supabase
    .from("reflections")
    .select("day, note, ai_sentiment, ai_theme, ai_mirror, updated_at")
    .eq("user_id", user.id)
    .order("day", { ascending: true });

  if (refError) {
    return NextResponse.json(
      { ok: false, error: "reflections_read_failed" },
      { status: 500 }
    );
  }

  const reflections: ReflectionForAnalysis[] = (reflectionRows ?? []).map(
    (r) => ({
      day: Number(r.day),
      note: (r.note as string | null) ?? null,
      ai_sentiment: (r.ai_sentiment as string | null) ?? null,
      ai_theme: (r.ai_theme as string | null) ?? null,
      ai_mirror: (r.ai_mirror as string | null) ?? null,
      updated_at: (r.updated_at as string | null) ?? null,
    })
  );

  // 3. Orchestrate — pure function, DB inputs only
  const output = orchestrate({
    currentDay: progress.currentDay,
    completedDays: progress.completedDays,
    reflections,
  });

  // 4. Return the full output
  return NextResponse.json({
    ok: true,
    ...output,
    // Flatten some fields for easier consumption
    currentDay: progress.currentDay,
    completedDays: progress.completedDays,
    completedCount: progress.completedDays.length,
  });
}
