const TOTAL_DAYS = 28;
const PRIMARY_TABLE = "progress";
const LEGACY_TABLE = "user_progress";

type ProgressShape = {
  current_day: number | null;
  completed_days: unknown;
};

function isMissingTableError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  const message = String((error as { message?: string } | null)?.message ?? "").toLowerCase();
  if (code === "42P01") return true;
  return message.includes("does not exist");
}

function normalizeCompletedDays(values: unknown): number[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 1 && value <= TOTAL_DAYS)
    )
  ).sort((a, b) => a - b);
}

async function selectProgressRaw(supabase: any, table: string, userId: string) {
  return supabase
    .from(table)
    .select("current_day, completed_days")
    .eq("user_id", userId)
    .maybeSingle();
}

export async function readUserProgress(supabase: any, userId: string) {
  const primary = await selectProgressRaw(supabase, PRIMARY_TABLE, userId);
  if (!primary.error) {
    return {
      ok: true as const,
      table: PRIMARY_TABLE,
      currentDay: Number(primary.data?.current_day) || 1,
      completedDays: normalizeCompletedDays(primary.data?.completed_days),
      exists: !!primary.data,
    };
  }

  if (!isMissingTableError(primary.error)) {
    return { ok: false as const, error: primary.error };
  }

  const legacy = await selectProgressRaw(supabase, LEGACY_TABLE, userId);
  if (legacy.error) return { ok: false as const, error: legacy.error };

  return {
    ok: true as const,
    table: LEGACY_TABLE,
    currentDay: Number(legacy.data?.current_day) || 1,
    completedDays: normalizeCompletedDays(legacy.data?.completed_days),
    exists: !!legacy.data,
  };
}

export async function ensureUserProgress(supabase: any, userId: string) {
  const existing = await readUserProgress(supabase, userId);
  if (!existing.ok) return existing;
  if (existing.exists) return existing;

  const { data: inserted, error: insertError } = await supabase
    .from(existing.table)
    .insert({ user_id: userId, current_day: 1, completed_days: [] })
    .select("current_day, completed_days")
    .single();

  if (insertError || !inserted) {
    return { ok: false as const, error: insertError ?? new Error("insert_failed") };
  }

  return {
    ok: true as const,
    table: existing.table,
    currentDay: Number(inserted.current_day) || 1,
    completedDays: normalizeCompletedDays(inserted.completed_days),
    exists: true as const,
  };
}

export async function upsertUserProgress(
  supabase: any,
  userId: string,
  payload: { currentDay: number; completedDays: number[] }
) {
  const existing = await readUserProgress(supabase, userId);
  if (!existing.ok) return existing;

  const { error } = await supabase.from(existing.table).upsert(
    {
      user_id: userId,
      current_day: payload.currentDay,
      completed_days: normalizeCompletedDays(payload.completedDays),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return { ok: false as const, error };

  return {
    ok: true as const,
    table: existing.table,
    currentDay: payload.currentDay,
    completedDays: normalizeCompletedDays(payload.completedDays),
  };
}

export async function listAllProgressRows(supabase: any) {
  const primary = await supabase
    .from(PRIMARY_TABLE)
    .select("user_id, current_day, completed_days");
  if (!primary.error) {
    return { ok: true as const, table: PRIMARY_TABLE, data: primary.data ?? [] };
  }

  if (!isMissingTableError(primary.error)) {
    return { ok: false as const, error: primary.error };
  }

  const legacy = await supabase
    .from(LEGACY_TABLE)
    .select("user_id, current_day, completed_days");
  if (legacy.error) return { ok: false as const, error: legacy.error };

  return { ok: true as const, table: LEGACY_TABLE, data: legacy.data ?? [] };
}
