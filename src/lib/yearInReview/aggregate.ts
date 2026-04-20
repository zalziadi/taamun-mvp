/**
 * Phase 11 — Year-in-Review aggregation wrapper (YIR-01..06).
 *
 * Server-side helper that Plan 11.04's Server Component calls:
 *
 *   getYearInReview(userId) → YIRPublicStats | null
 *
 * Policy centralised here:
 *   - YIR-01 threshold gate: < 30 reflections in the YIR window → null
 *   - YIR-03 cache policy: row younger than 24h → serve; else regenerate
 *   - YIR-04 anniversary anchor: activation_started_at ?? created_at
 *   - YIR-06 graceful degradation: shape is stable even for < 365-day users
 *
 * Contract: this function NEVER throws. Errors log + return null so the page
 * can render a gentle "ارجع لاحقاً" state instead of a 500.
 *
 * Privacy: this module imports ONLY `YIRPublicStats` + `isYIRPublicStats`
 * from ./types — never `YIRPrivateContent`. Plan 11.07 adds a grep guard.
 */

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isYIRPublicStats, type YIRPublicStats } from "./types";
import { yearKeyForUser, parseYearKey } from "./yearKey";

export const MIN_REFLECTIONS_THRESHOLD = 30; // YIR-01
export const CACHE_TTL_HOURS = 24; // YIR-03
const HOUR_MS = 60 * 60 * 1000;

type Profile = {
  activation_started_at: string | null;
  created_at: string;
};

/**
 * Returns the user's YIR snapshot, or null if they don't yet have enough
 * data (< 30 reflections in the anniversary window) or if any underlying
 * read fails.
 *
 * `supabase` and `now` are injectable for tests. Defaults read from
 * `getSupabaseAdmin()` + real clock.
 */
export async function getYearInReview(
  userId: string,
  supabase?: ReturnType<typeof getSupabaseAdmin>,
  now: () => Date = () => new Date()
): Promise<YIRPublicStats | null> {
  try {
    const admin = supabase ?? getSupabaseAdmin();

    // 1. Profile lookup — needed to compute anniversary anchor.
    const { data: profileRaw, error: pErr } = await admin
      .from("profiles")
      .select("activation_started_at, created_at")
      .eq("id", userId)
      .maybeSingle();
    if (pErr) {
      console.warn("[yir] profile read error:", pErr);
      return null;
    }
    if (!profileRaw) return null;

    const profile = profileRaw as Profile;
    const nowDate = now();
    const yearKey = yearKeyForUser(profile, nowDate);

    // 2. Threshold gate — count reflections in the [start, end) window.
    //    Always consult the DB for the gate (YIR-01) — never trust cache here.
    const anchor = new Date(profile.activation_started_at ?? profile.created_at);
    const { start, end } = parseYearKey(yearKey, anchor);
    const countResp = (await admin
      .from("reflections")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())) as {
      count: number | null;
      error: unknown;
    };
    const reflectionsCount = countResp?.count ?? 0;
    if (reflectionsCount < MIN_REFLECTIONS_THRESHOLD) {
      return null;
    }

    // 3. Cache lookup.
    const { data: cachedRaw } = await admin
      .from("year_reviews")
      .select("payload, generated_at")
      .eq("user_id", userId)
      .eq("year_key", yearKey)
      .maybeSingle();

    if (cachedRaw) {
      const cached = cachedRaw as {
        payload: unknown;
        generated_at: string | null;
      };
      if (
        cached.generated_at &&
        isFresh(cached.generated_at, nowDate) &&
        isYIRPublicStats(cached.payload)
      ) {
        return cached.payload;
      }
    }

    // 4. Regenerate via RPC.
    const { data: rpcData, error: rpcErr } = await admin.rpc(
      "get_year_in_review",
      { p_user_id: userId, p_year_key: yearKey }
    );
    if (rpcErr) {
      console.warn("[yir] RPC error:", rpcErr);
      return null;
    }
    if (!isYIRPublicStats(rpcData)) {
      console.warn("[yir] RPC returned malformed payload");
      return null;
    }

    // 5. Upsert fresh snapshot.
    const upsertResp = await admin.from("year_reviews").upsert(
      {
        user_id: userId,
        year_key: yearKey,
        payload: rpcData,
        generated_at: nowDate.toISOString(),
      },
      { onConflict: "user_id,year_key" }
    );
    // Soft-warn on upsert failure — still return the fresh payload (the user
    // gets a correct page view; next request will regenerate).
    if ((upsertResp as { error?: unknown }).error) {
      console.warn(
        "[yir] upsert failed (non-fatal):",
        (upsertResp as { error?: unknown }).error
      );
    }

    return rpcData;
  } catch (err) {
    console.warn("[yir] getYearInReview failed:", err);
    return null;
  }
}

function isFresh(generatedAt: string, nowDate: Date): boolean {
  const gAt = new Date(generatedAt).getTime();
  if (isNaN(gAt)) return false;
  return nowDate.getTime() - gAt < CACHE_TTL_HOURS * HOUR_MS;
}
