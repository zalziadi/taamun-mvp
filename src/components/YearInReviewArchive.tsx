import type { YIRPublicStats } from "@/lib/yearInReview/types";
import { AwarenessTrajectory } from "./AwarenessTrajectory";

/**
 * Phase 11.05 — YearInReviewArchive (full layout)
 *
 * Five-section calm archive (NOT Spotify Wrapped):
 *   1. Hero anchor verse
 *   2. Reflections count (Eastern Arabic numerals)
 *   3. Awareness sparkline (hand-rolled SVG, YIR-11)
 *   4. Milestones reached
 *   5. Share button → opens /year-in-review/og?year_key=... (Plan 11.06)
 *
 * Privacy contract (YIR-08, YIR-11): imports ONLY `YIRPublicStats` — never
 * any user-authored content (reflection text / emotion labels / guide
 * messages). Plan 11.07 grep guard enforces this in CI.
 *
 * Numerals (YIR-05): all user-facing numbers use Eastern Arabic digits via
 * `Intl.NumberFormat("ar-SA-u-nu-arab")`.
 *
 * Tone (CONTEXT §R4): no ranking vocabulary, no percentile comparisons, no
 * gamified milestone vocabulary, no urgency timer, no confetti, no
 * animation-on-mount. Calm archive, not celebration.
 *
 * The `shared` event is emitted server-side by Plan 11.06's OG route when the
 * crawler resolves the share card URL — most reliable signal that a share
 * actually reached a recipient.
 */

const ARABIC_NUM = new Intl.NumberFormat("ar-SA-u-nu-arab");
const num = (n: number) => ARABIC_NUM.format(n);

export function YearInReviewArchive({
  stats,
  yearKey,
}: {
  stats: YIRPublicStats;
  yearKey: string;
}) {
  return (
    <main
      className="mx-auto max-w-2xl px-6 py-12 space-y-12"
      dir="rtl"
      data-yir-archive
    >
      {/* Section 1: Hero anchor verse */}
      <header className="text-center">
        <p className="text-sm text-white/60 mb-2">سنتي مع القرآن</p>
        <h1 className="font-serif text-3xl leading-relaxed text-white">
          ﴿ إنّ هذا القرآن يهدي للّتي هي أقوم ﴾
        </h1>
        <p className="text-xs text-white/50 mt-2">{yearKey}</p>
      </header>

      {/* Section 2: Reflections count */}
      <section className="text-center">
        <div className="font-serif text-6xl text-[#C9A24B]">
          {num(stats.reflections_count)}
        </div>
        <div className="text-sm text-white/60 mt-2">تأمّل خلال السنة</div>
      </section>

      {/* Section 3: Awareness sparkline */}
      {stats.awareness_trajectory.length >= 2 && (
        <section>
          <h2 className="text-lg font-serif mb-3 text-center text-white">
            حضور وعيك
          </h2>
          <AwarenessTrajectory trajectory={stats.awareness_trajectory} />
          {stats.awareness_avg !== null && (
            <p className="text-center text-sm text-white/60 mt-3">
              المتوسط: {num(Math.round(stats.awareness_avg * 100))} / {num(100)}
            </p>
          )}
        </section>
      )}

      {/* Section 4: Milestones reached */}
      {stats.milestones_reached.length > 0 && (
        <section>
          <h2 className="text-lg font-serif mb-3 text-center text-white">
            محطاتك
          </h2>
          <ul className="flex flex-wrap gap-2 justify-center">
            {stats.milestones_reached.map((code) => (
              <li
                key={code}
                className="px-3 py-1 text-sm rounded-full border border-white/20 text-white/80"
              >
                {code}
              </li>
            ))}
          </ul>
          {stats.cycle_count > 0 && (
            <p className="text-center text-xs text-white/50 mt-3">
              أكملت {num(stats.cycle_count)} حلقة
            </p>
          )}
        </section>
      )}

      {/* Section 5: Share — explicit tap, opens OG share card URL */}
      <section className="text-center pt-6">
        <a
          href={`/year-in-review/og?year_key=${encodeURIComponent(yearKey)}`}
          className="inline-block px-6 py-3 rounded-full border border-[#C9A24B] text-[#C9A24B] hover:bg-[#C9A24B]/10 transition-colors"
          data-yir-share-button
        >
          شارك
        </a>
        <p className="text-xs text-white/50 mt-3">
          المشاركة لا تكشف تأمّلاتك — فقط الأرقام والمحطات.
        </p>
      </section>
    </main>
  );
}
