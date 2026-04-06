import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { linkReflection } from "@/lib/reflectionLinker";
import { generateAction } from "@/lib/actionGenerator";
import { buildProgressState } from "@/lib/progressEngine";
import { readUserProgress } from "@/lib/progressStore";
import { computeCalendarDay } from "@/lib/calendarDay";
import { attachDecision } from "@/lib/decisionLayer";
import { generateNarrative } from "@/lib/narrativeEngine";

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
