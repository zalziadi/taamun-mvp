import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ThemesInsight } from "@/components/ThemesInsight";

export const metadata = {
  title: "رؤى رحلتي",
  description: "المواضيع التي تتكرر في تأملاتك — استخرجها تمعّن.",
};

export default async function InsightsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth?.user) {
    redirect("/auth?next=/insights");
  }

  // Also fetch soul_summary to display alongside themes
  const { data: memory } = await supabase
    .from("guide_memory")
    .select("soul_summary, themes, soul_summary_updated_at")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  return (
    <div className="tm-shell space-y-6">
      {/* Heading */}
      <section className="tm-card p-6 sm:p-7 space-y-3 text-center">
        <p className="text-xs tracking-[0.15em] text-[#8c7851]/70">رؤى رحلتي</p>
        <h1 className="font-[var(--font-amiri)] text-2xl sm:text-3xl text-[#2f2619]">
          ما يتكرر في داخلك
        </h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-[#5f5648]/85">
          تمعّن يقرأ تأملاتك عبر الأيام ويستخرج المواضيع التي تعود إليها —
          ليست أحكاماً، بل مرايا.
        </p>
      </section>

      {/* Soul summary */}
      {memory?.soul_summary && (
        <section className="tm-card p-6 sm:p-7 space-y-3">
          <h2 className="text-sm font-bold text-[#5a4a35]">كيف يراك تمعّن</h2>
          <blockquote className="font-[var(--font-amiri)] text-lg leading-loose text-[#2f2619]">
            {memory.soul_summary}
          </blockquote>
          {memory.soul_summary_updated_at && (
            <p className="text-[10px] text-[#8c7851]/60 italic">
              تحدّث آخر مرة{" "}
              {new Date(memory.soul_summary_updated_at).toLocaleDateString("ar-SA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
        </section>
      )}

      {/* Themes (full detail, not compact) */}
      <ThemesInsight compact={false} />

      {/* Guidance if no data yet */}
      {!memory?.soul_summary && (
        <section className="tm-card p-6 sm:p-7 text-center space-y-3">
          <p className="text-sm text-[#5f5648]/85 max-w-md mx-auto">
            بعد ٣ أو ٤ أسابيع من التأمل ستظهر هنا رؤى تستخرجها تمعّن من
            كتاباتك. استمر — الملاحظات تتراكم.
          </p>
        </section>
      )}
    </div>
  );
}
