"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getWeeklyChallenge, getDayInWeek, type WeeklyChallenge } from "@/lib/weekly-challenges";
import { CommunityJoin } from "@/components/CommunityJoin";

export default function ChallengePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<WeeklyChallenge | null>(null);
  const [dayInWeek, setDayInWeek] = useState(1);
  const [weekNum, setWeekNum] = useState(0);
  const [notCompleted, setNotCompleted] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth?next=/challenge");
        return;
      }

      // Check if user completed all 28 days
      try {
        const res = await fetch("/api/program/progress", { cache: "no-store" });
        const data = await res.json();
        if (!data.ok || !data.completed_days || data.completed_days.length < 28) {
          setNotCompleted(true);
          setLoading(false);
          return;
        }

        // Get completion date from awareness_logs day 28
        const { data: lastLog } = await supabase
          .from("awareness_logs")
          .select("created_at")
          .eq("user_id", user.id)
          .eq("day", 28)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!lastLog?.created_at) {
          // Fallback: treat as just completed
          setChallenge(getWeeklyChallenge(1));
          setWeekNum(1);
        } else {
          const completionDate = new Date(lastLog.created_at);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
          const weeks = Math.max(1, Math.ceil(diffDays / 7));
          setWeekNum(weeks);
          setChallenge(getWeeklyChallenge(weeks));
        }

        setDayInWeek(getDayInWeek());
      } catch {
        setNotCompleted(true);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9b88a] border-t-transparent" />
      </div>
    );
  }

  if (notCompleted) {
    return (
      <div className="tm-shell space-y-6 text-center py-16">
        <h1 className="tm-heading text-2xl sm:text-3xl">التحديات الأسبوعية</h1>
        <p className="text-sm text-[#A8A29A]/85">أكمل الـ ٢٨ يوم أولاً — ثم تنتظرك تحديات جديدة كل أسبوع.</p>
        <Link href="/program" className="tm-gold-btn inline-block rounded-xl px-6 py-3 text-sm">
          تابع البرنامج
        </Link>
      </div>
    );
  }

  if (!challenge) return null;

  const todayPrompt = challenge.dailyPrompts[dayInWeek - 1] ?? challenge.dailyPrompts[0];

  return (
    <div className="tm-shell space-y-6">
      {/* Header */}
      <section className="tm-card p-6 sm:p-7 text-center space-y-3">
        <div className="inline-flex items-center rounded-full border border-[#c4a265]/30 bg-[#c4a265]/10 px-3 py-1 text-xs font-semibold text-[#D6D1C8]">
          الأسبوع {weekNum} بعد الإتمام
        </div>
        <h1 className="tm-heading text-2xl sm:text-3xl leading-tight">{challenge.title}</h1>
        <p className="text-sm text-[#A8A29A]/85">{challenge.theme}</p>
      </section>

      {/* Verse */}
      <section className="tm-card p-6 sm:p-7 text-center space-y-3">
        <p className="font-[var(--font-amiri)] text-xl sm:text-2xl leading-loose text-[#14110F]">
          {challenge.verse}
        </p>
        <p className="text-xs text-[#C9A84C]">{challenge.verseRef}</p>
      </section>

      {/* Description */}
      <section className="tm-card p-6 sm:p-7">
        <p className="text-sm leading-relaxed text-[#A8A29A]/85">{challenge.description}</p>
      </section>

      {/* Today's Prompt */}
      <section className="tm-card border-[#c4a265]/30 bg-gradient-to-b from-[#faf6ee] to-[#fcfaf7] p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#5a4a35]">تأمل اليوم</h2>
          <span className="text-xs text-[#C9A84C]">اليوم {dayInWeek} من ٧</span>
        </div>
        <p className="text-base leading-relaxed text-[#14110F]">{todayPrompt}</p>
      </section>

      {/* Week Progress */}
      <section className="tm-card p-6 sm:p-7 space-y-4">
        <h2 className="text-sm font-bold text-[#5a4a35]">أيام الأسبوع</h2>
        <div className="grid grid-cols-7 gap-2">
          {challenge.dailyPrompts.map((prompt, i) => {
            const isToday = i + 1 === dayInWeek;
            const isPast = i + 1 < dayInWeek;
            return (
              <div
                key={i}
                className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-3 text-center ${
                  isToday
                    ? "border-[#c4a265]/40 bg-[#c4a265]/15"
                    : isPast
                      ? "border-[#d8cdb9] bg-[#f9f3e7]"
                      : "border-[#2A2621] bg-[#fcfaf7]"
                }`}
              >
                <span className={`text-lg ${isPast ? "text-[#C9A84C]" : isToday ? "text-[#5a4a35]" : "text-[#d8cdb9]"}`}>
                  {isPast ? "✓" : isToday ? "◈" : "○"}
                </span>
                <span className="text-[10px] text-[#7d7362]">{i + 1}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* End of Week Reflection */}
      {dayInWeek >= 7 && (
        <section className="tm-card border-[#c4a265]/30 bg-[#faf6ee] p-6 sm:p-7 space-y-3">
          <h2 className="text-sm font-bold text-[#5a4a35]">تأمل نهاية الأسبوع</h2>
          <p className="text-base leading-relaxed text-[#14110F]">{challenge.reflection}</p>
        </section>
      )}

      {/* Community */}
      <CommunityJoin variant="inline" />

      {/* Navigation */}
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/guide" className="tm-gold-btn rounded-xl px-5 py-2.5 text-sm">
          تحدّث مع تمعّن عن التحدي
        </Link>
        <Link href="/program" className="rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] px-5 py-2.5 text-sm text-[#A8A29A]">
          أعد يوم من الرحلة
        </Link>
      </div>
    </div>
  );
}
