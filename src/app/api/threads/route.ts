import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { moderate } from "@/lib/thread-moderation";
import { submitToIndexNow } from "@/lib/indexnow";
import { APP_DOMAIN } from "@/lib/appConfig";

export const dynamic = "force-dynamic";

/**
 * GET /api/threads?anchor_type=day&anchor_value=12
 * List published threads for a given anchor.
 */
export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const url = new URL(req.url);
  const anchorType = url.searchParams.get("anchor_type");
  const anchorValue = url.searchParams.get("anchor_value");
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "20", 10));

  let query = supabase
    .from("threads")
    .select("id, title, body, display_name, reply_count, created_at, anchor_type, anchor_value")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (anchorType && anchorValue) {
    query = query.eq("anchor_type", anchorType).eq("anchor_value", anchorValue);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, threads: data ?? [] });
}

/**
 * POST /api/threads
 * Body: { anchor_type, anchor_value, title, body, display_name }
 */
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    anchor_type?: string;
    anchor_value?: string;
    title?: string;
    body?: string;
    display_name?: string;
  };

  if (
    !body.anchor_type ||
    !["day", "verse"].includes(body.anchor_type) ||
    !body.anchor_value ||
    !body.title ||
    !body.body ||
    !body.display_name
  ) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const title = body.title.trim().slice(0, 120);
  const threadBody = body.body.trim().slice(0, 1500);
  const displayName = body.display_name.trim().slice(0, 40);

  if (title.length < 5 || threadBody.length < 10 || displayName.length < 2) {
    return NextResponse.json({ error: "content_too_short" }, { status: 400 });
  }

  const status = moderate(title + " " + threadBody);

  const { data, error } = await supabase
    .from("threads")
    .insert({
      user_id: auth.user.id,
      anchor_type: body.anchor_type,
      anchor_value: body.anchor_value.slice(0, 100),
      title,
      body: threadBody,
      display_name: displayName,
      status,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "db_error", details: error.message }, { status: 500 });
  }

  // Ping IndexNow for published threads so Bing/Yandex discover them quickly.
  if (status === "published" && data?.id) {
    submitToIndexNow([
      `${APP_DOMAIN}/threads/${data.id}`,
      `${APP_DOMAIN}/threads`,
    ]).catch((err) => console.warn("[threads] indexnow failed", err));
  }

  return NextResponse.json({ ok: true, thread: data, status });
}
