import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/reflections/themes
 * Returns the user's current cluster-derived themes (top 3 by rank).
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("reflection_themes")
    .select("label, keywords, reflection_count, sample_texts, rank, generated_at")
    .eq("user_id", auth.user.id)
    .order("rank", { ascending: true })
    .limit(10);

  return NextResponse.json({ ok: true, themes: data ?? [] });
}
