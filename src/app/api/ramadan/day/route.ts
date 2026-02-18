import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { RAMADAN_PROGRAM_KEY } from "@/lib/appConfig";

export const dynamic = "force-dynamic";

const PROGRAM_KEY = RAMADAN_PROGRAM_KEY;
const VERSION = 1;

function bad(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function GET(req: Request) {
  const day = Number(new URL(req.url).searchParams.get("day") ?? "0");
  if (!Number.isInteger(day) || day < 1 || day > 28) return bad("invalid_day", 400);

  const admin = getSupabaseAdmin();
  const { data: item, error: itemError } = await admin
    .from("ramadan_verses")
    .select("day,surah,ayah_start,ayah_end,theme,observe_q,insight_q,contemplate_q")
    .eq("program_key", PROGRAM_KEY)
    .eq("version", VERSION)
    .eq("day", day)
    .maybeSingle();

  if (itemError) return bad("program_query_failed", 500);
  if (!item) return bad("day_not_found", 404);

  const { data: ayahs, error: ayahError } = await admin
    .from("quran_ayahs")
    .select("surah,ayah,text_ar,page,juz,hizb")
    .eq("surah", item.surah)
    .gte("ayah", item.ayah_start)
    .lte("ayah", item.ayah_end)
    .order("ayah", { ascending: true });

  if (ayahError) return bad("quran_text_query_failed", 500);
  if (!ayahs?.length) return bad("quran_text_missing", 500);

  return NextResponse.json({
    ok: true,
    day: item.day,
    ref: { surah: item.surah, ayahStart: item.ayah_start, ayahEnd: item.ayah_end },
    theme: item.theme,
    triad: {
      observe: item.observe_q,
      insight: item.insight_q,
      contemplate: item.contemplate_q,
    },
    quranText: {
      arabic: ayahs.map((a) => a.text_ar).join(" "),
      ayahs,
    },
  });
}
