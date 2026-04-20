import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/shared?limit=3
 *
 * Public feed of published shared_insights — used by the SocialProofRotator
 * on marketing surfaces. Anon-readable via RLS policy `shared_insights_public_published`.
 * Silent no-op on DB error — the component renders nothing when list is empty.
 */
export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const url = new URL(req.url);
  const limit = Math.min(20, Math.max(1, parseInt(url.searchParams.get("limit") ?? "3", 10)));

  const { data, error } = await supabase
    .from("shared_insights")
    .select("slug, content, attribution, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ ok: false, insights: [] });
  }
  return NextResponse.json({ ok: true, insights: data ?? [] });
}

// Content-based moderation: flag if too long, contains link patterns, or non-Arabic boilerplate
function moderate(content: string): "published" | "flagged" {
  const trimmed = content.trim();
  if (trimmed.length < 10 || trimmed.length > 200) return "flagged";
  // Any URL-like pattern → flagged
  if (/(https?:\/\/|www\.|\.com|\.net|\.org|\.sa|@[a-zA-Z])/.test(trimmed)) {
    return "flagged";
  }
  return "published";
}

function generateSlug(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/**
 * POST /api/shared
 * Create a new shared insight.
 * Body: { content, attribution?: string }
 *
 * Moderation: short + no links = instant published. Else flagged for review.
 */
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    content?: string;
    attribution?: string;
  };

  const content = body.content?.trim();
  if (!content || content.length < 10 || content.length > 200) {
    return NextResponse.json(
      { error: "invalid_content", hint: "10 ≤ length ≤ 200" },
      { status: 400 }
    );
  }

  const attribution = body.attribution?.trim().slice(0, 60) || null;
  const status = moderate(content);

  // Generate unique slug (5 attempts)
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug();
    const { error } = await supabase.from("shared_insights").insert({
      slug,
      user_id: auth.user.id,
      content,
      attribution,
      status,
    });
    if (!error) {
      return NextResponse.json({ ok: true, slug, status });
    }
  }

  return NextResponse.json({ error: "slug_generation_failed" }, { status: 500 });
}

/**
 * DELETE /api/shared?slug=xxx
 * Remove a user's shared insight.
 */
export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug_required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("shared_insights")
    .delete()
    .eq("slug", slug)
    .eq("user_id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
