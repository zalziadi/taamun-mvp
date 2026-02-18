import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

const TOTAL_DAYS = 28;

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { supabase, user } = auth;
  const { data, error } = await supabase
    .from("user_progress")
    .select("current_day, completed_days")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  if (!data) {
    const { data: inserted, error: insertError } = await supabase
      .from("user_progress")
      .insert({ user_id: user.id, current_day: 1, completed_days: [] })
      .select("current_day, completed_days")
      .single();

    if (insertError || !inserted) {
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      current_day: inserted.current_day ?? 1,
      completed_days: Array.isArray(inserted.completed_days) ? inserted.completed_days : [],
      total_days: TOTAL_DAYS,
    });
  }

  return NextResponse.json({
    ok: true,
    current_day: data.current_day ?? 1,
    completed_days: Array.isArray(data.completed_days) ? data.completed_days : [],
    total_days: TOTAL_DAYS,
  });
}
