import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moderate } from "@/lib/thread-moderation";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ slug: string }> };

/**
 * GET /api/creator/journeys/[slug]
 * Public endpoint: returns the journey + its days if the journey is published,
 * or if the viewer is the creator. Days are sorted by day_number.
 */
export async function GET(_req: Request, ctx: RouteCtx) {
  const { slug } = await ctx.params;
  const supabase = await createSupabaseServerClient();

  const { data: auth } = await supabase.auth.getUser();
  const viewerId = auth.user?.id ?? null;

  const { data: journey, error } = await supabase
    .from("creator_journeys")
    .select("slug, creator_user_id, title, description, duration_days, creator_display_name, status, subscriber_count, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !journey) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const isOwner = viewerId && journey.creator_user_id === viewerId;
  if (journey.status !== "published" && !isOwner) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: days } = await supabase
    .from("creator_journey_days")
    .select("id, day_number, verse_text, verse_ref, reflection_prompt, exercise")
    .eq("journey_slug", slug)
    .order("day_number", { ascending: true });

  return NextResponse.json({
    ok: true,
    journey,
    days: days ?? [],
    isOwner,
  });
}

/**
 * PATCH /api/creator/journeys/[slug]
 * Body accepts: { title?, description?, duration_days?, creator_display_name?, status? }
 * status transitions: draft ↔ published (creator-driven).
 * flagged/removed are founder-only and not accepted here.
 */
export async function PATCH(req: Request, ctx: RouteCtx) {
  const { slug } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    description?: string;
    duration_days?: number;
    creator_display_name?: string;
    status?: "draft" | "published";
  };

  const patch: Record<string, unknown> = {};

  if (typeof body.title === "string") {
    const t = body.title.trim().slice(0, 120);
    if (t.length < 5) {
      return NextResponse.json({ error: "invalid_title" }, { status: 400 });
    }
    patch.title = t;
  }
  if (typeof body.description === "string") {
    const d = body.description.trim().slice(0, 500);
    if (d.length < 20) {
      return NextResponse.json({ error: "invalid_description" }, { status: 400 });
    }
    patch.description = d;
  }
  if (typeof body.duration_days !== "undefined") {
    const n = Number(body.duration_days);
    if (![7, 14].includes(n)) {
      return NextResponse.json({ error: "invalid_duration" }, { status: 400 });
    }
    patch.duration_days = n;
  }
  if (typeof body.creator_display_name === "string") {
    const n = body.creator_display_name.trim().slice(0, 60);
    if (n.length < 2) {
      return NextResponse.json({ error: "invalid_name" }, { status: 400 });
    }
    patch.creator_display_name = n;
  }

  // Status transition: when the creator tries to publish, require all days present.
  let publishCheckNeeded = false;
  if (body.status === "draft" || body.status === "published") {
    patch.status = body.status;
    publishCheckNeeded = body.status === "published";
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });
  }

  patch.updated_at = new Date().toISOString();

  // Auto-flag when the creator pushes to published and the text is sus
  if (publishCheckNeeded) {
    const { data: current } = await supabase
      .from("creator_journeys")
      .select("title, description, duration_days")
      .eq("slug", slug)
      .eq("creator_user_id", auth.user.id)
      .maybeSingle();
    if (!current) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const nextTitle = (patch.title as string | undefined) ?? (current.title as string);
    const nextDesc = (patch.description as string | undefined) ?? (current.description as string);
    const nextDuration = (patch.duration_days as number | undefined) ?? (current.duration_days as number);

    if (moderate(`${nextTitle} ${nextDesc}`) === "flagged") {
      patch.status = "flagged";
    }

    const { count } = await supabase
      .from("creator_journey_days")
      .select("id", { count: "exact", head: true })
      .eq("journey_slug", slug);

    if ((count ?? 0) < nextDuration) {
      return NextResponse.json(
        { error: "missing_days", expected: nextDuration, found: count ?? 0 },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("creator_journeys")
    .update(patch)
    .eq("slug", slug)
    .eq("creator_user_id", auth.user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "db_error", details: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, journey: data });
}

/**
 * DELETE /api/creator/journeys/[slug]
 * Only the creator can delete. Cascades to days + subscriptions via FK ON DELETE CASCADE.
 */
export async function DELETE(_req: Request, ctx: RouteCtx) {
  const { slug } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("creator_journeys")
    .delete()
    .eq("slug", slug)
    .eq("creator_user_id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
