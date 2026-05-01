import { NextResponse } from "next/server";
import { getSupabaseService, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      synced: false,
      mode: "local",
      days: [],
      message: "Supabase غير مهيّأ — اقرأ التقدّم من LocalStorage.",
    });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId")?.trim();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "MISSING_USER" }, { status: 400 });
  }

  const supabase = getSupabaseService();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("wafrah_day_progress")
    .select("day, answer, reflection, completed, updated_at")
    .eq("user_id", userId)
    .order("day", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, synced: true, mode: "supabase", days: data ?? [] });
}
