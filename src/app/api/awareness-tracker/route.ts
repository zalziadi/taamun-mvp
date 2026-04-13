import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { type AwarenessState } from "@/lib/city-of-meaning";

export const dynamic = "force-dynamic";

const TOTAL_DAYS = 28;
const STATES: AwarenessState[] = ["shadow", "gift", "best_possibility"];
const LEGACY_TO_STATE: Record<string, AwarenessState> = {
  distracted: "shadow",
  tried: "gift",
  present: "best_possibility",
};
const STATE_TO_LEGACY: Record<AwarenessState, string> = {
  shadow: "distracted",
  gift: "tried",
  best_possibility: "present",
};

type TrackerBody = {
  day?: number;
  state?: string;
};

function toState(value: string | null | undefined): AwarenessState | null {
  if (!value) return null;
  if (STATES.includes(value as AwarenessState)) return value as AwarenessState;
  return LEGACY_TO_STATE[value] ?? null;
}

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { supabase, user } = auth;
  const { data, error } = await supabase
    .from("awareness_logs")
    .select("day, level")
    .eq("user_id", user.id)
    .order("day", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: true, total_days: TOTAL_DAYS, entries: [], counts: { shadow: 0, gift: 0, best_possibility: 0 } });
  }

  const entries = (data ?? [])
    .map((row) => ({
      day: Number(row.day),
      state: toState(String(row.level ?? "")),
    }))
    .filter((row) => row.state !== null);

  const counts: Record<AwarenessState, number> = {
    shadow: 0,
    gift: 0,
    best_possibility: 0,
  };
  entries.forEach((entry) => {
    counts[entry.state as AwarenessState] += 1;
  });

  return NextResponse.json({
    ok: true,
    total_days: TOTAL_DAYS,
    entries,
    counts,
  });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: TrackerBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const day = Number(body.day);
  if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) {
    return NextResponse.json({ ok: false, error: "invalid_day" }, { status: 400 });
  }

  const state = toState(body.state);
  if (!state) {
    return NextResponse.json({ ok: false, error: "invalid_state" }, { status: 400 });
  }

  const { supabase, user } = auth;
  const { error } = await supabase.from("awareness_logs").upsert(
    {
      user_id: user.id,
      day,
      level: STATE_TO_LEGACY[state],
    },
    { onConflict: "user_id,day" }
  );

  if (error) {
    // awareness_logs save failed — log but don't block user experience
    console.error("[awareness-tracker] save error:", error.message);
    return NextResponse.json({ ok: false, error: "save_failed", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, day, state });
}
