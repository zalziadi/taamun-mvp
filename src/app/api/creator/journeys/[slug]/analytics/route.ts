import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ slug: string }> };

/**
 * GET /api/creator/journeys/[slug]/analytics
 *
 * Creator-only analytics for a single journey:
 *   - total subscribers
 *   - completion rate (users who finished all days)
 *   - per-day drop-off (count of users who completed each day_number)
 *   - recent activity (last 10 subscribers with last_active_at)
 *
 * Visibility: owner only — RLS would block SELECT for non-owners when we
 * read with the server (authenticated) client.
 */
export async function GET(_req: Request, ctx: RouteCtx) {
  const { slug } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Confirm ownership + grab the duration
  const { data: journey } = await supabase
    .from("creator_journeys")
    .select("slug, duration_days, creator_user_id, subscriber_count, title")
    .eq("slug", slug)
    .maybeSingle();

  if (!journey) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (journey.creator_user_id !== auth.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const duration = journey.duration_days as number;

  // Pull every subscription (small tables for MVP — 14 days max per journey)
  const { data: subs } = await supabase
    .from("creator_journey_subscriptions")
    .select("user_id, current_day, completed_days, started_at, last_active_at")
    .eq("journey_slug", slug)
    .order("last_active_at", { ascending: false })
    .limit(500);

  const rows = subs ?? [];
  const totalSubscribers = rows.length;

  // per-day drop-off: how many users completed each day_number
  const perDay: Array<{ day: number; completed: number }> = [];
  for (let d = 1; d <= duration; d++) {
    perDay.push({
      day: d,
      completed: rows.filter((r) => {
        const arr = (r.completed_days as number[] | null) ?? [];
        return arr.includes(d);
      }).length,
    });
  }

  const finished = rows.filter((r) => {
    const arr = (r.completed_days as number[] | null) ?? [];
    return arr.length >= duration;
  }).length;

  const completionRate =
    totalSubscribers > 0 ? Math.round((finished / totalSubscribers) * 100) : 0;

  const recent = rows.slice(0, 10).map((r) => ({
    current_day: r.current_day,
    completed: ((r.completed_days as number[] | null) ?? []).length,
    started_at: r.started_at,
    last_active_at: r.last_active_at,
  }));

  return NextResponse.json({
    ok: true,
    journey: {
      slug: journey.slug,
      title: journey.title,
      duration_days: duration,
      subscriber_count: journey.subscriber_count,
    },
    metrics: {
      total_subscribers: totalSubscribers,
      finished,
      completion_rate_percent: completionRate,
      per_day: perDay,
    },
    recent,
  });
}
