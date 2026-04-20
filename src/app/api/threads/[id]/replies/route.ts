import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { moderate } from "@/lib/thread-moderation";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * GET /api/threads/[id]/replies
 * List published replies for a thread, oldest first.
 */
export async function GET(_req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("thread_replies")
    .select("id, body, display_name, created_at")
    .eq("thread_id", id)
    .eq("status", "published")
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, replies: data ?? [] });
}

/**
 * POST /api/threads/[id]/replies
 * Body: { body, display_name }
 */
export async function POST(req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    body?: string;
    display_name?: string;
  };

  if (!body.body || !body.display_name) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const replyBody = body.body.trim().slice(0, 500);
  const displayName = body.display_name.trim().slice(0, 40);

  if (replyBody.length < 1 || displayName.length < 2) {
    return NextResponse.json({ error: "content_too_short" }, { status: 400 });
  }

  // Verify thread exists + is published; capture author for reply push.
  const { data: thread } = await supabase
    .from("threads")
    .select("id, status, user_id, title")
    .eq("id", id)
    .maybeSingle();

  if (!thread || thread.status !== "published") {
    return NextResponse.json({ error: "thread_not_found" }, { status: 404 });
  }

  const status = moderate(replyBody);

  const { data, error } = await supabase
    .from("thread_replies")
    .insert({
      thread_id: id,
      user_id: auth.user.id,
      body: replyBody,
      display_name: displayName,
      status,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "db_error", details: error.message }, { status: 500 });
  }

  // v1.5 Phase 2: notify the thread author when a published reply lands,
  // but never push them their own reply. Failure is silent — reply stays created.
  if (
    status === "published" &&
    thread.user_id &&
    thread.user_id !== auth.user.id
  ) {
    try {
      const admin = getSupabaseAdmin();
      const preview = replyBody.length > 80 ? replyBody.slice(0, 77) + "…" : replyBody;
      await sendPushToUser(admin, thread.user_id as string, {
        title: `ردّ جديد على: ${String(thread.title).slice(0, 40)}`,
        body: `${displayName}: ${preview}`,
        url: `/threads/${id}`,
        tag: `taamun-reply-${id}`,
      });
    } catch (pushErr) {
      console.error("[threads/replies] push notify failed", pushErr);
    }
  }

  return NextResponse.json({ ok: true, reply: data, status });
}
