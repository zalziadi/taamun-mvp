import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreatorFollowButton } from "@/components/CreatorFollowButton";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ userId: string }> };

async function loadCreator(userId: string) {
  const supabase = await createSupabaseServerClient();

  // Pull published journeys by this creator — RLS allows anon to read published.
  const { data: journeys } = await supabase
    .from("creator_journeys")
    .select("slug, title, description, duration_days, creator_display_name, subscriber_count, created_at")
    .eq("creator_user_id", userId)
    .eq("status", "published")
    .order("subscriber_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);

  const list = journeys ?? [];
  if (list.length === 0) return null;

  // Derive display name from the most-subscribed published journey.
  const displayName = list[0].creator_display_name as string;
  const totalSubscribers = list.reduce(
    (n, j) => n + ((j.subscriber_count as number) || 0),
    0
  );

  return { displayName, journeys: list, totalSubscribers };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { userId } = await params;
  const data = await loadCreator(userId);
  if (!data) return { title: "مبدع غير موجود — تمعّن" };
  const title = `${data.displayName} — رحلات في تمعّن`;
  const description = `${data.journeys.length} رحلة قرآنية قصيرة من ${data.displayName}.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
  };
}

export default async function CreatorPublicProfile({ params }: PageProps) {
  const { userId } = await params;
  const data = await loadCreator(userId);
  if (!data) notFound();

  const { displayName, journeys, totalSubscribers } = data;

  return (
    <main className="max-w-2xl mx-auto px-5 sm:px-6 py-10 space-y-6" dir="rtl">
      <nav className="text-xs text-[#8c7851]">
        <Link href="/discover" className="hover:text-[#5a4a35]">استكشف</Link>
        <span className="mx-2">/</span>
        <span className="text-[#5a4a35]">{displayName}</span>
      </nav>

      <header className="tm-card p-6 sm:p-8 space-y-3">
        <h1 className="text-2xl font-bold text-[#2f2619]">{displayName}</h1>
        <p className="text-sm text-[#5a4a35]">
          {journeys.length} رحلة منشورة · {totalSubscribers} إجمالي المشتركين
        </p>
        <div className="pt-1">
          <CreatorFollowButton creatorId={userId} />
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#5a4a35]">الرحلات</h2>
        <ul className="space-y-3">
          {journeys.map((j) => (
            <li key={j.slug}>
              <Link
                href={`/journey/${j.slug}`}
                className="tm-card p-5 block space-y-2 hover:bg-[#fdfbf6]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-base font-bold text-[#2f2619] leading-tight">
                    {j.title}
                  </h3>
                  <span className="text-[10px] text-[#8c7851] shrink-0">
                    {j.duration_days} يوم
                  </span>
                </div>
                <p className="text-xs text-[#3d342a] line-clamp-2 leading-relaxed">
                  {j.description}
                </p>
                <p className="text-[11px] text-[#8c7851]">
                  {j.subscriber_count > 0
                    ? `${j.subscriber_count} مشترك`
                    : "جديدة"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
