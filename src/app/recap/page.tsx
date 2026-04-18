import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "سنتي في تمعّن",
  description: "ملخص رحلتك عبر السنة — التأملات، المواضيع، الوعي.",
};

function toArabicNum(n: number): string {
  const map = "٠١٢٣٤٥٦٧٨٩";
  return String(n).split("").map((d) => map[parseInt(d, 10)] ?? d).join("");
}

/**
 * /recap — personal "Year in Taamun" summary page.
 * Eligible after 90+ days of usage. Shows:
 *   - Total days active
 *   - Total reflections
 *   - Top 3 themes (from v1.2 reflection_themes)
 *   - soul_summary (narrative, from v1.2)
 *   - Awareness curve evolution
 *
 * Designed to be shared — generates an OG-friendly preview.
 */
export default async function RecapPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth?.user) {
    redirect("/auth?next=/recap");
  }

  const userId = auth.user.id;

  // Parallel data fetch
  const [
    { data: profile },
    { count: reflectionCount },
    { count: awarenessCount },
    { data: themes },
    { data: memory },
  ] = await Promise.all([
    supabase.from("profiles").select("full_name, created_at").eq("id", userId).maybeSingle(),
    supabase
      .from("reflections")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("awareness_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("reflection_themes")
      .select("label, keywords, reflection_count, rank")
      .eq("user_id", userId)
      .order("rank", { ascending: true })
      .limit(3),
    supabase
      .from("guide_memory")
      .select("soul_summary, themes")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  // Eligibility: created > 90 days ago
  const createdAt = profile?.created_at ? new Date(profile.created_at as string) : null;
  const daysInTaamun = createdAt
    ? Math.floor((Date.now() - createdAt.getTime()) / 86400000)
    : 0;

  if (daysInTaamun < 90) {
    return (
      <div className="tm-shell space-y-6">
        <section className="tm-card p-6 sm:p-7 text-center space-y-3">
          <h1 className="font-[var(--font-amiri)] text-2xl sm:text-3xl text-[#2f2619]">
            الملخص متاح بعد ٩٠ يوماً
          </h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-[#5f5648]/85">
            أنت الآن في يومك {toArabicNum(daysInTaamun)} مع تمعّن.
            <br />
            بعد {toArabicNum(90 - daysInTaamun)} يوماً ستجد هنا ملخصاً كاملاً لرحلتك.
          </p>
          <Link
            href="/"
            className="inline-block border border-[#5a4a35] px-6 py-3 text-sm font-bold text-[#5a4a35] hover:bg-[#5a4a35]/5"
          >
            تابع الرحلة
          </Link>
        </section>
      </div>
    );
  }

  const name = profile?.full_name ?? "المتمعّن";

  return (
    <div className="tm-shell space-y-6">
      {/* Header */}
      <section className="tm-card p-6 sm:p-7 text-center space-y-3">
        <p className="text-xs tracking-[0.15em] text-[#8c7851]/70">ملخصك في تمعّن</p>
        <h1 className="font-[var(--font-amiri)] text-3xl sm:text-4xl text-[#2f2619]">
          {name}
        </h1>
        <p className="text-sm text-[#5f5648]/85">
          {toArabicNum(daysInTaamun)} يوماً في الرحلة
        </p>
      </section>

      {/* Big numbers */}
      <section className="tm-card p-6 sm:p-7">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="space-y-1 border-t border-[#d8cdb9] pt-4">
            <p className="font-[var(--font-amiri)] text-4xl font-bold text-[#5a4a35]">
              {toArabicNum(reflectionCount ?? 0)}
            </p>
            <p className="text-xs text-[#8c7851]">تأمل كتبته</p>
          </div>
          <div className="space-y-1 border-t border-[#d8cdb9] pt-4">
            <p className="font-[var(--font-amiri)] text-4xl font-bold text-[#5a4a35]">
              {toArabicNum(awarenessCount ?? 0)}
            </p>
            <p className="text-xs text-[#8c7851]">لحظة حضور</p>
          </div>
        </div>
      </section>

      {/* Soul summary */}
      {memory?.soul_summary && (
        <section className="tm-card p-6 sm:p-7 space-y-3">
          <p className="text-xs tracking-[0.15em] text-[#8c7851]/70">كيف رآك تمعّن</p>
          <blockquote className="font-[var(--font-amiri)] text-lg leading-loose text-[#2f2619]">
            {memory.soul_summary}
          </blockquote>
        </section>
      )}

      {/* Top themes */}
      {themes && themes.length > 0 && (
        <section className="tm-card p-6 sm:p-7 space-y-4">
          <p className="text-xs tracking-[0.15em] text-[#8c7851]/70">
            ما عُدت إليه أكثر
          </p>
          <div className="space-y-3">
            {themes.map((t) => (
              <div key={t.label as string} className="border-t border-[#d8cdb9] pt-3 space-y-1">
                <p className="text-base font-semibold text-[#2f2619]">
                  {t.label as string}
                </p>
                {(t.keywords as string[])?.length > 0 && (
                  <p className="text-xs text-[#8c7851]">
                    {(t.keywords as string[]).join(" · ")}
                  </p>
                )}
                <p className="text-[11px] text-[#8c7851]/70">
                  {toArabicNum(t.reflection_count as number)} تأملاً
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Closing */}
      <section className="tm-card p-6 sm:p-7 text-center space-y-3">
        <p className="font-[var(--font-amiri)] text-lg leading-loose text-[#2f2619]">
          لا يتغيّر النص. الذي يتغيّر هو القارئ.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-3">
          <Link
            href="/guide"
            className="border border-[#5a4a35] px-5 py-2.5 text-sm font-bold text-[#5a4a35] hover:bg-[#5a4a35]/5"
          >
            تحدّث مع تمعّن
          </Link>
          <Link
            href="/insights"
            className="border border-[#d8cdb9] px-5 py-2.5 text-sm text-[#5f5648] hover:border-[#8c7851]"
          >
            رؤى أعمق
          </Link>
        </div>
      </section>
    </div>
  );
}
