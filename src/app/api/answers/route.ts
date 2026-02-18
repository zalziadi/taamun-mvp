import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { buildDailyReflection } from "@/lib/awareness-engine";

export const dynamic = "force-dynamic";

const TOTAL_DAYS = 28;

type AnswersBody = {
  day?: number;
  observe?: string;
  observed?: string;
  insight?: string;
  contemplate?: string;
  contemplation?: string;
  rebuild?: string | null;
};

function normalizeInput(body: AnswersBody) {
  return {
    observe: (body.observe ?? body.observed ?? "").trim(),
    insight: (body.insight ?? "").trim(),
    contemplate: (body.contemplate ?? body.contemplation ?? "").trim(),
    rebuild: (body.rebuild ?? "").trim(),
  };
}

export async function GET(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const day = Number(new URL(req.url).searchParams.get("day"));
  if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) {
    return NextResponse.json({ ok: false, error: "invalid_day" }, { status: 400 });
  }

  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("user_answers")
    .select("day, observe, insight, contemplate, rebuild, ai_reflection, updated_at")
    .eq("user_id", user.id)
    .eq("day", day)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    answer: data
      ? {
          day: data.day,
          observe: data.observe ?? "",
          insight: data.insight ?? "",
          contemplate: data.contemplate ?? "",
          rebuild: data.rebuild ?? "",
          ai_reflection: data.ai_reflection ?? "",
          updated_at: data.updated_at,
        }
      : null,
  });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

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

  const normalized = normalizeInput(body);
  if (!normalized.observe && !normalized.insight && !normalized.contemplate && !normalized.rebuild) {
    return NextResponse.json({ ok: false, error: "empty_answers" }, { status: 400 });
  }

  const reflection = buildDailyReflection(normalized);
  const { supabase, user } = auth;

  const { error } = await supabase.from("user_answers").upsert(
    {
      user_id: user.id,
      day,
      observe: normalized.observe,
      insight: normalized.insight,
      contemplate: normalized.contemplate,
      rebuild: normalized.rebuild || null,
      ai_reflection: reflection,
      ai_response: {
        version: 1,
        generated_at: new Date().toISOString(),
        source: "smart-awareness-template",
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,day" }
  );

  if (error) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    answer: {
      day,
      ...normalized,
      ai_reflection: reflection,
    },
  });
}
