import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { linkReflection } from "@/lib/reflectionLinker";
import { generateAction } from "@/lib/actionGenerator";
import { buildProgressState } from "@/lib/progressEngine";
import { readUserProgress } from "@/lib/progressStore";
import { computeCalendarDay } from "@/lib/calendarDay";
import { attachDecision } from "@/lib/decisionLayer";
import { generateNarrative } from "@/lib/narrativeEngine";
import { analyzeReflection } from "@/lib/ai/analyzeReflection";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { unlockBadge } from "@/lib/badges/unlock";
import { PROGRESSION_MILESTONES } from "@/lib/taamun-content";

export const dynamic = "force-dynamic";

const TOTAL_DAYS = 28;

type ReflectionBody = {
  day?: number;
  note?: string;
  surah?: string;
  ayah?: number;
  emotion?: string;
  awareness_state?: string;
};

const AWARENESS_STATES = ["shadow", "gift", "best_possibility"] as const;

/** GET /api/reflections — list all reflections for the current user */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { supabase, user } = auth;
  const { data, error } = await supabase
    .from("reflections")
    .select("id, day, note, surah, ayah, emotion, awareness_state, created_at, updated_at")
    .eq("user_id", user.id)
    .order("day", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, reflections: data ?? [] });
}

/** POST /api/reflections — upsert a reflection for a given day */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: ReflectionBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const day = Number(body.day);
  if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) {
    return NextResponse.json({ ok: false, error: "invalid_day" }, { status: 400 });
  }

  const note = String(body.note ?? "").slice(0, 5000);
  const surah = String(body.surah ?? "").trim().slice(0, 120);
  const ayahValue = Number(body.ayah);
  const ayah = Number.isInteger(ayahValue) && ayahValue > 0 ? ayahValue : null;
  const emotion = String(body.emotion ?? "").trim().slice(0, 120);
  const awarenessState =
    typeof body.awareness_state === "string" &&
    AWARENESS_STATES.includes(body.awareness_state as (typeof AWARENESS_STATES)[number])
      ? body.awareness_state
      : null;

  const { supabase, user } = auth;
  const { error } = await supabase.from("reflections").upsert(
    {
      user_id: user.id,
      day,
      note,
      surah: surah || null,
      ayah,
      emotion: emotion || null,
      awareness_state: awarenessState,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,day" }
  );

  if (error) {
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }

  // Phase 8 · Plan 08.02 — milestone badge fire-and-forget.
  //
  // BADGE-05 (server-side trigger), BADGE-06 (idempotent), BADGE-09 (silent).
  //
  // Guard on PROGRESSION_MILESTONES = [1, 3, 7, 14, 21, 28]. Day 28 is ALSO
  // handled by start-cycle (Plan 07.04 / Plan 08.03) — firing here too is
  // harmless: duplicate upsert returns already_unlocked (UNIQUE constraint),
  // and the helper's emit-only-on-fresh-insert gate means zero duplicate
  // `badge_unlock` events.
  //
  // The call is `void`-prefixed so it never blocks the response and never
  // surfaces UI — the user sees the new badge on their next /progress visit
  // (silent reveal). No push notification, no toast, no modal, no payload
  // change.
  if ((PROGRESSION_MILESTONES as readonly number[]).includes(day)) {
    const { data: cycleRow } = await supabase
      .from("progress")
      .select("current_cycle")
      .eq("user_id", user.id)
      .maybeSingle();
    const cycle =
      typeof cycleRow?.current_cycle === "number" ? cycleRow.current_cycle : 1;
    const code = `day_${day}` as
      | "day_1"
      | "day_3"
      | "day_7"
      | "day_14"
      | "day_21"
      | "day_28";
    void unlockBadge(user.id, code, cycle, day);
  }

  // Phase 4 · Task 2 — fire-and-forget AI enhancement.
  //
  // Rules (from the task spec):
  //   1. DO NOT block the mutation on AI
  //   2. DO NOT throw if AI fails
  //   3. DO NOT retry AI
  //   4. DO NOT delay the response
  //
  // The call is intentionally not awaited. Any error is swallowed
  // silently so the reflection save always reports success to the
  // user regardless of AI state. On Vercel's Node runtime, background
  // promises typically complete before the container freezes —
  // occasional misses are acceptable and leave ai_* columns NULL.
  if (note && note.length >= 3) {
    void enhanceReflectionWithAI(user.id, day, note);
  }

  // Link reflection to patterns + generate action (non-blocking on failure)
  let linked = null;
  let action = null;
  try {
    linked = await linkReflection(supabase, user.id, day);

    const progress = await readUserProgress(supabase, user.id);
    if (progress.ok) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_start_date")
        .eq("id", user.id)
        .maybeSingle();

      const state = buildProgressState(
        progress.currentDay,
        progress.completedDays,
        profile?.subscription_start_date
      );
      action = generateAction(state, linked);

      // Persist action (ignore errors — table may not exist yet)
      try {
        await supabase.from("cognitive_actions").insert({
          user_id: user.id,
          day,
          type: action.type,
          label: action.label,
          description: action.description,
          suggested_next_step: action.suggestedNextStep,
          priority: action.priority,
        });
      } catch {}

      // Persist reflection links
      if (linked.connectedDays.length > 0) {
        try {
          const links = linked.connectedDays.map((targetDay: number) => ({
            user_id: user.id,
            source_day: day,
            target_day: targetDay,
            insight: linked!.insight,
            emotional_arc: linked!.emotionalArc,
            patterns: linked!.patterns.map((p: { keyword: string }) => p.keyword),
          }));
          await supabase.from("reflection_links").insert(links);
        } catch {}
      }

      // Update user_memory patterns
      if (linked.patterns.length > 0) {
        try {
          const themes = linked.patterns.slice(0, 5).map((p: { keyword: string }) => p.keyword);
          await supabase
            .from("user_memory")
            .upsert({
              user_id: user.id,
              patterns: themes,
              last_cognitive_update: new Date().toISOString(),
            }, { onConflict: "user_id" });
        } catch {}
      }
    }
  } catch {
    // Cognitive layer failure should not break reflection save
  }

  // Generate narrative + decision layer (non-blocking)
  let narrative = null;
  let actionWithDecision = null;
  try {
    if (linked && linked.patterns.length > 0) {
      const progress2 = await readUserProgress(supabase, user.id);
      if (progress2.ok) {
        const drift = Math.max(0, day - (progress2.completedDays.length > 0 ? Math.max(...progress2.completedDays) : 0));
        narrative = generateNarrative(linked.patterns, linked.emotionalArc, day, progress2.completedDays.length, drift);
      }
    }
    if (action) {
      const progress3 = await readUserProgress(supabase, user.id);
      if (progress3.ok) {
        const { data: profile2 } = await supabase
          .from("profiles")
          .select("subscription_start_date")
          .eq("id", user.id)
          .maybeSingle();
        const state2 = buildProgressState(progress3.currentDay, progress3.completedDays, profile2?.subscription_start_date);
        actionWithDecision = attachDecision(action, state2);
      }
    }
  } catch {}

  return NextResponse.json({
    ok: true,
    day,
    ...(linked && {
      linked: {
        insight: linked.insight,
        connected_days: linked.connectedDays,
        emotional_arc: linked.emotionalArc,
        patterns: linked.patterns.map((p: { keyword: string }) => p.keyword),
      },
    }),
    ...(narrative && { narrative }),
    ...(actionWithDecision ? { action: actionWithDecision } : action ? { action } : {}),
  });
}

