import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { APP_NAME } from "@/lib/appConfig";

export const dynamic = "force-dynamic";

const TOTAL_DAYS = 28;

type Params = {
  params: Promise<{ dayId: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { dayId: dayIdRaw } = await params;
  const dayId = Number(dayIdRaw);
  if (!Number.isInteger(dayId) || dayId < 1 || dayId > TOTAL_DAYS) {
    return NextResponse.json({ ok: false, error: "invalid_day" }, { status: 400 });
  }

  const { supabase, user } = auth;
  const { data: verseMeta, error: verseError } = await supabase
    .from("ramadan_verses")
    .select(
      "day, surah_number, ayah_number, theme_title, prompt_observe, prompt_insight, prompt_contemplate, prompt_rebuild"
    )
    .eq("day", dayId)
    .maybeSingle();

  if (verseError) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  let ayahText = "";
  if (verseMeta) {
    const { data: ayah } = await supabase
      .from("quran_ayahs")
      .select("arabic_text")
      .eq("surah_number", verseMeta.surah_number)
      .eq("ayah_number", verseMeta.ayah_number)
      .maybeSingle();
    ayahText = ayah?.arabic_text ?? "";
  }

  const { data: progress, error: progressError } = await supabase
    .from("user_progress")
    .select("current_day, completed_days")
    .eq("user_id", user.id)
    .maybeSingle();
  if (progressError) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const { data: answer, error: answerError } = await supabase
    .from("user_answers")
    .select("observe, insight, contemplate, rebuild, ai_reflection, updated_at")
    .eq("user_id", user.id)
    .eq("day", dayId)
    .maybeSingle();
  if (answerError) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    day: dayId,
    verse: verseMeta
      ? {
          surah_number: verseMeta.surah_number,
          ayah_number: verseMeta.ayah_number,
          text: ayahText,
          title: verseMeta.theme_title ?? "",
          prompts: {
            observe: verseMeta.prompt_observe ?? "ماذا لاحظت اليوم؟",
            insight: verseMeta.prompt_insight ?? "ما الإدراك الذي ظهر لك؟",
            contemplate: verseMeta.prompt_contemplate ?? `كيف ستطبق ${APP_NAME} في هذا المعنى؟`,
            rebuild: verseMeta.prompt_rebuild ?? "ما الذي ستعيد بناءه في نفسك؟",
          },
        }
      : null,
    progress: {
      current_day: progress?.current_day ?? 1,
      completed_days: Array.isArray(progress?.completed_days) ? progress.completed_days : [],
      total_days: TOTAL_DAYS,
    },
    answer: answer
      ? {
          observe: answer.observe ?? "",
          insight: answer.insight ?? "",
          contemplate: answer.contemplate ?? "",
          rebuild: answer.rebuild ?? "",
          ai_reflection: answer.ai_reflection ?? "",
          updated_at: answer.updated_at,
        }
      : null,
  });
}
