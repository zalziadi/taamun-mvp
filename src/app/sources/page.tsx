import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasBookAccess(profile: {
  book_access?: boolean | null;
  role?: string | null;
  subscription_tier?: string | null;
  subscription_status?: string | null;
  expires_at?: string | null;
} | null) {
  if (!profile) return false;

  const tier = profile.subscription_tier;
  const isActive =
    profile.subscription_status === "active" &&
    !!profile.expires_at &&
    new Date(profile.expires_at) > new Date();

  return (
    profile.book_access === true ||
    profile.role === "admin" ||
    (isActive && (tier === "eid" || tier === "monthly" || tier === "yearly" || tier === "vip"))
  );
}

export default async function SourcesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let canOpenBook = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("book_access, role, subscription_tier, subscription_status, expires_at")
      .eq("id", user.id)
      .maybeSingle();

    canOpenBook = hasBookAccess(profile);
  }

  return (
    <div className="tm-shell space-y-6">
      <section className="tm-card p-7">
        <p className="text-xs tracking-[0.22em] text-[#8c7851]">SOURCES</p>
        <h1 className="tm-heading mt-2 text-4xl leading-tight">مصادر</h1>
        <p className="mt-3 max-w-[780px] text-sm leading-relaxed text-[#5f5648]/85">
          مرجعان أساسيان في المنصة: القرآن الكريم، وكتاب مدينة المعنى. اختر المصدر الذي تريد البدء منه.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="tm-card p-6">
          <div className="mb-3 inline-flex rounded-full border border-[#cdb98f] bg-[#f1e7d4] px-3 py-1 text-xs text-[#7b694a]">
            المصدر الأول
          </div>
          <h2 className="tm-heading text-3xl text-[#5a4531]">القرآن الكريم</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6f6455]">
            اقرأ الآيات مباشرة من مصدر موثوق للرجوع السريع أثناء التمعّن.
          </p>
          <a
            href="https://quran.com/ar"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block rounded-xl bg-[#7b694a] px-5 py-2.5 text-sm font-semibold text-[#fff8f0] transition hover:bg-[#6d5e44]"
          >
            فتح القرآن الكريم
          </a>
        </article>

        <article className="tm-card p-6">
          <div className="mb-3 inline-flex rounded-full border border-[#cdb98f] bg-[#f1e7d4] px-3 py-1 text-xs text-[#7b694a]">
            المصدر الثاني
          </div>
          <h2 className="tm-heading text-3xl text-[#5a4531]">كتاب مدينة المعنى</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6f6455]">
            تصفح فصول الكتاب داخل الموقع أو افتح نسخة PDF للقراءة المركزة.
          </p>

          {canOpenBook ? (
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/book"
                className="inline-block rounded-xl bg-[#7b694a] px-5 py-2.5 text-sm font-semibold text-[#fff8f0] transition hover:bg-[#6d5e44]"
              >
                فتح الكتاب داخل المنصة
              </Link>
              <Link
                href="/book/pdf"
                className="inline-block rounded-xl border border-[#d8cdb9] bg-[#f8f3ea] px-4 py-2.5 text-sm font-semibold text-[#7d7362] transition hover:bg-[#f1e7d4]"
              >
                PDF
              </Link>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap gap-2">
              <div className="inline-flex rounded-full border border-[#d8cdb9] bg-[#f8f3ea] px-4 py-2 text-sm font-semibold text-[#7d7362]">
                للمشتركين
              </div>
              <Link
                href="/pricing"
                className="inline-block rounded-xl bg-[#c9b88a] px-4 py-2 text-sm font-semibold text-[#2f2619] transition hover:opacity-90"
              >
                تفعيل الاشتراك
              </Link>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
