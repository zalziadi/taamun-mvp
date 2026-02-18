"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

const MAX_LIST = 50;

interface ActivationRecord {
  id: string;
  identifier: string;
  planKey: string;
  maxUses: number;
  createdAt: string;
  note: string;
}

interface AdminActivationsClientProps {
  apiBase: string;
}

export function AdminActivationsClient({ apiBase }: AdminActivationsClientProps) {
  const [list, setList] = useState<ActivationRecord[]>([]);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newId, setNewId] = useState("");
  const [newPlan, setNewPlan] = useState("base");
  const [newNote, setNewNote] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchActivations = useCallback(
    async (q: string) => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL(`${apiBase}/api/admin/activations`);
        if (q.trim()) url.searchParams.set("q", q.trim());

        const res = await fetch(url.toString(), {
          cache: "no-store",
        });
        if (!res.ok) {
          if (res.status === 401) {
            setError("غير مسموح");
            return;
          }
          const err = await res.json().catch(() => ({}));
          setError((err as { error?: string }).error ?? "فشل التحميل");
          return;
        }
        const data = (await res.json()) as ActivationRecord[];
        setList(data ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "فشل التحميل");
        setList([]);
      } finally {
        setLoading(false);
      }
    },
    [apiBase]
  );

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchActivations(searchDebounced);
  }, [fetchActivations, searchDebounced]);

  const handleCreate = async () => {
    const identifier = newId.trim() || `user-${Date.now()}`;
    setCreating(true);
    setError(null);
    try {
      const url = `${apiBase}/api/admin/activations`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier,
          planKey: newPlan,
          maxUses: 1,
          note: newNote.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError((err as { error?: string }).error ?? "فشل الإضافة");
        return;
      }
      setNewId("");
      setNewNote("");
      fetchActivations(searchDebounced);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الإضافة");
    } finally {
      setCreating(false);
    }
  };

  const handleExport = () => {
    const url = new URL(`${apiBase}/api/admin/activations/export`);
    window.open(url.toString(), "_blank", "noopener");
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] p-6">
      <nav className="mb-8 flex gap-4">
        <Link href="/" className="text-white/70 hover:text-white">
          الرئيسية
        </Link>
        <Link href="/admin" className="text-white/70 hover:text-white">
          الأدمن
        </Link>
      </nav>

      <h1 className="mb-6 text-2xl font-bold text-white">التفعيلات</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-amber-400">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث (رقم/بريد/كود)"
          className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder:text-white/40"
        />
        <button
          type="button"
          onClick={handleExport}
          className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white hover:bg-white/10"
        >
          تصدير CSV
        </button>
      </div>

      <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-bold text-white">إنشاء تفعيل</h2>
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            placeholder="معرّف (هاتف/بريد)"
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder:text-white/40"
          />
          <select
            value={newPlan}
            onChange={(e) => setNewPlan(e.target.value)}
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white"
          >
            <option value="base">باقة 280</option>
            <option value="plan820">باقة 820</option>
          </select>
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="ملاحظة"
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder:text-white/40"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="rounded-lg bg-white px-4 py-2 font-medium text-[#0B0F14] hover:bg-white/90 disabled:opacity-50"
          >
            {creating ? "جاري..." : "إضافة"}
          </button>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-bold text-white">آخر {MAX_LIST}</h2>
      <div className="space-y-2">
        {loading ? (
          <p className="text-white/60">جاري التحميل...</p>
        ) : list.length === 0 ? (
          <p className="text-white/60">لا توجد تفعيلات</p>
        ) : (
          list.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 p-3"
            >
              <span className="text-white/90">{r.identifier}</span>
              <span className="text-sm text-white/60">{r.planKey}</span>
              <span className="text-sm text-white/50">
                {r.createdAt?.slice?.(0, 10) ?? r.createdAt}
              </span>
              {r.note && <span className="text-sm text-white/70">{r.note}</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
