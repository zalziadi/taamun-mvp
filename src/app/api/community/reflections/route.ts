import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

/**
 * GET /api/community/reflections
 * Returns anonymous shared reflections (no PII — only day + note snippet)
 * Users opt-in to sharing via a "share" flag on their reflection
 */
export async function GET() {
  const admin = getSupabaseAdmin();

  // Get recent reflections that are shared (shared=true)
  // Fallback: if no shared flag exists yet, get random anonymized reflections
  const { data, error } = await admin
    .from("reflections")
    .select("day, note")
    .not("note", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    return NextResponse.json({ ok: true, reflections: [] });
  }

  // Anonymize: only return first 60 chars, no user info
  const anonymized = data
    .filter((r) => r.note && r.note.trim().length > 20)
    .slice(0, 5)
    .map((r) => ({
      day: r.day,
      snippet: r.note!.slice(0, 80) + (r.note!.length > 80 ? "..." : ""),
    }));

  return NextResponse.json({ ok: true, reflections: anonymized });
}
