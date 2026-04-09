import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { ensureUserProgress } from "@/lib/progressStore";
import { buildTimeline } from "@/lib/journey/timeline";
import { composeNarrative } from "@/lib/journey/narrative";
import { getTaamunDailyByDay } from "@/lib/taamun-daily";
import {
  normalizeJourneyState,
  type UserJourneyState,
} from "@/lib/journey/memory";

export const dynamic = "force-dynamic";

/**
 * GET /api/journey/timeline
 *
 * The unified spine. Merges THREE independent sources:
 *   1. reflections table          → notes written by the user
 *   2. progress.completed_days    → day completions marked via DailyJourney
 *   3. V9 journey_state.completedSteps → backup completion source
 *
 * Returns: Timeline (phase-grouped facts) + NarrativeSnapshot (story lines).
 *
 * This is what /progress reads. No more disconnected pages. No more
 * "I completed day 6 but الدفتر is empty".
 */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { supabase, user } = auth;

  const [reflectionsRes, progress, memRes] = await Promise.all([
    supabase
      .from("reflections")
      .select("day, note, created_at, updated_at")
      .eq("user_id", user.id)
      .order("day", { ascending: true }),
    ensureUserProgress(supabase, user.id),
    supabase
      .from("user_memory")
      .select("identity")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (reflectionsRes.error) {
    return NextResponse.json({ ok: false, error: "reflections_failed" }, { status: 500 });
  }
  if (!progress.ok) {
    return NextResponse.json({ ok: false, error: "progress_failed" }, { status: 500 });
  }

  // Pull V9 completedSteps from user_memory.identity.journey_state (optional)
  const stored = (memRes.data?.identity as { journey_state?: Partial<UserJourneyState> } | null)
    ?.journey_state;
  const journeyState = normalizeJourneyState(stored, user.id);

  // Enrich each day with theme + verse from static content
  const reflectionDays = (reflectionsRes.data ?? []).map((r) => Number(r.day));
  const uniqueDays = new Set<number>([
    ...reflectionDays,
    ...progress.completedDays,
  ]);
  const dayMeta: Record<number, { theme?: string | null; verseArabic?: string | null }> = {};
  for (const d of uniqueDays) {
    const entry = getTaamunDailyByDay(d);
    if (entry) {
      dayMeta[d] = {
        theme: entry.theme ?? entry.title ?? null,
        verseArabic: entry.verse?.arabic ?? null,
      };
    }
  }

  const timeline = buildTimeline({
    reflections: (reflectionsRes.data ?? []).map((r) => ({
      day: Number(r.day),
      note: (r.note as string | null) ?? null,
      created_at: (r.created_at as string | null) ?? null,
      updated_at: (r.updated_at as string | null) ?? null,
    })),
    completedDays: progress.completedDays,
    completedSteps: journeyState.completedSteps,
    dayMeta,
  });

  const narrative = composeNarrative(timeline);

  return NextResponse.json({
    ok: true,
    current_day: progress.currentDay,
    timeline,
    narrative,
  });
}
