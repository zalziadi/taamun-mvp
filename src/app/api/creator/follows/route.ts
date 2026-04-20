import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/creator/follows
 *
 * Returns the authed user's following list plus the latest published
 * journey per followed creator. Powers the "following" tab on /account.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: follows, error } = await supabase
    .from("creator_follows")
    .select("creator_user_id, created_at")
    .eq("follower_user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: "db_error", details: error.message },
      { status: 500 }
    );
  }

  const list = follows ?? [];
  if (list.length === 0) {
    return NextResponse.json({ ok: true, following: [] });
  }

  const creatorIds = list.map((f) => f.creator_user_id as string);

  // Published journeys of every followed creator — ordered newest first.
  // A single query fetches them all; we then group client-side.
  const { data: journeys } = await supabase
    .from("creator_journeys")
    .select("slug, title, duration_days, creator_user_id, creator_display_name, subscriber_count, created_at")
    .in("creator_user_id", creatorIds)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(500);

  const byCreator = new Map<
    string,
    {
      creator_user_id: string;
      creator_display_name: string;
      total_published: number;
      latest: {
        slug: string;
        title: string;
        duration_days: number;
        subscriber_count: number;
        created_at: string;
      } | null;
    }
  >();

  for (const j of journeys ?? []) {
    const key = j.creator_user_id as string;
    const existing = byCreator.get(key);
    if (!existing) {
      byCreator.set(key, {
        creator_user_id: key,
        creator_display_name: j.creator_display_name as string,
        total_published: 1,
        latest: {
          slug: j.slug as string,
          title: j.title as string,
          duration_days: j.duration_days as number,
          subscriber_count: (j.subscriber_count as number) ?? 0,
          created_at: j.created_at as string,
        },
      });
    } else {
      existing.total_published += 1;
      // list is sorted newest first — don't overwrite latest
    }
  }

  // Preserve follow order from `list`
  const result = list.map((f) => {
    const creator = byCreator.get(f.creator_user_id as string);
    return {
      creator_user_id: f.creator_user_id as string,
      followed_at: f.created_at,
      creator_display_name: creator?.creator_display_name ?? null,
      total_published: creator?.total_published ?? 0,
      latest: creator?.latest ?? null,
    };
  });

  return NextResponse.json({ ok: true, following: result });
}
