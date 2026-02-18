"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Summary = {
  totalUsersDistinct: number;
  totalEntries: number;
  completedEntries: number;
  completionRateOverall: number;
  bestDay: { day: number; count: number };
  worstDay: { day: number; count: number };
};

type HeatmapCell = { day: number; completedCount: number };

type UserRow = {
  user_id: string;
  completedDaysCount: number;
  completionRate: number;
  lastCompletedDay: number;
};

export default function AdminRamadanPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, heatmapRes, usersRes] = await Promise.all([
          fetch("/api/admin/ramadan/summary", { cache: "no-store" }),
          fetch("/api/admin/ramadan/heatmap", { cache: "no-store" }),
          fetch("/api/admin/ramadan/users", { cache: "no-store" }),
        ]);

        if (summaryRes.status === 401 || summaryRes.status === 403) {
          setError("غير مسموح بالوصول لهذه الصفحة.");
          return;
        }

        const summaryData = await summaryRes.json();
        const heatmapData = await heatmapRes.json();
        const usersData = await usersRes.json();

        if (!summaryRes.ok || !heatmapRes.ok || !usersRes.ok) {
          setError("تعذر تحميل لوحة رمضان.");
          return;
        }

        setSummary({
          totalUsersDistinct: summaryData.totalUsersDistinct ?? 0,
          totalEntries: summaryData.totalEntries ?? 0,
          completedEntries: summaryData.completedEntries ?? 0,
          completionRateOverall: summaryData.completionRateOverall ?? 0,
          bestDay: summaryData.bestDay ?? { day: 1, count: 0 },
          worstDay: summaryData.worstDay ?? { day: 1, count: 0 },
        });
        setHeatmap(heatmapData.days ?? []);
        setUsers(usersData.users ?? []);
      } catch {
        setError("تعذر الاتصال بالخادم.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const maxCount = useMemo(
    () => heatmap.reduce((max, cell) => Math.max(max, cell.completedCount), 0),
    [heatmap]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F14] p-6 text-white">
        <p>جاري تحميل لوحة رمضان...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] p-6 text-white">
      <nav className="mb-8 flex gap-4">
        <Link href="/" className="text-white/70 hover:text-white">
          الرئيسية
        </Link>
        <Link href="/admin" className="text-white/70 hover:text-white">
          الأدمن
        </Link>
      </nav>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">لوحة رمضان</h1>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/admin/ramadan/export"
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            تصدير CSV (الكل)
          </a>
          <a
            href="/api/admin/ramadan/export?status=completed"
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            تصدير CSV (مكتمل)
          </a>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-300">
          {error}
        </div>
      ) : (
        <>
          <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="المستخدمون" value={summary?.totalUsersDistinct ?? 0} />
            <StatCard label="إجمالي الإدخالات" value={summary?.totalEntries ?? 0} />
            <StatCard label="الإدخالات المكتملة" value={summary?.completedEntries ?? 0} />
            <StatCard
              label="معدل الإكمال العام"
              value={`${summary?.completionRateOverall ?? 0}%`}
            />
            <StatCard
              label="أفضل يوم"
              value={`اليوم ${summary?.bestDay?.day ?? 1} (${summary?.bestDay?.count ?? 0})`}
            />
            <StatCard
              label="أضعف يوم"
              value={`اليوم ${summary?.worstDay?.day ?? 1} (${summary?.worstDay?.count ?? 0})`}
            />
          </section>

          <section className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-4 text-lg font-semibold">Heatmap الأيام (1..28)</h2>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {heatmap.map((cell) => {
                const intensity =
                  maxCount > 0 ? Math.max(0.15, cell.completedCount / maxCount) : 0.1;
                return (
                  <div
                    key={cell.day}
                    className="rounded-lg border border-white/10 p-2 text-center text-xs"
                    style={{ backgroundColor: `rgba(109,139,255,${intensity})` }}
                  >
                    <div className="text-white/80">Day {cell.day}</div>
                    <div className="mt-1 text-sm font-semibold">{cell.completedCount}</div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-4 text-lg font-semibold">المستخدمون (ترتيب حسب معدل الإكمال)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/70">
                    <th className="px-2 py-2 text-start">User ID</th>
                    <th className="px-2 py-2 text-start">Completed Days</th>
                    <th className="px-2 py-2 text-start">Completion Rate</th>
                    <th className="px-2 py-2 text-start">Last Completed Day</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.user_id} className="border-b border-white/5">
                      <td className="px-2 py-2 font-mono text-xs">{user.user_id}</td>
                      <td className="px-2 py-2">{user.completedDaysCount}</td>
                      <td className="px-2 py-2">{user.completionRate}%</td>
                      <td className="px-2 py-2">{user.lastCompletedDay || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/5 p-4">
      <div className="text-sm text-white/70">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
