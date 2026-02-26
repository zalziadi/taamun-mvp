import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { APP_NAME } from "@/lib/appConfig";
import { readUserProgress } from "@/lib/progressStore";

export const dynamic = "force-dynamic";

const TOTAL_DAYS = 28;

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id: dayRaw } = await params;
  const day = Number(dayRaw);
  if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) {
    return NextResponse.json({ ok: false, error: "invalid_day" }, { status: 400 });
  }

  const { data: verseMeta, error: verseError } = await auth.supabase
    .from("ramadan_verses")
    .select(
      "day, surah_number, ayah_number, theme_title, prompt_observe, prompt_insight, prompt_contemplate, prompt_rebuild"
    )
    .eq("day", day)
    .maybeSingle();

  if (verseError) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  let ayahText = "";
  if (verseMeta) {
    const { data: ayah } = await auth.supabase
      .from("quran_ayahs")
      .select("arabic_text")
      .eq("surah_number", verseMeta.surah_number)
      .eq("ayah_number", verseMeta.ayah_number)
      .maybeSingle();
    ayahText = ayah?.arabic_text ?? "";
  }

  const progress = await readUserProgress(auth.supabase, auth.user.id);
  if (!progress.ok) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    day,
    total_days: TOTAL_DAYS,
    is_completed: progress.completedDays.includes(day),
    current_day: progress.currentDay,
    verse: verseMeta
      ? {
          title: verseMeta.theme_title ?? "",
          surah_number: verseMeta.surah_number,
          ayah_number: verseMeta.ayah_number,
          text: ayahText,
          prompts: {
            observe: verseMeta.prompt_observe ?? "ماذا لاحظت اليوم؟",
            insight: verseMeta.prompt_insight ?? "ما الإدراك الذي ظهر لك؟",
            contemplate: verseMeta.prompt_contemplate ?? `كيف ستطبق ${APP_NAME} في هذا المعنى؟`,
            rebuild: verseMeta.prompt_rebuild ?? "ما الذي ستعيد بناءه في نفسك؟",
          },
        }
      : null,
  });
}
