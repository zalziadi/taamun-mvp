import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Paywall } from "@/components/Paywall";
import { BookViewer } from "@/components/BookViewer";

export default async function BookPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F14] p-6 max-w-xl mx-auto">
        <h1 className="mb-2 text-2xl font-bold text-white">مدينة المعنى</h1>
        <p className="mb-6 text-white/50 text-sm">رحلة في الوعي بلغة القرآن</p>
        <Paywall reason="book" title="الكتاب للمشتركين" message="اشترك بـ 82 ريال وتحصل على الكتاب كاملاً + تطبيق تمعّن سنة كاملة" />
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("book_access, role")
    .eq("id", user.id)
    .maybeSingle();

  const hasAccess = profile?.book_access === true || profile?.role === "admin";

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#0B0F14] p-6 max-w-xl mx-auto">
        <h1 className="mb-2 text-2xl font-bold text-white">مدينة المعنى</h1>
        <p className="mb-6 text-white/50 text-sm">رحلة في الوعي بلغة القرآن</p>
        <Paywall reason="book" title="الكتاب للمشتركين" message="اشترك بـ 82 ريال وتحصل على الكتاب كاملاً + تطبيق تمعّن سنة كاملة" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] p-6">
      <h1 className="mb-4 text-2xl font-bold text-white">مدينة المعنى بلغة القرآن</h1>
      <p className="mb-6 text-white/70">الدليل والتطبيق — اقرأ في المتصفح</p>
      <BookViewer />
    </div>
  );
}
