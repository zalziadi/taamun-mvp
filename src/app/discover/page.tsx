import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Supabase reads happen at request time; don't prerender with missing env.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "استكشف رحلات المبدعين — تمعّن",
  description:
    "رحلات قرآنية قصيرة (٧ أو ١٤ يوماً) أنشأها مبدعون موثوقون في تمعّن.",
  openGraph: {
    title: "استكشف رحلات المبدعين — تمعّن",
    description:
      "رحلات قرآنية قصيرة أنشأها مبدعون موثوقون.",
    type: "website",
  },
};

async function loadJourneys() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("creator_journeys")
    .select("slug, title, description, duration_days, creator_display_name, subscriber_count, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(60);
  return data ?? [];
}

export default async function DiscoverPage() {
  const journeys = await loadJourneys();

  return (
    <main className="max-w-3xl mx-auto px-5 sm:px-6 py-10 space-y-8" dir="rtl">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2f2619]">
          استكشف رحلات المبدعين
        </h1>
        <p className="text-sm text-[#5a4a35] leading-relaxed">
          رحلات قرآنية قصيرة (٧ أو ١٤ يوماً) أنشأها مبدعون موثوقون في تمعّن.
          اختَر ما يلامس قلبك الآن.
        </p>
      </header>

      {journeys.length === 0 ? (
        <p className="tm-card p-6 text-center text-sm text-[#8c7851] italic">
          لا توجد رحلات منشورة بعد — عد قريباً.
        </p>
      ) : (
        <ul className="space-y-4">
          {journeys.map((j) => (
            <li key={j.slug}>
              <Link
                href={`/journey/${j.slug}`}
                className="tm-card p-5 sm:p-6 block space-y-2 hover:bg-[#fdfbf6] transition-colors"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-base sm:text-lg font-bold text-[#2f2619] leading-tight">
                    {j.title}
                  </h2>
                  <span className="text-[10px] text-[#8c7851] shrink-0">
                    {j.duration_days} يوم
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#3d342a] leading-relaxed line-clamp-3">
                  {j.description}
                </p>
                <div className="flex items-center justify-between pt-1 text-[11px] text-[#8c7851]">
                  <span>بقلم {j.creator_display_name}</span>
                  <span>
                    {j.subscriber_count > 0
                      ? `${j.subscriber_count} مشترك`
                      : "جديد"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
