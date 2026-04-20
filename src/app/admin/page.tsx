"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";

interface Metrics {
  users_active: number;
  answers_total: number;
  users_completed_28: number;
  weekly_insights_total: number;
  final_insights_total: number;
}

interface Subscriber {
  id: string;
  email: string;
  tier: string;
  activated_at: string | null;
  expires_at: string | null;
  expired: boolean;
  current_day: number;
  completed_days: number;
  reflections: number;
}

interface RecentActivation {
  code: string;
  tier: string;
  used_email: string | null;
  used_at: string | null;
}

interface Report {
  total_profiles: number;
  active_subscribers: number;
  expired_subscribers: number;
  tier_breakdown: Record<string, number>;
  total_reflections: number;
  recent_activations: RecentActivation[];
  subscribers: Subscriber[];
}

const TIER_LABELS: Record<string, string> = {
  trial: "تجربة مجانية",
  eid: "عيدية (28 ر.س)",
  monthly: "شهري (82 ر.س)",
  quarterly: "ربع سنوي (220 ر.س)",
  yearly: "سنوي (820 ر.س)",
  vip: "VIP (8,200 ر.س)",
};

const TIER_COLORS: Record<string, string> = {
  trial: "text-blue-400",
  eid: "text-amber-400",
  monthly: "text-emerald-400",
  quarterly: "text-cyan-400",
  yearly: "text-purple-400",
  vip: "text-pink-400",
};

