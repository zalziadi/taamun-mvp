"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Metrics {
  users_active: number;
  answers_total: number;
  users_completed_28: number;
  weekly_insights_total: number;
  final_insights_total: number;
}

export default function AdminPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null); // null = loading
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          setAllowed(false);
          setError(res.status === 401 ? "سجّل دخولك أولاً" : "حسابك لا يملك صلاحية الأدمن.");
          return;
        }
        const data = await res.json();
        if (!data.ok) {
          setAllowed(false);
          setError("حسابك لا يملك صلاحية الأدمن.");
          return;
        }
        setMetrics(data.metrics);
        setAllowed(true);
      })
      .catch(() => {
        setAllowed(false);
        setError("تعذر الاتصال بالخادم");
      });
  }, []);

  // Loading
  if (allowed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#15130f]">
        <p className="text-lg text-white/50">جارٍ التحقق...</p>
      </div>
    );
  }

  // Not allowed
  if (!allowed) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#15130f] p-6">
        <nav className="mb-8">
          <Link href="/" className="text-white/70 hover:text-white">الرئيسية</Link>
        </nav>
        <h1 className="mb-8 text-2xl font-bold text-white">لوحة الأدمن</h1>
        <div className="max-w-md rounded-xl border border-amber-500/40 bg-amber-500/10 p-6">
          <p className="font-medium text-amber-400">غير مسموح</p>
          <p className="mt-1 text-sm text-white/80">{error}</p>
        </div>
      </div>
    );
  }

  const m = metrics ?? {
    users_active: 0,
    answers_total: 0,
    users_completed_28: 0,
    weekly_insights_total: 0,
    final_insights_total: 0,
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#15130f] p-6">
      <nav className="mb-8">
        <Link href="/" className="text-white/70 hover:text-white">الرئيسية</Link>
      </nav>
      <h1 className="mb-8 text-2xl font-bold text-white">لوحة الأدمن</h1>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label="المستخدمون النشطون" value={m.users_active} />
        <MetricCard label="إجمالي الإجابات" value={m.answers_total} />
        <MetricCard label="أكملوا 28 يوم" value={m.users_completed_28} />
        <MetricCard label="رؤى أسبوعية" value={m.weekly_insights_total} />
        <MetricCard label="رؤى نهائية" value={m.final_insights_total} />
      </div>

      <div className="max-w-xl space-y-4">
        <Link
          href="/admin/activations"
          className="block rounded-xl border border-white/20 bg-white/5 px-6 py-4 text-white transition-colors hover:bg-white/10"
        >
          التفعيلات
        </Link>
        <Link
          href="/admin/vip-gifts"
          className="block rounded-xl border border-pink-500/20 bg-pink-500/5 px-6 py-4 text-white transition-colors hover:bg-pink-500/10"
        >
          🌸 هدايا VIP — سمرا + وردة
        </Link>
        <a
          href="/api/admin/export"
          className="block rounded-xl border border-white/20 bg-white/5 px-6 py-4 text-white transition-colors hover:bg-white/10"
        >
          تصدير CSV (الإجابات)
        </a>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/5 p-4">
      <div className="text-sm text-white/60">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
