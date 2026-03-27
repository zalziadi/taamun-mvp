"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ActivationCode {
  id: string;
  code: string;
  tier: string;
  used_by: string | null;
  used_at: string | null;
  used_email: string | null;
}

const TIER_LABELS: Record<string, string> = {
  eid: "عيدية (28 ر.س)",
  monthly: "شهري (82 ر.س)",
  yearly: "سنوي (820 ر.س)",
  vip: "VIP (8,200 ر.س)",
};

export default function ActivationsPage() {
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [availCount, setAvailCount] = useState(0);
  const [usedCount, setUsedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [tier, setTier] = useState("monthly");
  const [filterTierView, setFilterTierView] = useState<string>("all");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /* جلب الأكواد */
  async function fetchCodes() {
    try {
      const res = await fetch("/api/admin/activations", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setCodes(data.codes ?? []);
        setTotalCount(data.totalCount ?? 0);
        setAvailCount(data.availCount ?? 0);
        setUsedCount(data.usedCount ?? 0);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchCodes();
  }, []);

  /* إنشاء كود جديد */
  async function handleCreate() {
    setCreating(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/activations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMsg({ ok: true, text: `تم إنشاء الكود: ${data.code.code}` });
        void fetchCodes();
      } else {
        setMsg({ ok: false, text: data.error || "فشل الإنشاء" });
      }
    } catch {
      setMsg({ ok: false, text: "تعذر الاتصال بالخادم" });
    } finally {
      setCreating(false);
    }
  }

  /* نسخ الكود */
  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  /* نسخ رسالة واتساب */
  function copyWhatsAppMsg(code: string) {
    const msg = `مرحباً! هذا كود تفعيل اشتراكك في تمعّن:\n\n${code}\n\nادخل على الرابط وسجّل دخولك ثم أدخل الكود:\nhttps://taamun.com/pricing`;
    navigator.clipboard.writeText(msg);
    setMsg({ ok: true, text: "تم نسخ رسالة الواتساب" });
    setTimeout(() => setMsg(null), 2000);
  }

  const unused = codes.filter((c) => !c.used_by && (filterTierView === "all" || c.tier === filterTierView));
  const used = codes.filter((c) => c.used_by);

  return (
    <div dir="rtl" className="min-h-screen bg-[#15130f] px-4 pb-16 pt-6 text-[#e8e1d9]">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        {/* العنوان */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-xs text-[#c9b88a] hover:underline">
              ← لوحة الأدمن
            </Link>
            <h1 className="mt-2 font-[var(--font-amiri)] text-3xl text-[#e6d4a4]">إدارة أكواد التفعيل</h1>
          </div>
          <div className="text-left">
            <p className="text-xs text-white/40">إجمالي الأكواد</p>
            <p className="text-2xl font-bold text-[#c9b88a]">{totalCount}</p>
            <p className="text-[10px] text-white/30">
              {availCount} متاح · {usedCount} مستخدم
            </p>
          </div>
        </div>

        {/* إنشاء كود جديد */}
        <section className="rounded-3xl border border-[#c9b88a]/25 bg-[#2b2824] p-6">
          <h2 className="text-lg font-bold text-[#e8e1d9]">إنشاء كود جديد</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-white/50">الباقة</label>
              <select
                value={tier}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTier(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#1c1a15] px-4 py-3 text-sm text-[#e8e1d9] focus:border-[#c9b88a]/50 focus:outline-none"
              >
                <option value="eid">عيدية (28 ر.س)</option>
                <option value="monthly">شهري (82 ر.س)</option>
                <option value="yearly">سنوي (820 ر.س)</option>
                <option value="vip">VIP (8,200 ر.س)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={creating}
                className="w-full rounded-xl bg-[#c9b88a] px-6 py-3 text-sm font-bold text-[#15130f] transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {creating ? "جاري الإنشاء..." : "أنشئ كود"}
              </button>
            </div>
          </div>
          {msg && (
            <p className={`mt-3 text-sm ${msg.ok ? "text-emerald-400" : "text-amber-400"}`}>
              {msg.text}
            </p>
          )}
        </section>

        {/* الأكواد المتاحة */}
        <section className="rounded-3xl border border-white/10 bg-[#2b2824] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#e8e1d9]">
              الأكواد المتاحة <span className="text-sm font-normal text-[#c9b88a]">({availCount})</span>
            </h2>
            <select
              value={filterTierView}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterTierView(e.target.value)}
              className="rounded-lg border border-white/15 bg-[#1c1a15] px-3 py-1.5 text-xs text-[#e8e1d9]"
            >
              <option value="all">كل الباقات</option>
              <option value="eid">عيدية</option>
              <option value="monthly">شهري</option>
              <option value="yearly">سنوي</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          {loading ? (
            <p className="mt-4 text-sm text-white/40">جاري التحميل...</p>
          ) : unused.length === 0 ? (
            <p className="mt-4 text-sm text-white/40">لا توجد أكواد متاحة. أنشئ كوداً جديداً.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {unused.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#1c1a15] p-4"
                >
                  <div className="space-y-1">
                    <p dir="ltr" className="font-mono text-lg font-semibold text-[#e6d4a4]">
                      {c.code}
                    </p>
                    <div className="flex gap-3 text-[11px] text-white/40">
                      <span>{TIER_LABELS[c.tier] || c.tier}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => copyCode(c.code, c.id)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:border-[#c9b88a]/30 hover:text-[#c9b88a]"
                    >
                      {copiedId === c.id ? "✓ تم" : "نسخ الكود"}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyWhatsAppMsg(c.code)}
                      className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/20"
                    >
                      نسخ رسالة واتساب
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* الأكواد المستخدمة */}
        {used.length > 0 && (
          <section className="rounded-3xl border border-white/10 bg-[#2b2824] p-6">
            <h2 className="text-lg font-bold text-[#e8e1d9]">
              الأكواد المستخدمة <span className="text-sm font-normal text-white/40">({used.length})</span>
            </h2>
            <div className="mt-4 space-y-3">
              {used.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-[#1c1a15]/60 p-4 opacity-70"
                >
                  <div className="space-y-1">
                    <p dir="ltr" className="font-mono text-base text-white/50 line-through">
                      {c.code}
                    </p>
                    <div className="flex gap-3 text-[11px] text-white/30">
                      <span>{TIER_LABELS[c.tier] || c.tier}</span>
                    </div>
                  </div>
                  <div className="text-left text-[11px] text-white/40">
                    <p>{c.used_email}</p>
                    <p>{c.used_at ? new Date(c.used_at).toLocaleDateString("ar-SA") : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
