import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { emitEvent } from "@/lib/analytics/server";
import { YearInReviewArchive } from "@/components/YearInReviewArchive";
// Plan 11.03 (parallel Wave 2) ships this helper. Until that plan lands,
// the import path is reserved here so Plan 11.05 and downstream work has
// a stable surface. `getYearInReview` returns `YIRPublicStats | null` —
// null means "below threshold, show gentle nudge" (no event, no archive).
import { getYearInReview } from "@/lib/yearInReview/aggregate";
import type { YIRPublicStats } from "@/lib/yearInReview/types";

/**
 * /year-in-review — Server Component (Plan 11.04).
 *
 * Flow:
 *   1. `requireUser()` — unauthenticated users redirect to /auth?next=...
 *      (mirrors the `/account/referral` pattern; requireUser's JSON-401
 *      response shape is meant for Route Handlers, not Server Components).
 *   2. `getYearInReview(user.id)` — aggregates YIRPublicStats via the cached
 *      `get_year_in_review` RPC (Plan 11.01). Returns `null` when the user
 *      has <30 reflections (YIR-06 threshold gate).
 *   3. Below threshold → gentle Arabic nudge. NO event fires. NO share
 *      button rendered. Respects the "reflective tone, no shaming" tenet
 *      (YIR-09, YIR-06).
 *   4. Above threshold → fire-and-forget `year_review_opened` event with
 *      `{year_key, reflections_count}` (YIR-04; property names whitelisted
 *      by ANALYTICS-12 — zero PII), then render the archive.
 *
 * Privacy:
 *   - Page imports ONLY `YIRPublicStats` — never `YIRPrivateContent`
 *     (YIR-08, YIR-11; Plan 11.07 grep guard verifies).
 *   - `emitEvent` properties are `year_key` + `reflections_count` only —
 *     no reflection text, no emails, no PII.
 *
 * Numerals (YIR-05): Eastern Arabic digits via `Intl.NumberFormat("ar-SA-u-nu-arab")`.
 *
 * Runtime (NFR-01): `nodejs` because `supabaseAdmin` (pulled in transitively
 * via `getYearInReview` → RPC call path) and `emitEvent` both run best on
 * the Node runtime per STACK.md.
 *
 * `force-dynamic` (PITFALL notes): per-visit fresh render so the RPC's 24h
 * cache layer — not Next's static cache — decides freshness. Also prevents
 * stale `year_review_opened` emission on statically-cached renders.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Derive the anniversary-anchored year key without importing from Plan 11.03's
 * parallel-wave helper. Format: `"YYYY_anniversary"` where YYYY is the year
 * component of the user's activation/creation date. This matches
 * `YEAR_KEY_PATTERN` in `src/lib/yearInReview/types.ts` and the RPC contract
 * in Plan 11.01.
 */
function yearKeyFromUser(user: {
  created_at?: string;
  user_metadata?: Record<string, unknown> | null;
}): string {
  const meta = user.user_metadata ?? {};
  const activation = (meta["activation_started_at"] ?? null) as string | null;
  const source = activation ?? user.created_at ?? new Date().toISOString();
  const year = new Date(source).getUTCFullYear();
  return `${year}_anniversary`;
}

export default async function YearInReviewPage() {
  const auth = await requireUser();
  if (!auth.ok) {
    redirect("/auth?next=/year-in-review");
  }
  const user = auth.user;

  const stats: YIRPublicStats | null = await getYearInReview(user.id);

  // Gate: below-threshold users see a gentle nudge. No event. No archive.
  if (!stats) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-2xl font-serif mb-4">سنتي مع القرآن</h1>
        <p className="text-lg leading-relaxed">
          حين تتراكم أيامك (على الأقل ٣٠ يوماً من التمعّن)، تستقبلك حصيلتك
          هنا بهدوء.
        </p>
        <p className="text-lg leading-relaxed mt-3">
          ارجع لاحقاً — الوقت ينضج ما بداخله.
        </p>
      </main>
    );
  }

  // Above-threshold: emit exactly one year_review_opened event, then render.
  // `void emitEvent(...)` is fire-and-forget per the emitEvent contract —
  // it never throws and never blocks the render path.
  const yearKey = yearKeyFromUser(user);
  void emitEvent(
    {
      name: "year_review_opened",
      properties: {
        year_key: yearKey,
        reflections_count: stats.reflections_count,
      },
    },
    user.id
  );

  return <YearInReviewArchive stats={stats} yearKey={yearKey} />;
}
