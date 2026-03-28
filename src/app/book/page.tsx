import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Paywall } from "@/components/Paywall";
import { BookViewer } from "@/components/BookViewer";

export default async function BookPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#15130f] p-6 max-w-xl mx-auto">
        <h1 className="mb-2 text-2xl font-bold text-[#e8e1d9]">مدينة المعنى</h1>
        <p className="mb-6 text-[#c9b88a] text-sm">رحلة في الوعي بلغة القرآن</p>
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
      <div className="min-h-screen bg-[#15130f] p-6 max-w-xl mx-auto">
        <h1 className="mb-2 text-2xl font-bold text-[#e8e1d9]">مدينة المعنى</h1>
        <p className="mb-6 text-[#c9b88a] text-sm">رحلة في الوعي بلغة القرآن</p>
        <Paywall reason="book" title="الكتاب للمشتركين" message="اشترك في عيدية تمعّن بـ ٢٨ ريال وتحصل على الكتاب كاملاً + برنامج ٢٨ يوم" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#15130f] p-6">
      <h1 className="mb-4 text-2xl font-bold text-[#e8e1d9]">مدينة المعنى بلغة القرآن</h1>
      <p className="mb-6 text-[#c9b88a]">الدليل والتطبيق — اقرأ في المتصفح</p>
      <BookViewer />
    </div>
  );
}
