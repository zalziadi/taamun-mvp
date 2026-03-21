import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

const TOTAL_DAYS = 28;

type ReflectionBody = {
  day?: number;
  note?: string;
  surah?: string;
  ayah?: number;
  emotion?: string;
  awareness_state?: string;
};

const AWARENESS_STATES = ["shadow", "gift", "best_possibility"] as const;

/** GET /api/reflections — list all reflections for the current user */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { supabase, user } = auth;
  const { data, error } = await supabase
    .from("reflections")
    .select("id, day, note, surah, ayah, emotion, awareness_state, created_at, updated_at")
    .eq("user_id", user.id)
    .order("day", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, reflections: data ?? [] });
}

/** POST /api/reflections — upsert a reflection for a given day */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: ReflectionBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const day = Number(body.day);
  if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) {
    return NextResponse.json({ ok: false, error: "invalid_day" }, { status: 400 });
  }

  const note = String(body.note ?? "").slice(0, 5000);
  const surah = String(body.surah ?? "").trim().slice(0, 120);
  const ayahValue = Number(body.ayah);
  const ayah = Number.isInteger(ayahValue) && ayahValue > 0 ? ayahValue : null;
  const emotion = String(body.emotion ?? "").trim().slice(0, 120);
  const awarenessState =
    typeof body.awareness_state === "string" &&
    AWARENESS_STATES.includes(body.awareness_state as (typeof AWARENESS_STATES)[number])
      ? body.awareness_state
      : null;

  const { supabase, user } = auth;
  const { error } = await supabase.from("reflections").upsert(
    {
      user_id: user.id,
      day,
      note,
      surah: surah || null,
      ayah,
      emotion: emotion || null,
      awareness_state: awarenessState,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,day" }
  );

  if (error) {
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, day });
}
