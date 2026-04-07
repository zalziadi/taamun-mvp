"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { JourneyLanding } from "./JourneyLanding";

type UserLite = {
  id: string;
  email?: string | null;
} | null;

type ProfileLite = {
  subscription_status?: string | null;
  expires_at?: string | null;
  activated_at?: string | null;
};

function isActiveSubscription(profile: ProfileLite) {
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
  const [activationMarker, setActivationMarker] = useState<string | null>(null);
  const [guidanceMessage, setGuidanceMessage] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [streak, setStreak] = useState(0);
  const [ritualEntry, setRitualEntry] = useState<{ message: string; breathCue?: boolean } | null>(null);

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
          .select("subscription_status, expires_at, activated_at")
          .eq("id", data.user.id)
          .maybeSingle();

        if (!active) return;

        const activeSub = isActiveSubscription(profile ?? {});
        setSubscribed(activeSub);

        const marker = profile?.activated_at ?? null;
        setActivationMarker(marker);

        // Fetch cognitive guidance for logged-in users
        if (activeSub) {
          try {
            const [progressRes, dayRes] = await Promise.all([
              fetch("/api/program/progress", { cache: "no-store" }),
              null, // will fetch day after getting currentDay
            ]);
            const progressData = await progressRes.json();
            if (progressData.ok) {
              const cd = progressData.current_day ?? 1;
              setCurrentDay(cd);
              setStreak(progressData.streak ?? 0);
              // Now fetch the day with guidance + ritual
              const dRes = await fetch(`/api/program/day/${cd}`, { cache: "no-store" });
              const dData = await dRes.json();
              if (dData.guidance?.message) {
                setGuidanceMessage(dData.guidance.message);
              }
              if (dData.ritual?.entry) {
                setRitualEntry(dData.ritual.entry);
              }
            }
          } catch {
            // Guidance is optional — don't block homepage
          }
        }

        const seenMarker = String(data.user.user_metadata?.eid_popup_seen_activation_at ?? "");

        // Account-level popup rule:
        // Show only once per subscription activation (works across devices/browsers).
        if (activeSub && marker && seenMarker !== marker) {
          setShowEidPopup(true);
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

  async function dismissEidPopup() {
    setShowEidPopup(false);
    if (!user || !activationMarker) return;

    try {
      await supabase.auth.updateUser({
        data: { eid_popup_seen_activation_at: activationMarker },
      });
    } catch {
      // Ignore: popup is already hidden in UI.
    }
  }

  if (!ready) return null;

  if (!user) {
    return <JourneyLanding />;
  }

  return (
    <div className="tm-shell space-y-6 pb-10 pt-4">
      {showEidPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#c9b88a]/30 bg-[#1d1b17] p-6 text-center shadow-2xl">
            <p className="text-xs tracking-[0.2em] text-[#c9b88a]">عيدية تمعّن</p>
            <h2 className="mt-2 font-[var(--font-amiri)] text-3xl text-[#e8e1d9]">مرحبًا بك</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              هذه نافذة تعريف سريعة بالعروض والمزايا. ستظهر لك مرة واحدة فقط بعد أول تفعيل للاشتراك.
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
                onClick={() => void dismissEidPopup()}
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
          {ritualEntry ? "لحظة البداية" : "تذكير اليوم"}
        </div>

        {ritualEntry ? (
          <>
            <p className="mx-auto mt-4 max-w-[760px] text-lg leading-relaxed text-[#2f2619] font-semibold">
              {ritualEntry.message}
            </p>
            {ritualEntry.breathCue && (
              <div className="mt-4 flex justify-center">
                <div className="h-12 w-12 rounded-full bg-[#cdb98f]/20 animate-pulse" />
              </div>
            )}
          </>
        ) : (
          <>
            <h1 className="tm-heading mt-3 text-4xl leading-tight sm:text-5xl">أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ</h1>
            <p className="tm-mono mt-3 text-xs text-[#8c7851]">الرعد · ٢٨</p>
          </>
        )}

        {guidanceMessage ? (
          <p className="mx-auto mt-4 max-w-[760px] text-sm leading-relaxed text-[#5f5648]/85">
            {guidanceMessage}
          </p>
        ) : (
          <p className="mx-auto mt-4 max-w-[760px] text-sm leading-relaxed text-[#5f5648]/85">
            الصفحة ثابتة هنا لك كلما رجعت للرئيسية: آية اليوم، وتمرين التمعّن، ثم الانتقال السريع للخطوة التالية.
          </p>
        )}

        {streak > 0 && (
          <p className="mt-2 text-xs text-[#8c7851]">{streak} يوم متتالي</p>
        )}
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
          <Link href="/decision" className="rounded-xl border border-[#c4a265] bg-[#f4ead7] px-5 py-2.5 text-sm font-semibold text-[#5a4531]">
            وضع القرار
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
