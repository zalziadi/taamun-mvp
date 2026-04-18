import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type Params = {
  params: Promise<{ code: string }>;
};

export const metadata = {
  title: "دعوة للانضمام",
  description: "دعاك أحد أصدقائك لتجربة تمعّن.",
};

/**
 * /invite/[code] — public landing for invited users.
 * Sets the invite code in a cookie (or localStorage via client helper later),
 * then either:
 *   - Shows landing with CTA → /auth (if not logged in)
 *   - Redeems immediately + redirects to /welcome (if logged in)
 */
export default async function InvitePage({ params }: Params) {
  const { code } = await params;
  const normalizedCode = code.trim().toLowerCase().slice(0, 16);

  const supabase = await createSupabaseServerClient();

  // Verify code exists (anon can read from the public policy)
  const { data: codeRow } = await supabase
    .from("invite_codes")
    .select("code, uses")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (!codeRow) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#fcfaf7", color: "#2f2619" }}>
        <div className="max-w-sm text-center space-y-4">
          <h1 className="font-[var(--font-amiri)] text-2xl text-[#5a4a35]">دعوة غير صالحة</h1>
          <p className="text-sm text-[#8a7a65]">
            الرابط الذي وصلك ربما انتهى أو أُعيد كتابته بطريقة خاطئة.
          </p>
          <Link href="/" className="inline-block border border-[#5a4a35] px-6 py-3 text-sm font-bold text-[#5a4a35]">
            ادخل للصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  // Check if user is already logged in — if so, try to redeem + redirect
  const { data: auth } = await supabase.auth.getUser();

  if (auth?.user) {
    // Redeem (best-effort — the API handles validation + idempotency)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_ORIGIN ?? ""}/api/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: "" },
        body: JSON.stringify({ code: normalizedCode }),
      });
    } catch {
      // Silent — user can still proceed
    }
    redirect("/welcome");
  }

  // Not logged in → show landing with CTA to signup
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ background: "#fcfaf7", color: "#2f2619", direction: "rtl" }}
    >
      <div className="w-full max-w-md text-center space-y-8">
        <div>
          <p className="text-xs tracking-[0.2em]" style={{ color: "#8a7a65" }}>
            دعوة
          </p>
          <h1 className="mt-3 font-[var(--font-amiri)] text-3xl sm:text-4xl" style={{ color: "#5a4a35" }}>
            صديق دعاك إلى تمعّن
          </h1>
        </div>

        <div className="mx-auto max-w-sm px-4 py-7" style={{ borderTop: "1px solid #c9b88a55", borderBottom: "1px solid #c9b88a55" }}>
          <p className="text-base leading-loose text-[#2f2619]">
            رحلة تأمل قرآنية ٢٨ يوماً — من القراءة إلى التجربة.
          </p>
          <p className="mt-4 text-xs leading-relaxed" style={{ color: "#8a7a65" }}>
            حين تشترك، يحصل صديقك على شهر مجاني، وأنت أيضاً.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href={`/auth?invite=${encodeURIComponent(normalizedCode)}`}
            className="inline-block px-12 py-3.5 text-base font-bold border"
            style={{ background: "#5a4a35", color: "#fcfaf7", borderColor: "#5a4a35" }}
          >
            ابدأ الرحلة
          </Link>
          <p className="text-xs" style={{ color: "#8a7a65" }}>
            ٧ أيام مجانية — بدون بطاقة دفع
          </p>
        </div>
      </div>
    </div>
  );
}
