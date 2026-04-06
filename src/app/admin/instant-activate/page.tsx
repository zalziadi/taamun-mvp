"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  subscription_status: string | null;
  subscription_tier: string | null;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const TIER_OPTIONS = [
  { value: "vip", label: "VIP" },
  { value: "yearly", label: "سنوي" },
  { value: "monthly", label: "شهري" },
  { value: "eid", label: "عيدية" },
];

export default function InstantActivatePage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState("vip");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [filter, setFilter] = useState<"inactive" | "active" | "all">("inactive");
  const [search, setSearch] = useState("");

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/instant-activate", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) setUsers(data.users ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchUsers();
  }, []);

  async function handleActivate(userId: string, name: string) {
    setActivatingId(userId);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/instant-activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, tier: selectedTier }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsg({ ok: true, text: `تم تفعيل ${name || "المستخدم"} — ${selectedTier.toUpperCase()}` });
        void fetchUsers();
      } else {
        setMsg({ ok: false, text: data.error || "فشل التفعيل" });
      }
    } catch {
      setMsg({ ok: false, text: "تعذر الاتصال بالخادم" });
    } finally {
      setActivatingId(null);
      setTimeout(() => setMsg(null), 4000);
    }
  }

  async function handleActivateAll() {
    const inactive = filteredUsers.filter((u) => u.subscription_status !== "active");
    if (inactive.length === 0) return;
    if (!confirm(`تفعيل ${inactive.length} مستخدم دفعة واحدة؟`)) return;

    setMsg({ ok: true, text: `جاري تفعيل ${inactive.length} مستخدم...` });
    let success = 0;
    for (const u of inactive) {
      try {
        const res = await fetch("/api/admin/instant-activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: u.id, tier: selectedTier }),
        });
        const data = await res.json();
        if (data.ok) success++;
      } catch {
        /* continue */
      }
    }
    setMsg({ ok: true, text: `تم تفعيل ${success} من ${inactive.length} مستخدم` });
    void fetchUsers();
    setTimeout(() => setMsg(null), 5000);
  }

  const filteredUsers = users.filter((u) => {
    if (filter === "inactive" && u.subscription_status === "active") return false;
    if (filter === "active" && u.subscription_status !== "active") return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.full_name && u.full_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const inactiveCount = users.filter((u) => u.subscription_status !== "active").length;
  const activeCount = users.filter((u) => u.subscription_status === "active").length;

  return (
    <div dir="rtl" className="min-h-screen bg-[#15130f] px-4 pb-16 pt-6 text-[#e8e1d9]">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-xs text-[#c9b88a] hover:underline">
              ← لوحة الأدمن
            </Link>
            <h1 className="mt-2 font-[var(--font-amiri)] text-3xl text-[#e6d4a4]">
              التفعيل الفوري
            </h1>
            <p className="mt-1 text-sm text-white/40">اضغط زر التفعيل وتتفعّل العضوية مباشرة</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-white/40">المسجلين</p>
            <p className="text-2xl font-bold text-[#c9b88a]">{users.length}</p>
            <p className="text-[10px] text-white/30">
              {activeCount} مفعّل · {inactiveCount} غير مفعّل
            </p>
          </div>
        </div>

        {/* Controls */}
        <section className="rounded-3xl border border-[#c9b88a]/25 bg-[#2b2824] p-5">
          <div className="flex flex-wrap items-end gap-4">
            {/* Tier selector */}
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-white/50">الباقة</label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#1c1a15] px-4 py-3 text-sm text-[#e8e1d9] focus:border-[#c9b88a]/50 focus:outline-none"
              >
                {TIER_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex-[2] min-w-[200px]">
              <label className="text-xs text-white/50">بحث</label>
              <input
                type="text"
                placeholder="اسم أو إيميل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#1c1a15] px-4 py-3 text-sm text-[#e8e1d9] placeholder:text-white/25 focus:border-[#c9b88a]/50 focus:outline-none"
              />
            </div>

            {/* Filter */}
            <div className="min-w-[120px]">
              <label className="text-xs text-white/50">عرض</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as "inactive" | "active" | "all")}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#1c1a15] px-4 py-3 text-sm text-[#e8e1d9] focus:border-[#c9b88a]/50 focus:outline-none"
              >
                <option value="inactive">غير مفعّلين ({inactiveCount})</option>
                <option value="active">مفعّلين ({activeCount})</option>
                <option value="all">الكل ({users.length})</option>
              </select>
            </div>

            {/* Bulk activate */}
            {filter !== "active" && inactiveCount > 0 && (
              <button
                type="button"
                onClick={() => void handleActivateAll()}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                فعّل الكل ({filteredUsers.filter((u) => u.subscription_status !== "active").length})
              </button>
            )}
          </div>

          {msg && (
            <p className={`mt-3 text-sm ${msg.ok ? "text-emerald-400" : "text-amber-400"}`}>
              {msg.text}
            </p>
          )}
        </section>

        {/* Users List */}
        <section className="rounded-3xl border border-white/10 bg-[#2b2824] p-5">
          {loading ? (
            <p className="py-8 text-center text-sm text-white/40">جاري التحميل...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">لا يوجد مستخدمين</p>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((u) => {
                const isActive = u.subscription_status === "active";
                return (
                  <div
                    key={u.id}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 transition-colors ${
                      isActive
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-white/10 bg-[#1c1a15]"
                    }`}
                  >
                    {/* User info */}
                    <div className="flex-1 min-w-[200px] space-y-1">
                      <p className="text-sm font-semibold text-[#e8e1d9]">
                        {u.full_name || "(بدون اسم)"}
                        {u.role === "admin" && (
                          <span className="mr-2 rounded bg-[#c9b88a]/20 px-2 py-0.5 text-[10px] text-[#c9b88a]">
                            أدمن
                          </span>
                        )}
                      </p>
                      <p dir="ltr" className="text-xs text-white/50">
                        {u.email || "—"}
                      </p>
                      <p className="text-[10px] text-white/30">
                        سجّل: {new Date(u.created_at).toLocaleDateString("ar-SA")}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="text-center min-w-[80px]">
                      {isActive ? (
                        <div>
                          <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400">
                            {u.subscription_tier?.toUpperCase() || "مفعّل"}
                          </span>
                          {u.expires_at && (
                            <p className="mt-1 text-[10px] text-white/30">
                              حتى {new Date(u.expires_at).toLocaleDateString("ar-SA")}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-block rounded-full bg-white/5 px-3 py-1 text-xs text-white/30">
                          غير مفعّل
                        </span>
                      )}
                    </div>

                    {/* Action */}
                    <div className="min-w-[100px] text-left">
                      {isActive ? (
                        <span className="text-xs text-emerald-400/60">مفعّل</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleActivate(u.id, u.full_name || u.email || "")}
                          disabled={activatingId === u.id}
                          className="rounded-xl bg-[#c9b88a] px-5 py-2.5 text-sm font-bold text-[#15130f] transition-all hover:opacity-90 disabled:opacity-40"
                        >
                          {activatingId === u.id ? "..." : "فعّل"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
