"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PerDay {
  day: number;
  completed: number;
}

interface Analytics {
  journey: {
    slug: string;
    title: string;
    duration_days: number;
    subscriber_count: number;
  };
  metrics: {
    total_subscribers: number;
    finished: number;
    completion_rate_percent: number;
    per_day: PerDay[];
  };
  recent: Array<{
    current_day: number;
    completed: number;
    started_at: string;
    last_active_at: string;
  }>;
}

export default function CreatorJourneyAnalytics() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/creator/journeys/${slug}/analytics`);
      if (res.status === 401) {
        router.push(`/auth?next=/creator/${slug}/analytics`);
        return;
      }
      if (res.status === 403) {
        setError("هذه الصفحة لمبدع الرحلة فقط");
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) {
        setData(body as Analytics);
      } else {
        setError("تعذّر تحميل البيانات");
      }
    }
    load();
  }, [slug, router]);

  if (error) {
    return (
      <main className="max-w-lg mx-auto px-5 py-12 text-center space-y-3" dir="rtl">
        <h1 className="text-xl font-bold text-[#2f2619]">{error}</h1>
        <Link href={`/creator/${slug}`} className="text-xs text-[#5a4a35] underline">
          العودة الى التحرير
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="max-w-lg mx-auto px-5 py-12 text-center" dir="rtl">
        <p className="text-xs text-[#8c7851] italic">تحميل...</p>
      </main>
    );
  }

  const maxDayCompleted = Math.max(
    1,
    ...data.metrics.per_day.map((d) => d.completed)
  );

  return (
    <main className="max-w-3xl mx-auto px-5 sm:px-6 py-10 space-y-8" dir="rtl">
      <nav className="text-xs text-[#8c7851]">
        <Link href="/creator" className="hover:text-[#5a4a35]">لوحة المبدع</Link>
        <span className="mx-2">/</span>
        <Link href={`/creator/${slug}`} className="hover:text-[#5a4a35]">{data.journey.title}</Link>
        <span className="mx-2">/</span>
        <span className="text-[#5a4a35]">تحليلات</span>
      </nav>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-[#2f2619]">تحليلات الرحلة</h1>
        <p className="text-sm text-[#5a4a35]">{data.journey.title}</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="tm-card p-5 space-y-1">
          <p className="text-xs text-[#8c7851]">مشتركون</p>
          <p className="text-2xl font-bold text-[#2f2619]">
            {data.metrics.total_subscribers}
          </p>
        </div>
        <div className="tm-card p-5 space-y-1">
          <p className="text-xs text-[#8c7851]">أكملوا الرحلة</p>
          <p className="text-2xl font-bold text-[#2f2619]">
            {data.metrics.finished}
          </p>
        </div>
        <div className="tm-card p-5 space-y-1">
          <p className="text-xs text-[#8c7851]">نسبة الإكمال</p>
          <p className="text-2xl font-bold text-[#2f2619]">
            {data.metrics.completion_rate_percent}%
          </p>
        </div>
      </section>

      <section className="tm-card p-5 sm:p-6 space-y-3">
        <h2 className="text-sm font-bold text-[#5a4a35]">
          اكتمال الأيام (كم شخص أنجز كل يوم)
        </h2>
        <ul className="space-y-2">
          {data.metrics.per_day.map((d) => {
            const widthPct = Math.round((d.completed / maxDayCompleted) * 100);
            return (
              <li key={d.day} className="flex items-center gap-3 text-xs">
                <span className="w-8 text-[#8c7851] shrink-0">{d.day}</span>
                <div className="flex-1 h-2 bg-[#c9bda8]/20 relative">
                  <div
                    className="absolute inset-y-0 right-0 bg-[#5a4a35]"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="w-10 text-left text-[#3d342a]">{d.completed}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#5a4a35]">آخر النشاط</h2>
        {data.recent.length === 0 ? (
          <p className="text-xs text-[#8c7851] italic">لا اشتراكات بعد.</p>
        ) : (
          <ul className="space-y-2">
            {data.recent.map((r, i) => (
              <li
                key={`${r.started_at}-${i}`}
                className="tm-card p-4 flex items-center justify-between gap-3 text-xs"
              >
                <span className="text-[#3d342a]">
                  يوم {r.current_day} · {r.completed} مكتمل
                </span>
                <span className="text-[#8c7851]">
                  {new Date(r.last_active_at).toLocaleDateString("ar-SA")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
