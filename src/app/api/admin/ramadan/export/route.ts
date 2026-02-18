import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { RAMADAN_PROGRAM_KEY } from "@/lib/appConfig";

export const dynamic = "force-dynamic";
const PROGRAM_KEY = RAMADAN_PROGRAM_KEY;
const VERSION = 1;

type StatusFilter = "completed" | "partial";

function escapeCsv(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function normalizeStatus(value: string | null): StatusFilter | null {
  if (!value) return null;
  if (value === "completed" || value === "partial") return value;
  return null;
}

function isCompletedEntry(entry: {
  observe_text?: string | null;
  insight_text?: string | null;
  contemplate_text?: string | null;
}) {
  return Boolean(
    entry.observe_text?.trim() && entry.insight_text?.trim() && entry.contemplate_text?.trim()
  );
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  if (profile?.role !== "admin") {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const dayParam = req.nextUrl.searchParams.get("day");
  const statusParam = req.nextUrl.searchParams.get("status");

  const day = dayParam ? Number(dayParam) : null;
  if (dayParam && (!Number.isInteger(day) || (day as number) < 1 || (day as number) > 28)) {
    return Response.json({ ok: false, error: "invalid_day" }, { status: 400 });
  }

  const status = normalizeStatus(statusParam);
  if (statusParam && !status) {
    return Response.json({ ok: false, error: "invalid_status" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  let journalQuery = admin
    .from("ramadan_responses")
    .select(
      "user_id,program_key,version,day,observe_text,insight_text,contemplate_text,rebuild_text,ai_response,created_at,updated_at"
    )
    .eq("program_key", PROGRAM_KEY)
    .eq("version", VERSION)
    .order("created_at", { ascending: false });

  if (day) {
    journalQuery = journalQuery.eq("day", day);
  }

  const { data: journalRows, error: journalError } = await journalQuery;
  if (journalError) {
    return Response.json({ ok: false, error: "export_query_failed" }, { status: 500 });
  }

  let filteredRows = journalRows ?? [];
  if (status === "completed") {
    filteredRows = filteredRows.filter(isCompletedEntry);
  } else if (status === "partial") {
    filteredRows = filteredRows.filter((row) => !isCompletedEntry(row));
  }

  const dayList = Array.from(new Set(filteredRows.map((row) => row.day)));
  const { data: verseRows, error: verseError } = dayList.length
    ? await admin
        .from("ramadan_verses")
        .select("*")
        .eq("program_key", PROGRAM_KEY)
        .eq("version", VERSION)
        .in("day", dayList)
    : await admin.from("ramadan_verses").select("*").eq("day", -1);

  if (verseError) {
    return Response.json({ ok: false, error: "verse_query_failed" }, { status: 500 });
  }

  const verseByDay = new Map<number, Record<string, unknown>>();
  for (const verse of verseRows ?? []) {
    verseByDay.set(Number(verse.day), verse as Record<string, unknown>);
  }

  const headers = [
    "user_id",
    "day",
    "surah",
    "ayah_start",
    "ayah_end",
    "theme",
    "observe_text",
    "insight_text",
    "contemplate_text",
    "rebuild_text",
    "ai_response",
    "created_at",
    "updated_at",
  ];

  const lines = filteredRows.map((row) => {
    const verse = verseByDay.get(Number(row.day));
    const surah = verse?.surah ?? verse?.surah_number ?? "";
    const ayahStart = verse?.ayah_start ?? verse?.ayah_number ?? "";
    const ayahEnd = verse?.ayah_end ?? verse?.ayah_number ?? "";
    const theme = verse?.theme ?? verse?.theme_title ?? "";

    return [
      row.user_id,
      row.day,
      surah,
      ayahStart,
      ayahEnd,
      theme,
      row.observe_text ?? "",
      row.insight_text ?? "",
      row.contemplate_text ?? "",
      row.rebuild_text ?? "",
      row.ai_response ?? "",
      row.created_at,
      row.updated_at,
    ]
      .map(escapeCsv)
      .join(",");
  });

  const csv = "\uFEFF" + [headers.join(","), ...lines].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="ramadan-journal-export.csv"',
      "Cache-Control": "no-store",
    },
  });
}
