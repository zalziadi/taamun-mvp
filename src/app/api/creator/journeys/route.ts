import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildSlug } from "@/lib/creator-slug";
import { isVipTier } from "@/lib/guide-prompt-vip";
import { moderate } from "@/lib/thread-moderation";

export const dynamic = "force-dynamic";

/**
 * GET /api/creator/journeys
 * Returns the authed user's own journeys (drafts + published).
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("creator_journeys")
    .select("slug, title, description, duration_days, status, subscriber_count, created_at, updated_at")
    .eq("creator_user_id", auth.user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, journeys: data ?? [] });
}

/**
 * POST /api/creator/journeys
 * Body: { title, description, duration_days, creator_display_name }
 * Requires VIP tier. Creates a draft journey; creator fills days separately.
 */
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // VIP gate
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (!isVipTier((profile?.subscription_tier as string | null) ?? null)) {
    return NextResponse.json({ error: "vip_required" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    description?: string;
    duration_days?: number;
    creator_display_name?: string;
  };

  const title = (body.title ?? "").trim().slice(0, 120);
  const description = (body.description ?? "").trim().slice(0, 500);
  const creatorDisplayName = (body.creator_display_name ?? "").trim().slice(0, 60);
  const duration = Number(body.duration_days);

  if (
    title.length < 5 ||
    description.length < 20 ||
    creatorDisplayName.length < 2 ||
    ![7, 14].includes(duration)
  ) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  // Auto-flag titles/descriptions with URLs to founder review
  const initialStatus: "draft" | "flagged" =
    moderate(title + " " + description) === "flagged" ? "flagged" : "draft";

  // Retry slug generation a couple of times on collision
  let slug = buildSlug(title);
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: inserted, error } = await supabase
      .from("creator_journeys")
      .insert({
        slug,
        creator_user_id: auth.user.id,
        title,
        description,
        duration_days: duration,
        creator_display_name: creatorDisplayName,
        status: initialStatus,
      })
      .select()
      .single();

    if (!error && inserted) {
      return NextResponse.json({ ok: true, journey: inserted });
    }

    // 23505 = unique violation — collision on slug
    if (error && error.code === "23505") {
      slug = buildSlug(title);
      continue;
    }

    return NextResponse.json(
      { error: "db_error", details: error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ error: "slug_collision" }, { status: 500 });
}
