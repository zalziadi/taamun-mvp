import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Canonical list of ops metrics captured by both the live /api/ops/stats
 * aggregator and the daily /api/cron/ops-snapshot cron. Keeping this
 * array single-source-of-truth prevents drift between the live tiles
 * and the historical series.
 */
export interface MetricSpec {
  key: string;
  label: string;
  table: string;
  selectCol?: string;
  filter?: { column: string; value: string | boolean };
}

export const METRIC_SPECS: MetricSpec[] = [
  { key: "profiles_total", label: "إجمالي البروفايلات", table: "profiles" },
  { key: "push_subscriptions", label: "اشتراكات Push", table: "push_subscriptions" },
  { key: "threads_total", label: "خيوط (إجمالي)", table: "threads" },
  {
    key: "threads_flagged",
    label: "خيوط معلّمة",
    table: "threads",
    filter: { column: "status", value: "flagged" },
  },
  { key: "thread_replies_total", label: "ردود (إجمالي)", table: "thread_replies" },
  {
    key: "thread_replies_flagged",
    label: "ردود معلّمة",
    table: "thread_replies",
    filter: { column: "status", value: "flagged" },
  },
  {
    key: "journeys_total",
    label: "رحلات (إجمالي)",
    table: "creator_journeys",
    selectCol: "slug",
  },
  {
    key: "journeys_published",
    label: "رحلات منشورة",
    table: "creator_journeys",
    selectCol: "slug",
    filter: { column: "status", value: "published" },
  },
  {
    key: "journeys_draft",
    label: "رحلات مسوّدة",
    table: "creator_journeys",
    selectCol: "slug",
    filter: { column: "status", value: "draft" },
  },
  {
    key: "journeys_flagged",
    label: "رحلات معلّمة",
    table: "creator_journeys",
    selectCol: "slug",
    filter: { column: "status", value: "flagged" },
  },
  {
    key: "journey_subscriptions",
    label: "اشتراكات رحلات",
    table: "creator_journey_subscriptions",
  },
  { key: "creator_follows", label: "متابعات مبدعين", table: "creator_follows" },
  { key: "invites_total", label: "استخدامات دعوة", table: "invite_redemptions" },
  {
    key: "invites_rewarded",
    label: "مكافآت مطبّقة",
    table: "invite_redemptions",
    filter: { column: "rewarded", value: true },
  },
  { key: "insights_total", label: "رؤى (إجمالي)", table: "shared_insights", selectCol: "slug" },
  {
    key: "insights_flagged",
    label: "رؤى معلّمة",
    table: "shared_insights",
    selectCol: "slug",
    filter: { column: "status", value: "flagged" },
  },
];

/**
 * Head-count a table with an optional equality filter.
 * Returns 0 on error so a missing table can't break the whole snapshot.
 */
export async function headCount(
  admin: SupabaseClient,
  spec: MetricSpec
): Promise<number> {
  try {
    const selectCol = spec.selectCol ?? "id";
    let q = admin.from(spec.table).select(selectCol, { count: "exact", head: true });
    if (spec.filter) {
      q = q.eq(spec.filter.column, spec.filter.value);
    }
    const { count } = await q;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Build the full metric → value map for today.
 */
export async function captureAllMetrics(
  admin: SupabaseClient
): Promise<Array<{ key: string; value: number }>> {
  const results = await Promise.all(
    METRIC_SPECS.map(async (spec) => ({
      key: spec.key,
      value: await headCount(admin, spec),
    }))
  );
  return results;
}
