import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Paywall } from "@/components/Paywall";
import { TasbeehExperience } from "@/components/TasbeehExperience";

export const metadata = {
  title: "مسبحة تمعّن — أسماء الله الحسنى",
  description: "مسبحة إلكترونية بأسماء الله الحسنى الـ ٩٩ — تجربة تسبيح تأملية من تمعّن",
};

export default async function TasbeehPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#07070c] p-6 max-w-xl mx-auto">
        <h1 className="mb-2 text-2xl font-bold text-[#e8e1d9]">مسبحة تمعّن</h1>
        <p className="mb-6 text-[#c9b88a] text-sm">أسماء الله الحسنى — تسبيح تأملي</p>
        <Paywall
          reason="tasbeeh"
          title="المسبحة للمشتركين"
          message="اشترك بـ 28 ريال للمسبحة، أو بـ 82 ريال للباقة السنوية الشاملة"
        />
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tasbeeh_access, book_access, role, subscription_tier, subscription_status, expires_at")
    .eq("id", user.id)
    .maybeSingle();

  const hasAccess =
    profile?.tasbeeh_access === true ||
    profile?.role === "admin" ||
    (profile?.subscription_tier === "yearly" &&
     profile?.subscription_status === "active" &&
     profile?.expires_at &&
     new Date(profile.expires_at) > new Date());

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#07070c] p-6 max-w-xl mx-auto">
        <h1 className="mb-2 text-2xl font-bold text-[#e8e1d9]">مسبحة تمعّن</h1>
        <p className="mb-6 text-[#c9b88a] text-sm">أسماء الله الحسنى — تسبيح تأملي</p>
        <Paywall
          reason="tasbeeh"
          title="المسبحة للمشتركين"
          message="اشترك بـ 28 ريال للمسبحة، أو بـ 82 ريال للباقة السنوية الشاملة"
        />
      </div>
    );
  }

  return <TasbeehExperience />;
}
