import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ creatorId: string }> };

/**
 * POST /api/creator/[creatorId]/follow
 * Follows the target creator. Self-follow is rejected by DB CHECK constraint.
 * Idempotent — UNIQUE(follower, creator) makes duplicate follows a no-op.
 */
export async function POST(_req: Request, ctx: RouteCtx) {
  const { creatorId } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (auth.user.id === creatorId) {
    return NextResponse.json({ error: "self_follow_forbidden" }, { status: 400 });
  }

  const { error } = await supabase
    .from("creator_follows")
    .upsert(
      { follower_user_id: auth.user.id, creator_user_id: creatorId },
      { onConflict: "follower_user_id,creator_user_id", ignoreDuplicates: true }
    );

  if (error) {
    return NextResponse.json(
      { error: "db_error", details: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, following: true });
}

/**
 * DELETE /api/creator/[creatorId]/follow
 * Unfollows the target creator.
 */
export async function DELETE(_req: Request, ctx: RouteCtx) {
  const { creatorId } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("creator_follows")
    .delete()
    .eq("follower_user_id", auth.user.id)
    .eq("creator_user_id", creatorId);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, following: false });
}

/**
 * GET /api/creator/[creatorId]/follow
 * Returns { following: boolean, followerCount: number } for the current user.
 */
export async function GET(_req: Request, ctx: RouteCtx) {
  const { creatorId } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  // Public count — count(*) over creator_follows for creator_user_id is not
  // readable by anonymous callers through RLS, so we count via a head query
  // that bypasses via service role if needed. For MVP use authed user only.
  if (!auth.user) {
    return NextResponse.json({ ok: true, following: false, followerCount: 0 });
  }

  const { data: own } = await supabase
    .from("creator_follows")
    .select("id")
    .eq("follower_user_id", auth.user.id)
    .eq("creator_user_id", creatorId)
    .maybeSingle();

  // Only the creator can read the full list via RLS; for everyone else we
  // omit the count (UI falls back to showing follow/unfollow without a number).
  let followerCount: number | null = null;
  if (auth.user.id === creatorId) {
    const { count } = await supabase
      .from("creator_follows")
      .select("id", { count: "exact", head: true })
      .eq("creator_user_id", creatorId);
    followerCount = count ?? 0;
  }

  return NextResponse.json({
    ok: true,
    following: !!own,
    followerCount,
  });
}
