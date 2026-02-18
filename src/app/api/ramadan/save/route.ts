import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { RAMADAN_PROGRAM_KEY } from "@/lib/appConfig";

export const dynamic = "force-dynamic";

const DEFAULT_PROGRAM_KEY = RAMADAN_PROGRAM_KEY;
const DEFAULT_VERSION = 1;
const TOTAL_DAYS = 28;

type SaveBody = {
  day?: number;
  observeText?: string;
  insightText?: string;
  contemplateText?: string;
  rebuildText?: string;
};

async function getProgramDay(
  day: number,
  programKey: string,
  version: number
): Promise<Record<string, unknown> | null> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("ramadan_verses")
    .select("day,surah,ayah_start,ayah_end,theme,observe_q,insight_q,contemplate_q")
    .eq("program_key", programKey)
    .eq("version", version)
    .eq("day", day)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Record<string, unknown> | null;
}

async function getQuranText(dayRow: Record<string, unknown> | null) {
  if (!dayRow) return "";
  const surah = Number(dayRow.surah ?? 0);
  const ayahStart = Number(dayRow.ayah_start ?? 0);
  const ayahEnd = Number(dayRow.ayah_end ?? ayahStart);
  if (!surah || !ayahStart || !ayahEnd) return "";

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("quran_ayahs")
    .select("text_ar")
    .eq("surah", surah)
    .gte("ayah", ayahStart)
    .lte("ayah", ayahEnd)
    .order("ayah", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => row.text_ar).join(" ");
}

async function buildAiResponse(input: {
  quranText: string;
  observeText: string;
  insightText: string;
  contemplateText: string;
  rebuildText?: string;
}) {
  const prompt = [
    "أنت مساعد انعكاس يومي في برنامج رمضاني.",
    "قدّم فقرة عربية قصيرة (2-4 جمل) بنبرة رحيمة وعملية.",
    input.quranText ? `نص الآية: ${input.quranText}` : "",
    `الملاحظة: ${input.observeText}`,
    `الإدراك: ${input.insightText}`,
    `التأمل: ${input.contemplateText}`,
    input.rebuildText ? `إعادة البناء: ${input.rebuildText}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return `انعكاس اليوم: بدأتَ بخطوة صادقة في الملاحظة والإدراك. ثبّت هذا المعنى بسلوك صغير واضح قبل نهاية اليوم، وكرره غدًا حتى يتحول إلى عادة.`;
  }

  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 220,
      temperature: 0.5,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    return `انعكاس اليوم: المعنى الذي التقطته مهم. اختر فعلًا واحدًا بسيطًا تطبقه اليوم ليترسخ الإدراك في السلوك.`;
  }

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text =
    data.content?.find((item) => item.type === "text")?.text?.trim() ??
    "انعكاس اليوم: استمر في كتابة صادقة ومختصرة، فالتكرار يصنع التحول.";
  return text;
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: SaveBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const day = Number(body.day);
  if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) {
    return NextResponse.json({ ok: false, error: "invalid_day" }, { status: 400 });
  }

  const observeText = (body.observeText ?? "").trim();
  const insightText = (body.insightText ?? "").trim();
  const contemplateText = (body.contemplateText ?? "").trim();
  const rebuildText = (body.rebuildText ?? "").trim();

  if (observeText.length > 3000 || insightText.length > 3000 || contemplateText.length > 3000) {
    return NextResponse.json({ ok: false, error: "text_too_long" }, { status: 400 });
  }
  if (rebuildText.length > 3000) {
    return NextResponse.json({ ok: false, error: "text_too_long" }, { status: 400 });
  }

  if (!observeText && !insightText && !contemplateText && !rebuildText) {
    return NextResponse.json({ ok: false, error: "empty_payload" }, { status: 400 });
  }

  try {
    const programDay = await getProgramDay(day, DEFAULT_PROGRAM_KEY, DEFAULT_VERSION);
    const quranText = await getQuranText(programDay);
    const aiResponse = await buildAiResponse({
      quranText,
      observeText,
      insightText,
      contemplateText,
      rebuildText,
    });

    const { error } = await supabase.from("ramadan_journal").upsert(
      {
        user_id: user.id,
        program_key: DEFAULT_PROGRAM_KEY,
        version: DEFAULT_VERSION,
        day,
        observe: observeText,
        insight: insightText,
        contemplate: contemplateText,
        rebuild: rebuildText,
        ai_response: aiResponse,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,program_key,version,day" }
    );

    if (error) {
      return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      ai_response: aiResponse,
      next_day: Math.min(TOTAL_DAYS, day + 1),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
