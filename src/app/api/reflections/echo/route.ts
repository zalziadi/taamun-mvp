import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/reflections/echo
 * Returns a past reflection from the user — typically from 7 days ago.
 * Used on homepage to create continuity ("قلبك كتب قبل أسبوع").
 *
 * Query params:
 *   ?offset=7 — days back (default 7)
 */
export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth.user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const offset = Math.max(1, Math.min(30, parseInt(url.searchParams.get("offset") ?? "7", 10)));

  // Get current day from progress
  const { data: progress } = await supabase
    .from("progress")
    .select("current_day")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const currentDay = progress?.current_day ?? 0;
  const targetDay = currentDay - offset;

  if (targetDay < 1) {
    return NextResponse.json({ ok: true, reflection: null, reason: "too_early" });
  }

  // Find user's reflection for target day
  const { data: reflection } = await supabase
    .from("reflections")
    .select("day, note, created_at")
    .eq("user_id", auth.user.id)
    .eq("day", targetDay)
    .maybeSingle();

  if (!reflection?.note) {
    return NextResponse.json({ ok: true, reflection: null, reason: "no_reflection" });
  }

  // Return truncated version (first 140 chars)
  const snippet =
    reflection.note.length > 140
      ? reflection.note.slice(0, 140).trim() + "..."
      : reflection.note;

  return NextResponse.json({
    ok: true,
    reflection: {
      day: reflection.day,
      snippet,
      daysAgo: offset,
      createdAt: reflection.created_at,
    },
  });
}
