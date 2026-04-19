import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ slug: string }> };

function validateDay(body: Record<string, unknown>) {
  const dayNumber = Number(body.day_number);
  const verseText = String(body.verse_text ?? "").trim();
  const verseRef = String(body.verse_ref ?? "").trim().slice(0, 120);
  const reflectionPrompt = String(body.reflection_prompt ?? "").trim().slice(0, 500);
  const exerciseRaw = body.exercise;
  const exercise =
    typeof exerciseRaw === "string" && exerciseRaw.trim().length > 0
      ? exerciseRaw.trim().slice(0, 500)
      : null;

  if (
    !Number.isFinite(dayNumber) ||
    dayNumber < 1 ||
    dayNumber > 14 ||
    verseText.length < 5 ||
    verseRef.length < 2 ||
    reflectionPrompt.length < 10
  ) {
    return null;
  }

  if (exercise !== null && exercise.length < 10) {
    return null;
  }

  return {
    day_number: dayNumber,
    verse_text: verseText,
    verse_ref: verseRef,
    reflection_prompt: reflectionPrompt,
    exercise,
  };
}

async function assertOwnership(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  slug: string,
  userId: string
): Promise<{ ok: true; duration: number } | { ok: false; res: NextResponse }> {
  const { data: journey } = await supabase
    .from("creator_journeys")
    .select("creator_user_id, duration_days")
    .eq("slug", slug)
    .maybeSingle();

  if (!journey) {
    return {
      ok: false,
      res: NextResponse.json({ error: "not_found" }, { status: 404 }),
    };
  }
  if (journey.creator_user_id !== userId) {
    return {
      ok: false,
      res: NextResponse.json({ error: "forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, duration: journey.duration_days as number };
}

/**
 * POST /api/creator/journeys/[slug]/days
 * Upsert (by day_number) a single day of the journey. Only the creator may call this.
 * Body: { day_number, verse_text, verse_ref, reflection_prompt, exercise? }
 */
export async function POST(req: Request, ctx: RouteCtx) {
  const { slug } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const own = await assertOwnership(supabase, slug, auth.user.id);
  if (!own.ok) return own.res;

  const payload = await req.json().catch(() => ({}));
  const parsed = validateDay(payload);
  if (!parsed) {
    return NextResponse.json({ error: "invalid_day" }, { status: 400 });
  }
  if (parsed.day_number > own.duration) {
    return NextResponse.json(
      { error: "day_exceeds_duration", duration: own.duration },
      { status: 400 }
    );
  }

  // Upsert by (journey_slug, day_number)
  const { data, error } = await supabase
    .from("creator_journey_days")
    .upsert(
      { journey_slug: slug, ...parsed },
      { onConflict: "journey_slug,day_number" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "db_error", details: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, day: data });
}

/**
 * DELETE /api/creator/journeys/[slug]/days?day=N
 * Remove a single day from the journey.
 */
export async function DELETE(req: Request, ctx: RouteCtx) {
  const { slug } = await ctx.params;
  const url = new URL(req.url);
  const day = Number(url.searchParams.get("day"));
  if (!Number.isFinite(day) || day < 1 || day > 14) {
    return NextResponse.json({ error: "invalid_day" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const own = await assertOwnership(supabase, slug, auth.user.id);
  if (!own.ok) return own.res;

  const { error } = await supabase
    .from("creator_journey_days")
    .delete()
    .eq("journey_slug", slug)
    .eq("day_number", day);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
