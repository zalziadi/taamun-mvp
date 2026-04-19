import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ slug: string }> };

/**
 * POST /api/creator/journeys/[slug]/subscribe
 * Subscribe the current user to a published creator journey.
 * Idempotent — subsequent calls return the existing subscription.
 */
export async function POST(_req: Request, ctx: RouteCtx) {
  const { slug } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Journey must exist + be published
  const { data: journey } = await supabase
    .from("creator_journeys")
    .select("slug, status")
    .eq("slug", slug)
    .maybeSingle();

  if (!journey || journey.status !== "published") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Existing subscription? return it
  const { data: existing } = await supabase
    .from("creator_journey_subscriptions")
    .select("id, current_day, completed_days, started_at, last_active_at")
    .eq("user_id", auth.user.id)
    .eq("journey_slug", slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, subscription: existing, created: false });
  }

  const { data, error } = await supabase
    .from("creator_journey_subscriptions")
    .insert({ user_id: auth.user.id, journey_slug: slug })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "db_error", details: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, subscription: data, created: true });
}

/**
 * PATCH /api/creator/journeys/[slug]/subscribe
 * Body: { complete_day: number }
 * Mark a day complete + advance current_day.
 */
export async function PATCH(req: Request, ctx: RouteCtx) {
  const { slug } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { complete_day?: number };
  const day = Number(body.complete_day);
  if (!Number.isFinite(day) || day < 1 || day > 14) {
    return NextResponse.json({ error: "invalid_day" }, { status: 400 });
  }

  const { data: sub } = await supabase
    .from("creator_journey_subscriptions")
    .select("id, current_day, completed_days")
    .eq("user_id", auth.user.id)
    .eq("journey_slug", slug)
    .maybeSingle();

  if (!sub) {
    return NextResponse.json({ error: "not_subscribed" }, { status: 404 });
  }

  const existingDays = (sub.completed_days as number[] | null) ?? [];
  const completed = existingDays.includes(day)
    ? existingDays
    : [...existingDays, day].sort((a, b) => a - b);
  const nextCurrent = Math.max(sub.current_day as number, day + 1);

  const { data, error } = await supabase
    .from("creator_journey_subscriptions")
    .update({
      completed_days: completed,
      current_day: nextCurrent,
      last_active_at: new Date().toISOString(),
    })
    .eq("id", sub.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, subscription: data });
}
