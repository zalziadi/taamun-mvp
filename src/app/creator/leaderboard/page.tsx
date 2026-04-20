import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "أعلى المبدعين — تمعّن",
  description:
    "أكثر المبدعين اشتراكاً في تمعّن — رحلات قرآنية قصيرة أنشأها قارئون موثوقون.",
  openGraph: {
    title: "أعلى المبدعين — تمعّن",
    description:
      "أكثر المبدعين اشتراكاً في رحلاتهم القرآنية القصيرة.",
    type: "website",
  },
};

type JourneyRow = {
  creator_user_id: string;
  creator_display_name: string;
  subscriber_count: number;
  duration_days: number;
  slug: string;
  title: string;
  created_at: string;
};

interface CreatorAggregate {
  creator_user_id: string;
  creator_display_name: string;
  total_subscribers: number;
  journey_count: number;
  top_journey_slug: string;
  top_journey_title: string;
}

async function loadLeaderboard(): Promise<CreatorAggregate[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("creator_journeys")
    .select("creator_user_id, creator_display_name, subscriber_count, duration_days, slug, title, created_at")
    .eq("status", "published")
    .order("subscriber_count", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as JourneyRow[];
  const byCreator = new Map<string, CreatorAggregate>();

  for (const j of rows) {
    const key = j.creator_user_id;
    const existing = byCreator.get(key);
    if (!existing) {
      byCreator.set(key, {
        creator_user_id: key,
        creator_display_name: j.creator_display_name,
        total_subscribers: j.subscriber_count ?? 0,
        journey_count: 1,
        top_journey_slug: j.slug,
        top_journey_title: j.title,
      });
    } else {
      existing.total_subscribers += j.subscriber_count ?? 0;
      existing.journey_count += 1;
      // top_journey stays as the first-seen (highest subscribers because list is pre-sorted)
    }
  }

  return Array.from(byCreator.values())
    .sort((a, b) => b.total_subscribers - a.total_subscribers)
    .slice(0, 10);
}

export default async function CreatorLeaderboard() {
  const creators = await loadLeaderboard();

  return (
    <main className="max-w-2xl mx-auto px-5 sm:px-6 py-10 space-y-6" dir="rtl">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2f2619]">
          أعلى المبدعين
        </h1>
        <p className="text-sm text-[#5a4a35] leading-relaxed">
          أكثر من يلهم القلوب في تمعّن — مرتّبين بعدد المشتركين.
        </p>
      </header>

      {creators.length === 0 ? (
        <p className="tm-card p-6 text-center text-sm text-[#8c7851] italic">
          لا بيانات بعد — عد بعد نشر أول رحلات المبدعين.
        </p>
      ) : (
        <ol className="space-y-3">
          {creators.map((c, idx) => (
            <li key={c.creator_user_id}>
              <Link
                href={`/creator/by/${c.creator_user_id}`}
                className="tm-card p-5 flex items-center gap-4 hover:bg-[#fdfbf6]"
              >
                <span className="text-lg font-bold text-[#8c7851] w-6 shrink-0 text-center">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#2f2619] truncate">
                    {c.creator_display_name}
                  </p>
                  <p className="text-[11px] text-[#8c7851] truncate">
                    {c.journey_count} رحلة · أبرزها &ldquo;{c.top_journey_title}&rdquo;
                  </p>
                </div>
                <span className="text-xs font-bold text-[#5a4a35] shrink-0">
                  {c.total_subscribers} مشترك
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <div className="text-center pt-2">
        <Link
          href="/discover"
          className="text-xs text-[#5a4a35] underline hover:no-underline"
        >
          استكشف كل الرحلات →
        </Link>
      </div>
    </main>
  );
}
