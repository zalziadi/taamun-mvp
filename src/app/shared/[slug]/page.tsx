import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Params = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("shared_insights")
    .select("content, status")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) {
    return { title: "رؤية غير موجودة" };
  }

  const snippet = (data.content as string).slice(0, 120);
  return {
    title: `"${snippet}" — تمعّن`,
    description: snippet,
    openGraph: {
      title: "رؤية من تمعّن",
      description: snippet,
    },
  };
}

/**
 * /shared/[slug] — public page showing a single shared insight.
 * Fully static markup, Arabic typography, indexable.
 */
export default async function SharedInsightPage({ params }: Params) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: insight } = await supabase
    .from("shared_insights")
    .select("slug, content, attribution, status, created_at, views")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!insight) {
    notFound();
  }

  // Increment views (fire-and-forget, no await for page load)
  supabase
    .from("shared_insights")
    .update({ views: ((insight.views as number) ?? 0) + 1 })
    .eq("slug", slug)
    .then(() => {}, () => {});

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-16"
      style={{ background: "#fcfaf7", color: "#2f2619", direction: "rtl" }}
    >
      <div className="w-full max-w-lg text-center space-y-10">
        {/* Logo */}
        <div>
          <p className="font-[var(--font-amiri)] text-3xl font-bold" style={{ color: "#5a4a35" }}>
            تمعّن
          </p>
          <p className="mt-1 text-xs" style={{ color: "#8a7a65" }}>
            رحلة اكتشاف المعنى بلغة القرآن
          </p>
        </div>

        {/* The insight */}
        <blockquote
          className="mx-auto max-w-md px-4 py-10 font-[var(--font-amiri)] text-xl sm:text-2xl leading-[2.2] text-[#2f2619]"
          style={{ borderTop: "1px solid #c9b88a77", borderBottom: "1px solid #c9b88a77" }}
        >
          {insight.content}
        </blockquote>

        {insight.attribution && (
          <p className="text-sm" style={{ color: "#8a7a65" }}>
            — {insight.attribution}
          </p>
        )}

        {/* CTA */}
        <div className="space-y-3 pt-4">
          <Link
            href="/"
            className="inline-block px-10 py-3 text-sm font-bold border"
            style={{ background: "#5a4a35", color: "#fcfaf7", borderColor: "#5a4a35" }}
          >
            ابدأ رحلتك مع تمعّن
          </Link>
          <p className="text-[11px]" style={{ color: "#8a7a65" }}>
            ٢٨ يوماً — من القراءة إلى التجربة
          </p>
        </div>
      </div>
    </div>
  );
}
