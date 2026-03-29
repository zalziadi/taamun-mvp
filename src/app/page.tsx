"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { EidiyaLanding } from "./EidiyaLanding";

type UserLite = {
  id: string;
  email?: string | null;
} | null;

function isActiveSubscription(profile: {
  subscription_status?: string | null;
  expires_at?: string | null;
}) {
  return (
    profile?.subscription_status === "active" &&
    !!profile?.expires_at &&
    new Date(profile.expires_at) > new Date()
  );
}

export default function Home() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<UserLite>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [showEidPopup, setShowEidPopup] = useState(false);

  useEffect(() => {
    let active = true;

    async function boot() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!active) return;

        if (error || !data.user) {
          setUser(null);
          setSubscribed(false);
          setReady(true);
          return;
        }

        const me = { id: data.user.id, email: data.user.email };
        setUser(me);

        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_status, expires_at")
          .eq("id", data.user.id)
          .maybeSingle();

        if (!active) return;

        const activeSub = isActiveSubscription(profile ?? {});
        setSubscribed(activeSub);

        if (activeSub) {
          const seenKey = `eid-popup-seen:${data.user.id}`;
          const seen = window.localStorage.getItem(seenKey);
          if (!seen) {
            setShowEidPopup(true);
            window.localStorage.setItem(seenKey, "1");
          }
        }
      } finally {
        if (active) setReady(true);
      }
    }

    void boot();

    return () => {
      active = false;
    };
  }, [supabase]);

  if (!ready) return null;

  if (!user) {
    return <EidiyaLanding />;
  }

  return (
    <div className="tm-shell space-y-6 pb-10 pt-4">
      {showEidPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#c9b88a]/30 bg-[#1d1b17] p-6 text-center shadow-2xl">
            <p className="text-xs tracking-[0.2em] text-[#c9b88a]">عيدية تمعّن</p>
            <h2 className="mt-2 font-[var(--font-amiri)] text-3xl text-[#e8e1d9]">مرحبًا بك</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              هذه نافذة تعريف سريعة بالعروض والمزايا. ستظهر لك مرة واحدة فقط في أول دخول.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link
                href="/eid"
                className="rounded-lg bg-[#c9b88a] px-4 py-2 text-sm font-semibold text-[#15130f]"
              >
                عرض العيدية
              </Link>
              <button
                type="button"
                onClick={() => setShowEidPopup(false)}
                className="rounded-lg border border-[#c9b88a]/30 px-4 py-2 text-sm text-[#e8e1d9]"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="tm-card p-7 text-center">
        <div className="inline-flex items-center rounded-full border border-[#b39b71]/35 bg-[#cdb98f]/15 px-3 py-1 text-xs text-[#7b694a]">
          تذكير اليوم
        </div>
        <h1 className="tm-heading mt-3 text-4xl leading-tight sm:text-5xl">أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ</h1>
        <p className="tm-mono mt-3 text-xs text-[#8c7851]">الرعد · ٢٨</p>
        <p className="mx-auto mt-4 max-w-[760px] text-sm leading-relaxed text-[#5f5648]/85">
          الصفحة ثابتة هنا لك كلما رجعت للرئيسية: آية اليوم، وتمرين التمعّن، ثم الانتقال السريع للخطوة التالية.
        </p>
      </section>

      <section className="tm-card p-6 sm:p-7 space-y-4">
        <h2 className="tm-heading text-3xl text-[#2f2619]">تمرين التمعّن</h2>
        <p className="text-sm leading-relaxed text-[#5f5648]/85">
          خذ 3 دقائق صمت، ثم اكتب سطرًا واحدًا: &quot;ما الذي يحتاج مني حضورًا أصدق اليوم؟&quot;.
          بعد ذلك افتح صفحة التأمل وسجّل إجابتك.
        </p>

        <div className="flex flex-wrap gap-2">
          <Link href="/reflection" className="tm-gold-btn rounded-xl px-5 py-2.5 text-sm">
            افتح التأمل الآن
          </Link>
          <Link href="/program" className="rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] px-5 py-2.5 text-sm text-[#5f5648]">
            متابعة البرنامج
          </Link>
          <Link href="/guide" className="rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] px-5 py-2.5 text-sm text-[#5f5648]">
            المرشد الذكي
          </Link>
        </div>
      </section>

      {!subscribed ? (
        <section className="tm-card p-5 text-center">
          <p className="text-sm text-[#7d7362]">حسابك مسجل، لكن اشتراكك غير نشط الآن.</p>
          <Link href="/pricing" className="mt-3 inline-block rounded-xl bg-[#c9b88a] px-4 py-2 text-sm font-semibold text-[#2f2619]">
            تفعيل الاشتراك
          </Link>
        </section>
      ) : null}
    </div>
  );
}
