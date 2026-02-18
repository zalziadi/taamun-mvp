import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RAMADAN_PROGRAM_KEY } from "@/lib/appConfig";

export const dynamic = "force-dynamic";

const DEFAULT_PROGRAM_KEY = RAMADAN_PROGRAM_KEY;
const DEFAULT_VERSION = 1;
const TOTAL_DAYS = 28;

type DayStatus = "locked" | "empty" | "partial" | "completed";

function isNonEmpty(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function getStatus(row: {
  observe_text?: string | null;
  insight_text?: string | null;
  contemplate_text?: string | null;
}): Exclude<DayStatus, "locked"> {
  const o = isNonEmpty(row.observe_text);
  const i = isNonEmpty(row.insight_text);
  const c = isNonEmpty(row.contemplate_text);
  if (o && i && c) return "completed";
  if (o || i || c) return "partial";
  return "empty";
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { data: program, error: programError } = await supabase
    .from("ramadan_verses")
    .select("day,surah,ayah_start,ayah_end,theme")
    .eq("program_key", DEFAULT_PROGRAM_KEY)
    .eq("version", DEFAULT_VERSION)
    .order("day", { ascending: true });

  if (programError) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("ramadan_responses")
    .select(
      "day,observe_text,insight_text,contemplate_text,rebuild_text,ai_response,created_at,updated_at"
    )
    .eq("user_id", user.id)
    .eq("program_key", DEFAULT_PROGRAM_KEY)
    .eq("version", DEFAULT_VERSION)
    .order("day", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const responseMap = new Map<number, (typeof data)[number]>();
  for (const row of data ?? []) responseMap.set(Number(row.day), row);

  const programMap = new Map<number, (typeof program)[number]>();
  for (const p of program ?? []) programMap.set(Number(p.day), p);

  const items: Array<{
    day: number;
    status: DayStatus;
    locked: boolean;
    theme: string | null;
    ref: { surah: number; ayahStart: number; ayahEnd: number } | null;
    response: {
      observeText: string;
      insightText: string;
      contemplateText: string;
      rebuildText: string;
      aiResponse: string;
      createdAt: string | null;
      updatedAt: string | null;
    } | null;
  }> = [];

  let previousCompleted = true;
  for (let day = 1; day <= TOTAL_DAYS; day++) {
    const response = responseMap.get(day);
    const programDay = programMap.get(day);
    const baseStatus = response ? getStatus(response) : "empty";
    const isLockedDay: boolean = day === 1 ? false : !previousCompleted;
    const status: DayStatus = isLockedDay && baseStatus === "empty" ? "locked" : baseStatus;

    items.push({
      day,
      status,
      locked: isLockedDay,
      theme: programDay?.theme ?? null,
      ref: programDay
        ? {
            surah: programDay.surah,
            ayahStart: programDay.ayah_start,
            ayahEnd: programDay.ayah_end,
          }
        : null,
      response: response
        ? {
            observeText: response.observe_text ?? "",
            insightText: response.insight_text ?? "",
            contemplateText: response.contemplate_text ?? "",
            rebuildText: response.rebuild_text ?? "",
            aiResponse: response.ai_response ?? "",
            createdAt: response.created_at ?? null,
            updatedAt: response.updated_at ?? null,
          }
        : null,
    });

    previousCompleted = status === "completed";
  }

  return NextResponse.json({ ok: true, items });
}
