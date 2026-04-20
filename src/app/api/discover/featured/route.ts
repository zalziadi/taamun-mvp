import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/discover/featured
 *
 * Returns the single most-subscribed published creator journey, powering
 * the homepage spotlight. Tiebreaker: newest. Anon-readable via RLS.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("creator_journeys")
    .select("slug, title, description, duration_days, creator_display_name, subscriber_count")
    .eq("status", "published")
    .order("subscriber_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ ok: true, journey: null });
  }
  return NextResponse.json({ ok: true, journey: data });
}
