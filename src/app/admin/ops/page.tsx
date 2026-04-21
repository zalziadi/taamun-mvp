"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Sparkline } from "@/components/Sparkline";

interface Item {
  label: string;
  value: number;
  href?: string;
  metricKey?: string;
}

interface Section {
  section: string;
  items: Item[];
}

interface EnvFlags {
  [k: string]: boolean;
}

interface Payload {
  ok: true;
  generated_at: string;
  summary: Section[];
  env: EnvFlags;
}

type Series = Record<string, Array<{ date: string; value: number }>>;

export default function OpsDashboard() {
  const [data, setData] = useState<Payload | null>(null);
  const [trends, setTrends] = useState<Series>({});
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [statsRes, trendsRes] = await Promise.all([
        fetch("/api/ops/stats", { cache: "no-store" }),
        fetch("/api/ops/trends?days=30", { cache: "no-store" }),
      ]);

      if (statsRes.status === 401 || statsRes.status === 403) {
        setError("هذه الصفحة للأدمن فقط");
        return;
      }
      const body = await statsRes.json().catch(() => ({}));
      if (statsRes.ok && body?.ok) setData(body as Payload);
      else setError("تعذّر تحميل البيانات");

      // Trends are best-effort — sparklines just hide when empty.
      if (trendsRes.ok) {
        const t = await trendsRes.json().catch(() => ({}));
        if (t?.ok && t.series) setTrends(t.series as Series);
      }
    } catch {
      setError("تعذّر الاتصال");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <main className="min-h-screen bg-[#1a1816] text-white px-6 py-12 text-center" dir="rtl">
        <h1 className="text-xl font-bold mb-2">{error}</h1>
        <Link href="/" className="text-xs text-[#c9b88a] underline">
          الرئيسية
        </Link>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#1a1816] text-white/60 px-6 py-12 text-center" dir="rtl">
        <p className="text-xs italic">تحميل...</p>
      </main>
    );
  }

  const totalFlags = data.summary
    .flatMap((s) => s.items)
    .filter((i) => /معلّم/.test(i.label))
    .reduce((n, i) => n + i.value, 0);

  return (
    <main className="min-h-screen bg-[#1a1816] text-white px-6 py-10" dir="rtl">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <Link href="/admin" className="text-xs text-white/40 hover:text-white/70">
              ← لوحة الأدمن
            </Link>
            <h1 className="text-2xl font-bold">نظرة تشغيلية</h1>
            <p className="text-xs text-white/50">
              آخر تحديث: {new Date(data.generated_at).toLocaleString("ar-SA")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/ops/alerts"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70 hover:bg-white/10"
            >
              تنبيهات
            </Link>
            <a
              href="/api/ops/export"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70 hover:bg-white/10"
            >
              تصدير CSV
            </a>
            <button
              onClick={load}
              disabled={refreshing}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70 hover:bg-white/10 disabled:opacity-40"
            >
              {refreshing ? "..." : "تحديث"}
            </button>
          </div>
        </header>

        {totalFlags === 0 ? (
          <p className="text-xs text-white/40 italic">
            لا يوجد محتوى بانتظار المراجعة حالياً.
          </p>
        ) : (
          <Link
            href="/admin/moderation"
            className="block border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-200 hover:bg-amber-500/15"
          >
            <p className="text-xs font-bold">
              {totalFlags} عنصر معلّم للمراجعة →
            </p>
          </Link>
        )}

        {data.summary.map((section) => (
          <section key={section.section} className="space-y-3">
            <h2 className="text-sm font-bold text-[#c9b88a]">
              {section.section}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {section.items.map((item) => {
                const series = item.metricKey ? trends[item.metricKey] : undefined;
                const values = series?.map((p) => p.value) ?? [];
                const body = (
                  <div className="rounded-2xl border border-white/10 bg-[#2b2824] p-4 space-y-1">
                    <p className="text-[10px] text-white/40 leading-tight">
                      {item.label}
                    </p>
                    <p className="text-xl font-bold text-white">{item.value}</p>
                    {values.length >= 2 && (
                      <Sparkline
                        values={values}
                        width={100}
                        height={24}
                        className="text-[#c9b88a]/70 mt-1"
                        aria-label={`آخر ${values.length} يوم لـ ${item.label}`}
                      />
                    )}
                  </div>
                );
                return item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="transition-opacity hover:opacity-80"
                  >
                    {body}
                  </Link>
                ) : (
                  <div key={item.label}>{body}</div>
                );
              })}
            </div>
          </section>
        ))}

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#c9b88a]">صحّة الـ env</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {Object.entries(data.env).map(([key, active]) => (
              <li
                key={key}
                className={
                  "flex items-center justify-between rounded-lg border px-3 py-2 " +
                  (active
                    ? "border-green-500/30 bg-green-500/5 text-green-300"
                    : "border-red-500/30 bg-red-500/5 text-red-300")
                }
              >
                <span className="font-mono text-[10px]">{key}</span>
                <span className="text-[10px]">{active ? "✓" : "✗"}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
