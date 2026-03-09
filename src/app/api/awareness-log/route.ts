import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

const TOTAL_DAYS = 28;
const VALID_LEVELS = ["present", "tried", "distracted"] as const;
type AwarenessLevel = (typeof VALID_LEVELS)[number];

type AwarenessLogBody = {
  day?: number;
  level?: string;
};

/** POST /api/awareness-log — save the daily awareness level for a user */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: AwarenessLogBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const day = Number(body.day);
  if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) {
    return NextResponse.json({ ok: false, error: "invalid_day" }, { status: 400 });
  }

  if (!VALID_LEVELS.includes(body.level as AwarenessLevel)) {
    return NextResponse.json({ ok: false, error: "invalid_level" }, { status: 400 });
  }

  const level = body.level as AwarenessLevel;
  const { supabase, user } = auth;

  const { error } = await supabase.from("awareness_logs").upsert(
    { user_id: user.id, day, level },
    { onConflict: "user_id,day" }
  );

  if (error) {
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, day, level });
}
