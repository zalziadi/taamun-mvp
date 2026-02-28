import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const TOTAL_DAYS = 28;

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

function uniqueSortedDays(values: number[]) {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

export async function POST(req: Request) {
  let body: { day?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const day = Number(body.day);
  if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) {
    return NextResponse.json({ ok: false, error: "invalid_day" }, { status: 400 });
  }

  let currentDay = 1;
  let completedDays: number[] = [];
  try {
    const supabase = await supabaseServer();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const { data: answer, error: answerError } = await supabase
      .from("user_answers")
      .select("day")
      .eq("user_id", user.id)
      .eq("day", day)
      .maybeSingle();

    if (answerError) {
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }
    if (!answer) {
      return NextResponse.json({ ok: false, error: "answers_required" }, { status: 403 });
    }

    const { data: current } = await supabase
      .from("user_progress")
      .select("current_day, completed_days")
      .eq("user_id", user.id)
      .single();

    currentDay = current?.current_day ?? 1;
    completedDays = Array.isArray(current?.completed_days) ? current.completed_days : [];

    if (day > currentDay) {
      return NextResponse.json(
        { ok: false, error: "locked_day", current_day: currentDay },
        { status: 400 }
      );
    }

    const nextCompleted = uniqueSortedDays([...completedDays, day]);
    const nextCurrent =
      day === currentDay ? Math.min(TOTAL_DAYS, currentDay + 1) : currentDay;

    const { error: upsertError } = await supabase.from("user_progress").upsert(
      {
        user_id: user.id,
        current_day: nextCurrent,
        completed_days: nextCompleted,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      current_day: nextCurrent,
      completed_days: nextCompleted,
      total_days: TOTAL_DAYS,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
