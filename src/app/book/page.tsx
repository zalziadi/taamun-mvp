import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Paywall } from "@/components/Paywall";
import { BookViewer } from "@/components/BookViewer";

export default async function BookPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#15130f] p-4 sm:p-6 max-w-xl mx-auto">
        <h1 className="mb-2 text-2xl font-bold text-[#e8e1d9]">مدينة المعنى</h1>
        <p className="mb-6 text-[#c9b88a] text-sm">رحلة في الوعي بلغة القرآن</p>
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="mb-2 text-xs uppercase tracking-widest text-amber-400/60">من الكتاب — مقتطف</p>
          <p className="text-base leading-loose text-amber-100/90">&ldquo;القرآن لم يُنزَل ليُقرأ فحسب — بل ليقرأك. كل آية مرآة، وكل سورة رحلة. المعنى ليس في الكلمات وحدها، بل في ما يحدث داخلك حين تتوقف عندها.&rdquo;</p>
          <p className="mt-2 text-xs text-amber-400/50">مدينة المعنى بلغة القرآن — المقدمة</p>
        </div>
        <Paywall reason="book" title="الكتاب للمشتركين" message="اشترك في عيدية تمعّن بـ ٢٨ ريال وتحصل على الكتاب كاملاً + برنامج ٢٨ يوم" />
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("book_access, role, subscription_tier, subscription_status, expires_at")
    .eq("id", user.id)
    .maybeSingle();

  const tier = profile?.subscription_tier;
  const isActive =
    profile?.subscription_status === "active" &&
    profile?.expires_at &&
    new Date(profile.expires_at) > new Date();

  const hasAccess =
    profile?.book_access === true ||
    profile?.role === "admin" ||
    (isActive && (tier === "eid" || tier === "monthly" || tier === "yearly" || tier === "vip"));

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#15130f] p-4 sm:p-6 max-w-xl mx-auto">
        <h1 className="mb-2 text-2xl font-bold text-[#e8e1d9]">مدينة المعنى</h1>
        <p className="mb-6 text-[#c9b88a] text-sm">رحلة في الوعي بلغة القرآن</p>
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="mb-2 text-xs uppercase tracking-widest text-amber-400/60">من الكتاب — مقتطف</p>
          <p className="text-base leading-loose text-amber-100/90">&ldquo;القرآن لم يُنزَل ليُقرأ فحسب — بل ليقرأك. كل آية مرآة، وكل سورة رحلة. المعنى ليس في الكلمات وحدها، بل في ما يحدث داخلك حين تتوقف عندها.&rdquo;</p>
          <p className="mt-2 text-xs text-amber-400/50">مدينة المعنى بلغة القرآن — المقدمة</p>
        </div>
        <Paywall reason="book" title="الكتاب للمشتركين" message="اشترك في عيدية تمعّن بـ ٢٨ ريال وتحصل على الكتاب كاملاً + برنامج ٢٨ يوم" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#15130f] p-4 sm:p-6">
      <h1 className="mb-4 text-2xl font-bold text-[#e8e1d9]">مدينة المعنى بلغة القرآن</h1>
      <p className="mb-6 text-[#c9b88a]">الدليل والتطبيق — اقرأ في المتصفح</p>
      <BookViewer />
    </div>
  );
}
