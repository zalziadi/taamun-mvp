import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type BookNoteType = "bookmark" | "quote" | "note";

/**
 * GET /api/book/notes?type=bookmark&chapter=...
 * List all notes for the authenticated user. Filter by type and/or chapter.
 */
export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const chapter = url.searchParams.get("chapter");

  let query = supabase
    .from("book_notes")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (type) query = query.eq("type", type);
  if (chapter) query = query.eq("chapter", chapter);

  const { data, error } = await query.limit(500);
  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, notes: data ?? [] });
}

/**
 * POST /api/book/notes
 * Create a new note.
 * Body: { type, chapter, content, pageRef? }
 */
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    type?: BookNoteType;
    chapter?: string;
    content?: string;
    pageRef?: string;
  };

  if (
    !body.type ||
    !["bookmark", "quote", "note"].includes(body.type) ||
    !body.chapter ||
    !body.content ||
    body.content.trim().length === 0
  ) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("book_notes")
    .insert({
      user_id: auth.user.id,
      type: body.type,
      chapter: body.chapter.trim().slice(0, 200),
      content: body.content.trim().slice(0, 5000),
      page_ref: body.pageRef?.trim().slice(0, 50) ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "db_error", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, note: data });
}

/**
 * PATCH /api/book/notes
 * Update note content (or chapter/pageRef).
 * Body: { id, content?, chapter?, pageRef? }
 */
export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    content?: string;
    chapter?: string;
    pageRef?: string;
  };

  if (!body.id) {
    return NextResponse.json({ error: "id_required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.content === "string") updates.content = body.content.trim().slice(0, 5000);
  if (typeof body.chapter === "string") updates.chapter = body.chapter.trim().slice(0, 200);
  if (typeof body.pageRef === "string") updates.page_ref = body.pageRef.trim().slice(0, 50);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no_updates" }, { status: 400 });
  }

  const { error } = await supabase
    .from("book_notes")
    .update(updates)
    .eq("id", body.id)
    .eq("user_id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/book/notes?id=...
 */
export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id_required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("book_notes")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
