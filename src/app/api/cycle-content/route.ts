import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/cycle-content?cycle=4&day=1
 *
 * Returns AI-generated content for a given cycle+day from the cache.
 * If cycle <= 3, returns 404 (use hardcoded content instead).
 * If cycle >= 4 and content doesn't exist yet, returns 404 (caller falls back to modulo).
 *
 * Authenticated endpoint — content is for subscribers only.
 */
export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const cycle = parseInt(url.searchParams.get("cycle") ?? "0", 10);
  const day = parseInt(url.searchParams.get("day") ?? "0", 10);

  if (cycle < 4 || day < 1 || day > 28) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }

  const { data } = await supabase
    .from("ai_generated_days")
    .select("*")
    .eq("cycle", cycle)
    .eq("day", day)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ ok: false, reason: "not_cached" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    content: {
      day: data.day,
      title: data.title,
      chapter: data.chapter,
      verse: data.verse,
      verseRef: data.verse_ref,
      silencePrompt: data.silence_prompt,
      question: data.question,
      exercise: data.exercise,
      hiddenLayer: data.hidden_layer,
      bookQuote: data.book_quote,
      bookChapter: data.book_chapter,
    },
    theme: data.theme_name,
  });
}
