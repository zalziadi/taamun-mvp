import type { YIRPublicStats } from "@/lib/yearInReview/types";

/**
 * YearInReviewArchive — Plan 11.04 placeholder.
 *
 * Intentionally minimal. Plan 11.05 (Wave 3) replaces this body with the
 * full archive layout: hero verse → counts → awareness sparkline →
 * milestone badges grid → share button.
 *
 * Privacy contract (YIR-08, YIR-11): this component imports ONLY
 * `YIRPublicStats` — it never touches `YIRPrivateContent`. The Plan 11.07
 * grep guard verifies that invariant in CI.
 *
 * Numerals (YIR-05): all user-facing numbers use Eastern Arabic digits via
 * `Intl.NumberFormat("ar-SA-u-nu-arab")`.
 */
export function YearInReviewArchive({
  stats,
  yearKey,
}: {
  stats: YIRPublicStats;
  yearKey: string;
}) {
  const fmt = new Intl.NumberFormat("ar-SA-u-nu-arab");
  return (
    <main className="mx-auto max-w-2xl px-6 py-12" dir="rtl">
      <h1 className="text-3xl font-serif mb-6">
        سنتي مع القرآن — {yearKey}
      </h1>
      <p className="text-xl leading-relaxed">
        {fmt.format(stats.reflections_count)} تأمّل على مدار السنة.
      </p>
    </main>
  );
}
