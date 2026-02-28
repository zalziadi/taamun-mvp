import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const TOTAL_DAYS = 28;
const TRACK_VALUES = ["surface", "mirror"] as const;
type QuestionTrack = (typeof TRACK_VALUES)[number];

function normalizeTrack(value: unknown): QuestionTrack {
  if (value === "mirror") return "mirror";
  return "surface";
}

async function supabaseServer() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !anonKey) {
    throw new Error("Missing Supabase env: SUPABASE_URL/SUPABASE_ANON_KEY");
  }

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // no-op in immutable response phases
        }
      },
    },
  });
}

type AnswersBody = {
  day?: number;
  observed?: string;
  insight?: string;
  contemplation?: string;
  observedTrack?: QuestionTrack;
  insightTrack?: QuestionTrack;
  contemplationTrack?: QuestionTrack;
};

export async function GET(req: Request) {
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const day = Number(new URL(req.url).searchParams.get("day"));
    if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) {
      return NextResponse.json({ ok: false, error: "invalid_day" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("user_answers")
      .select(
        "day, observed, insight, contemplation, observed_track, insight_track, contemplation_track, updated_at"
      )
      .eq("user_id", user.id)
      .eq("day", day)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, answer: data ?? null });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: AnswersBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const day = Number(body.day);
  if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) {
    return NextResponse.json({ ok: false, error: "invalid_day" }, { status: 400 });
  }

  const observed = (body.observed ?? "").trim();
  const insight = (body.insight ?? "").trim();
  const contemplation = (body.contemplation ?? "").trim();
  const observedTrack = normalizeTrack(body.observedTrack);
  const insightTrack = normalizeTrack(body.insightTrack);
  const contemplationTrack = normalizeTrack(body.contemplationTrack);

  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const { error } = await supabase.from("user_answers").upsert(
      {
        user_id: user.id,
        day,
        observed,
        insight,
        contemplation,
        observed_track: observedTrack,
        insight_track: insightTrack,
        contemplation_track: contemplationTrack,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,day" }
    );

    if (error) {
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