/**
 * Phase 4 · Task 2 — fire-and-forget AI enhancement helper.
 *
 * Called by POST above via `void enhanceReflectionWithAI(...)` so the
 * response is sent before the OpenAI round-trip completes.
 *
 * Behavior contract:
 *   - Swallows ALL errors (missing key, network, bad model output,
 *     DB update failure). Never throws.
 *   - Uses the admin Supabase client because the request's cookie
 *     auth context is no longer guaranteed after the response.
 *   - Only updates the ai_* columns — never touches note/surah/etc.
 *   - Identified by (user_id, day) so it targets the row the POST
 *     just upserted.
 *
 * If this helper misses (cold container frozen mid-flight, OpenAI
 * slow, key missing), the row simply stays without ai_* fields.
 * The UI handles the null case.
 */
async function enhanceReflectionWithAI(
  userId: string,
  day: number,
  text: string
): Promise<void> {
  try {
    const analysis = await analyzeReflection(text, day);
    const admin = getSupabaseAdmin();
    await admin
      .from("reflections")
      .update({
        ai_sentiment: analysis.sentiment,
        ai_theme: analysis.theme,
        ai_mirror: analysis.mirror,
        ai_suggestion: analysis.suggestion,
      })
      .eq("user_id", userId)
      .eq("day", day);
  } catch {
    // Silent per spec: don't retry, don't throw, don't block.
  }
}
