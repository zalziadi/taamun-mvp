import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JourneySubscribeButton } from "@/components/JourneySubscribeButton";
import { CreatorFollowButton } from "@/components/CreatorFollowButton";
import { courseSchema, jsonLdString } from "@/lib/json-ld";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

async function loadJourney(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const viewerId = auth.user?.id ?? null;

  const { data: journey } = await supabase
    .from("creator_journeys")
    .select("slug, creator_user_id, title, description, duration_days, creator_display_name, status, subscriber_count")
    .eq("slug", slug)
    .maybeSingle();

  if (!journey) return null;

  const isOwner = viewerId && journey.creator_user_id === viewerId;
  if (journey.status !== "published" && !isOwner) return null;

  const { data: days } = await supabase
    .from("creator_journey_days")
    .select("day_number, verse_ref, reflection_prompt")
    .eq("journey_slug", slug)
    .order("day_number", { ascending: true });

  let subscribed = false;
  let currentDay = 1;
  if (viewerId) {
    const { data: sub } = await supabase
      .from("creator_journey_subscriptions")
      .select("current_day")
      .eq("user_id", viewerId)
      .eq("journey_slug", slug)
      .maybeSingle();
    if (sub) {
      subscribed = true;
      currentDay = sub.current_day as number;
    }
  }

  return {
    journey,
    days: days ?? [],
    isOwner: !!isOwner,
    subscribed,
    currentDay,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadJourney(slug);
  if (!data) return { title: "رحلة غير موجودة — تمعّن" };
  const title = `${data.journey.title} — رحلة تمعّن`;
  const description = data.journey.description.slice(0, 160);
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
  };
}

export default async function JourneyPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await loadJourney(slug);
  if (!data) notFound();

  const { journey, days, isOwner, subscribed, currentDay } = data;
  const isDraft = journey.status !== "published";

  const schema = !isDraft
    ? courseSchema({
        slug: journey.slug as string,
        title: journey.title as string,
        description: journey.description as string,
        durationDays: journey.duration_days as number,
        creatorName: journey.creator_display_name as string,
      })
    : null;

  return (
    <main className="max-w-2xl mx-auto px-5 sm:px-6 py-10 space-y-6" dir="rtl">
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(schema) }}
        />
      )}
      <nav className="text-xs text-[#8c7851]">
        <Link href="/discover" className="hover:text-[#5a4a35]">استكشف</Link>
        <span className="mx-2">/</span>
        <span className="text-[#5a4a35]">{journey.title}</span>
      </nav>

      <article className="tm-card p-6 sm:p-8 space-y-4">
        {isDraft && (
          <p className="text-[11px] text-[#a6772b] italic">
            (معاينة — هذه الرحلة {journey.status === "flagged" ? "في المراجعة" : "مسوّدة"})
          </p>
        )}
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-[#2f2619] leading-tight">
            {journey.title}
          </h1>
          <span className="text-[11px] text-[#8c7851] shrink-0">
            {journey.duration_days} يوم
          </span>
        </div>
        <p className="text-sm leading-relaxed text-[#3d342a] whitespace-pre-wrap">
          {journey.description}
        </p>
        <p className="text-[11px] text-[#8c7851]">
          بقلم {journey.creator_display_name}
          {journey.subscriber_count > 0 && ` · ${journey.subscriber_count} مشترك`}
        </p>

        {!isDraft && (
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <JourneySubscribeButton slug={journey.slug} alreadySubscribed={subscribed} />
            <CreatorFollowButton
              creatorId={journey.creator_user_id as string}
              journeySlug={journey.slug}
            />
          </div>
        )}
        {!isDraft && subscribed && (
          <p className="text-[11px] text-[#8c7851]">
            أنت على اليوم {currentDay} من {journey.duration_days}
          </p>
        )}

        {isOwner && isDraft && (
          <div className="pt-2">
            <Link
              href={`/creator/${journey.slug}`}
              className="inline-block border border-[#5a4a35] text-[#5a4a35] bg-transparent px-5 py-2 text-xs font-bold hover:bg-[#5a4a35]/5"
            >
              تحرير الرحلة
            </Link>
          </div>
        )}
      </article>

      {days.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#5a4a35]">
            نظرة على الأيام
          </h2>
          <ul className="space-y-2">
            {days.map((d) => (
              <li
                key={d.day_number}
                className="tm-card p-4 flex items-start gap-3"
              >
                <span className="text-[11px] font-bold text-[#8c7851] shrink-0 mt-0.5">
                  {d.day_number}
                </span>
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-[#5a4a35] font-bold">
                    {d.verse_ref}
                  </p>
                  <p className="text-[11px] text-[#3d342a] leading-relaxed line-clamp-2">
                    {d.reflection_prompt}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
