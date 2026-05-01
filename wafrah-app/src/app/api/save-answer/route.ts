import { NextResponse } from "next/server";
import { getSupabaseService, isSupabaseConfigured } from "@/lib/supabase";

export const runtime = "nodejs";

interface Body {
  userId?: string;
  day?: number;
  answer?: string;
  reflection?: string;
  completed?: boolean;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const day = Number(body.day);
  if (!Number.isFinite(day) || day < 1 || day > 14) {
    return NextResponse.json({ ok: false, error: "INVALID_DAY" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      synced: false,
      mode: "local",
      message: "Supabase غير مهيّأ — التقدّم محفوظ محلياً فقط.",
    });
  }

  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "MISSING_USER" }, { status: 400 });
  }

  const supabase = getSupabaseService();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }

  const { error } = await supabase.from("wafrah_day_progress").upsert(
    {
      user_id: userId,
      day,
      answer: body.answer ?? "",
      reflection: body.reflection ?? "",
      completed: body.completed ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,day" }
  );

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, synced: true, mode: "supabase" });
}
