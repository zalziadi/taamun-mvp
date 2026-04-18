"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type CommunityStats = {
  completedThisWeek: number;
  totalCompleted: number;
  activeToday: number;
};

type SharedReflection = {
  day: number;
  snippet: string;
};

export function CommunityPulse() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [reflections, setReflections] = useState<SharedReflection[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/community/stats").then((r) => r.json()),
      fetch("/api/community/reflections").then((r) => r.json()),
    ])
      .then(([statsData, refData]) => {
        if (statsData.ok) setStats(statsData);
        if (refData.ok && refData.reflections) setReflections(refData.reflections);
      })
      .catch(() => {});
  }, []);

  if (!stats && reflections.length === 0) return null;

  return (
    <div className="tm-card p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#5a4a35]">نبض المجتمع</h2>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-[#C9A84C]">حي</span>
        </span>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-[#d8cdb9] bg-[#faf6ee] p-3 text-center">
            <p className="text-lg font-bold text-[#5a4a35]">{stats.activeToday}</p>
            <p className="text-[10px] text-[#C9A84C]">نشط اليوم</p>
          </div>
          <div className="rounded-xl border border-[#d8cdb9] bg-[#faf6ee] p-3 text-center">
            <p className="text-lg font-bold text-[#5a4a35]">{stats.completedThisWeek}</p>
            <p className="text-[10px] text-[#C9A84C]">أتمّ هذا الأسبوع</p>
          </div>
          <div className="rounded-xl border border-[#d8cdb9] bg-[#faf6ee] p-3 text-center">
            <p className="text-lg font-bold text-[#5a4a35]">{stats.totalCompleted}</p>
            <p className="text-[10px] text-[#C9A84C]">أتمّوا الرحلة</p>
          </div>
        </div>
      )}

      {reflections.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-[#C9A84C]">من تأملات المتمعّنين</p>
          {reflections.map((r, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#2A2621] bg-[#fcfaf7] px-3 py-2.5"
            >
              <p className="text-sm leading-relaxed text-[#A8A29A]">&ldquo;{r.snippet}&rdquo;</p>
              <p className="mt-1 text-[10px] text-[#C9A84C]/60">— متمعّن، يوم {r.day}</p>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/challenge"
        className="block w-full rounded-xl border border-[#c4a265]/20 bg-[#c4a265]/5 py-2.5 text-center text-xs font-semibold text-[#D6D1C8] transition-colors hover:bg-[#c4a265]/10"
      >
        انضم للتحدي الأسبوعي
      </Link>
    </div>
  );
}
