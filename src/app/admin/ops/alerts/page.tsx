"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Alert {
  id: number;
  metric: string;
  comparison: string;
  threshold: number;
  label: string | null;
  active: boolean;
  last_fired_at: string | null;
  created_at: string;
}

const METRIC_OPTIONS: Array<{ key: string; label: string }> = [
  { key: "profiles_total", label: "إجمالي البروفايلات" },
  { key: "push_subscriptions", label: "اشتراكات Push" },
  { key: "threads_total", label: "خيوط (إجمالي)" },
  { key: "threads_flagged", label: "خيوط معلّمة" },
  { key: "thread_replies_total", label: "ردود (إجمالي)" },
  { key: "thread_replies_flagged", label: "ردود معلّمة" },
  { key: "journeys_total", label: "رحلات (إجمالي)" },
  { key: "journeys_published", label: "رحلات منشورة" },
  { key: "journeys_draft", label: "رحلات مسوّدة" },
  { key: "journeys_flagged", label: "رحلات معلّمة" },
  { key: "journey_subscriptions", label: "اشتراكات رحلات" },
  { key: "creator_follows", label: "متابعات مبدعين" },
  { key: "invites_total", label: "استخدامات دعوة" },
  { key: "invites_rewarded", label: "مكافآت مطبّقة" },
  { key: "insights_total", label: "رؤى (إجمالي)" },
  { key: "insights_flagged", label: "رؤى معلّمة" },
];

const COMPARISONS: Array<{ op: string; label: string }> = [
  { op: ">", label: "أكبر من" },
  { op: ">=", label: "أكبر أو يساوي" },
  { op: "==", label: "يساوي" },
  { op: "<=", label: "أقل أو يساوي" },
  { op: "<", label: "أقل من" },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [metric, setMetric] = useState("threads_total");
  const [comparison, setComparison] = useState(">");
  const [threshold, setThreshold] = useState<string>("10");
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ops/alerts", { cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        setError("هذه الصفحة للأدمن فقط");
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (res.ok && body?.ok) setAlerts(body.alerts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (creating) return;
    const thr = Number(threshold);
    if (!Number.isFinite(thr)) return;
    setCreating(true);
    try {
      const res = await fetch("/api/ops/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metric,
          comparison,
          threshold: thr,
          label: label.trim() || null,
        }),
      });
      if (res.ok) {
        setLabel("");
        setThreshold("10");
        await load();
      }
    } finally {
      setCreating(false);
    }
  }

  async function toggle(id: number, active: boolean) {
    await fetch("/api/ops/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    });
    await load();
  }

  async function remove(id: number) {
    if (!confirm("حذف هذا التنبيه نهائياً؟")) return;
    await fetch(`/api/ops/alerts?id=${id}`, { method: "DELETE" });
    await load();
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#1a1816] text-white px-6 py-12 text-center" dir="rtl">
        <h1 className="text-xl font-bold mb-2">{error}</h1>
        <Link href="/admin/ops" className="text-xs text-[#c9b88a] underline">
          عُد
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#1a1816] text-white px-6 py-10" dir="rtl">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-1">
          <Link href="/admin/ops" className="text-xs text-white/40 hover:text-white/70">
            ← نظرة تشغيلية
          </Link>
          <h1 className="text-2xl font-bold">تنبيهات</h1>
          <p className="text-xs text-white/50">
            قواعد ترسل إيميل لـ ADMIN_EMAIL يومياً بعد الـ snapshot عند تجاوز العتبة.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-[#2b2824] p-6 space-y-3">
          <h2 className="text-sm font-bold text-[#c9b88a]">أضف تنبيه</h2>
          <form onSubmit={handleCreate} className="space-y-3 text-sm">
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="w-full bg-transparent border border-white/15 rounded-lg px-3 py-2 text-white"
            >
              {METRIC_OPTIONS.map((o) => (
                <option key={o.key} value={o.key} className="bg-[#2b2824]">
                  {o.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <select
                value={comparison}
                onChange={(e) => setComparison(e.target.value)}
                className="bg-transparent border border-white/15 rounded-lg px-3 py-2 text-white flex-1"
              >
                {COMPARISONS.map((c) => (
                  <option key={c.op} value={c.op} className="bg-[#2b2824]">
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="bg-transparent border border-white/15 rounded-lg px-3 py-2 text-white w-32"
                placeholder="العتبة"
              />
            </div>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="اسم اختياري للتنبيه"
              className="w-full bg-transparent border border-white/15 rounded-lg px-3 py-2 text-white"
              maxLength={120}
            />
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl border border-[#c9b88a]/40 bg-[#c9b88a]/10 px-5 py-2 text-xs font-bold text-[#c9b88a] hover:bg-[#c9b88a]/20 disabled:opacity-40"
            >
              {creating ? "..." : "أضف"}
            </button>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#c9b88a]">التنبيهات الحالية</h2>
          {loading ? (
            <p className="text-xs text-white/40 italic">تحميل...</p>
          ) : alerts.length === 0 ? (
            <p className="text-xs text-white/40 italic">لا توجد تنبيهات بعد.</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li
                  key={a.id}
                  className={
                    "rounded-2xl border p-4 text-xs flex items-center gap-3 " +
                    (a.active
                      ? "border-white/10 bg-[#2b2824] text-white/80"
                      : "border-white/5 bg-white/[0.02] text-white/40")
                  }
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white">
                      {a.label || a.metric}
                    </p>
                    <p className="text-[10px] text-white/50 mt-0.5">
                      {a.metric} {a.comparison} {a.threshold}
                      {a.last_fired_at && (
                        <>
                          {" · "}آخر تنبيه:{" "}
                          {new Date(a.last_fired_at).toLocaleDateString("ar-SA")}
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => toggle(a.id, a.active)}
                    className={
                      "text-[10px] px-2 py-1 border rounded " +
                      (a.active
                        ? "border-green-500/30 text-green-300"
                        : "border-white/20 text-white/40")
                    }
                  >
                    {a.active ? "نشط" : "متوقّف"}
                  </button>
                  <button
                    onClick={() => remove(a.id)}
                    className="text-[10px] text-red-300/70 hover:text-red-300"
                  >
                    حذف
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