export default function AdminPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  async function loadDashboard() {
    try {
      const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
      if (!res.ok) {
        setAllowed(false);
        return false;
      }
      const data = await res.json();
      if (!data.ok) {
        setAllowed(false);
        return false;
      }
      setMetrics(data.metrics);
      setReport(data.report ?? null);
      setAllowed(true);
      return true;
    } catch {
      setAllowed(false);
      return false;
    }
  }

  async function loginWithPassword(candidate: string) {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: candidate }),
    });

    const data = await res.json().catch(() => ({ ok: false }));
    if (!res.ok || !data.ok) {
      return false;
    }

    return loadDashboard();
  }

  useEffect(() => {
    void (async () => {
      const keyFromQuery = new URLSearchParams(window.location.search).get("admin");

      if (keyFromQuery) {
        setLoginLoading(true);
        setError(null);
        const ok = await loginWithPassword(keyFromQuery);
        setLoginLoading(false);

        if (ok) {
          setPassword("");
          window.history.replaceState({}, "", "/admin");
          return;
        }
      }

      await loadDashboard();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setError(null);

    try {
      const ok = await loginWithPassword(password);
      if (!ok) {
        setError("كلمة المرور غير صحيحة");
      } else {
        setPassword("");
      }
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoginLoading(false);
    }
  }

  // Loading
  if (allowed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#15130f]">
        <p className="text-lg text-white/50">جارٍ التحقق...</p>
      </div>
    );
  }

  // Not allowed — show login form
  if (!allowed) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-[#15130f] p-6">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-bold text-white text-center">لوحة الأدمن</h1>
          <p className="text-sm text-white/50 text-center">أدخل كلمة المرور للدخول</p>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 pe-24 text-white placeholder-white/30 outline-none focus:border-white/40"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 start-2 my-1.5 rounded-lg px-3 text-xs font-medium text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {showPassword ? "إخفاء" : "إظهار"}
            </button>
          </div>
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loginLoading || !password}
            className="w-full rounded-xl bg-white/10 py-3 font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-40"
          >
            {loginLoading ? "جارٍ التحقق..." : "دخول"}
          </button>
          <div className="text-center">
            <Link href="/" className="text-sm text-white/40 hover:text-white/70">
              الرئيسية
            </Link>
          </div>
        </form>
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

  const r = report;

  return (
    <div dir="rtl" className="min-h-screen bg-[#15130f] px-4 pb-16 pt-6 text-[#e8e1d9]">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="text-xs text-[#c9b88a] hover:underline">
              ← الرئيسية
            </Link>
            <h1 className="mt-2 text-3xl font-bold text-[#e6d4a4]">لوحة تمعّن</h1>
            <p className="mt-1 text-sm text-white/40">تقرير شامل عن الموقع والعملاء</p>
          </div>
          <button
            onClick={() => void loadDashboard()}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/10"
          >
            تحديث
          </button>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCard label="مشتركون" value={r?.total_profiles ?? 0} accent />
          <MetricCard label="فعّالون" value={r?.active_subscribers ?? 0} />
          <MetricCard label="منتهيون" value={r?.expired_subscribers ?? 0} warn />
          <MetricCard label="مستخدمون نشطون" value={m.users_active} />
          <MetricCard label="تأملات" value={r?.total_reflections ?? 0} />
        </div>

        {/* Tier Breakdown */}
        {r && Object.keys(r.tier_breakdown).length > 0 && (
          <section className="rounded-2xl border border-[#c9b88a]/20 bg-[#2b2824] p-6">
            <h2 className="mb-4 text-lg font-bold text-[#e6d4a4]">توزيع الباقات</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Object.entries(r.tier_breakdown).map(([tier, count]) => (
                <div key={tier} className="rounded-xl border border-white/10 bg-[#1c1a15] p-4">
                  <div className={`text-sm ${TIER_COLORS[tier] || "text-white/60"}`}>
                    {TIER_LABELS[tier] || tier}
                  </div>
                  <div className="mt-1 text-2xl font-bold text-white">{count}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Subscribers Table */}
        {r && r.subscribers.length > 0 && (
          <section className="rounded-2xl border border-white/10 bg-[#2b2824] p-6">
            <h2 className="mb-4 text-lg font-bold text-[#e6d4a4]">
              العملاء المشتركون ({r.subscribers.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/50">
                    <th className="pb-3 pe-4 text-start font-medium">البريد</th>
                    <th className="pb-3 pe-4 text-start font-medium">الباقة</th>
                    <th className="pb-3 pe-4 text-start font-medium">اليوم الحالي</th>
                    <th className="pb-3 pe-4 text-start font-medium">أيام مكتملة</th>
                    <th className="pb-3 pe-4 text-start font-medium">تأملات</th>
                    <th className="pb-3 pe-4 text-start font-medium">الحالة</th>
                    <th className="pb-3 text-start font-medium">ينتهي</th>
                  </tr>
                </thead>
                <tbody>
                  {r.subscribers.map((s) => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 pe-4">
                        <span className="text-white/80">{s.email}</span>
                      </td>
                      <td className="py-3 pe-4">
                        <span className={`text-xs font-medium ${TIER_COLORS[s.tier] || "text-white/60"}`}>
                          {TIER_LABELS[s.tier] || s.tier}
                        </span>
                      </td>
                      <td className="py-3 pe-4 text-white/60">
                        {s.current_day > 0 ? `يوم ${s.current_day}` : "—"}
                      </td>
                      <td className="py-3 pe-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-[#c9b88a]"
                              style={{ width: `${Math.min((s.completed_days / 28) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-white/50">{s.completed_days}/28</span>
                        </div>
                      </td>
                      <td className="py-3 pe-4 text-white/60">{s.reflections}</td>
                      <td className="py-3 pe-4">
                        {s.expired ? (
                          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400">
                            منتهي
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                            فعّال
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-xs text-white/40">
                        {s.expires_at
                          ? new Date(s.expires_at).toLocaleDateString("ar-SA", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Recent Activations */}
        {r && r.recent_activations.length > 0 && (
          <section className="rounded-2xl border border-white/10 bg-[#2b2824] p-6">
            <h2 className="mb-4 text-lg font-bold text-[#e6d4a4]">آخر التفعيلات</h2>
            <div className="space-y-2">
              {r.recent_activations.map((a, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-[#1c1a15] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span dir="ltr" className="font-mono text-xs text-[#c9b88a]">
                      {a.code}
                    </span>
                    <span className={`text-xs ${TIER_COLORS[a.tier] || "text-white/50"}`}>
                      {TIER_LABELS[a.tier] || a.tier}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    <span>{a.used_email || "—"}</span>
                    <span>
                      {a.used_at
                        ? new Date(a.used_at).toLocaleDateString("ar-SA", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions + Stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/admin/moderation"
            className="rounded-2xl border border-amber-500/30 bg-[#2b2824] px-6 py-4 text-white transition-colors hover:bg-amber-500/10"
          >
            <span className="text-sm font-medium">مركز المراجعة</span>
            <p className="mt-1 text-xs text-white/40">خيوط ورحلات ورؤى في الانتظار</p>
          </Link>
          <Link
            href="/admin/activations"
            className="rounded-2xl border border-[#c9b88a]/20 bg-[#2b2824] px-6 py-4 text-white transition-colors hover:bg-[#c9b88a]/10"
          >
            <span className="text-sm font-medium">إدارة أكواد التفعيل</span>
            <p className="mt-1 text-xs text-white/40">إنشاء ونسخ أكواد جديدة</p>
          </Link>
          <Link
            href="/admin/vip-gifts"
            className="rounded-2xl border border-pink-500/20 bg-[#2b2824] px-6 py-4 text-white transition-colors hover:bg-pink-500/10"
          >
            <span className="text-sm font-medium">هدايا VIP</span>
            <p className="mt-1 text-xs text-white/40">سمرا + وردة</p>
          </Link>
          <a
            href="/api/admin/export"
            className="rounded-2xl border border-white/10 bg-[#2b2824] px-6 py-4 text-white transition-colors hover:bg-white/10"
          >
            <span className="text-sm font-medium">تصدير CSV</span>
            <p className="mt-1 text-xs text-white/40">تنزيل بيانات الإجابات</p>
          </a>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
  warn,
}: {
  label: string;
  value: number;
  accent?: boolean;
  warn?: boolean;
}) {
  const borderClass = accent
    ? "border-[#c9b88a]/30"
    : warn
      ? "border-red-500/20"
      : "border-white/10";
  const valueClass = accent
    ? "text-[#c9b88a]"
    : warn && value > 0
      ? "text-red-400"
      : "text-white";

  return (
    <div className={`rounded-2xl border ${borderClass} bg-[#2b2824] p-4`}>
      <div className="text-xs text-white/50">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}
