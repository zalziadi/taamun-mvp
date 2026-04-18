"use client";

import { useCallback, useEffect, useState } from "react";

type NoteType = "bookmark" | "quote" | "note";

interface BookNote {
  id: string;
  type: NoteType;
  chapter: string;
  content: string;
  page_ref: string | null;
  created_at: string;
}

/**
 * Suggests a chapter based on the user's current day in the journey
 */
function getSuggestedChapter(currentDay: number): { chapter: string; reason: string } {
  if (currentDay <= 7) return { chapter: "الميلاد في الظلام", reason: "أنت في مرحلة الظل — هذا الفصل يناسبك الآن" };
  if (currentDay <= 14) return { chapter: "المرايا الداخلية", reason: "بدأت تلاحظ الأنماط — اقرأ عن المرايا" };
  if (currentDay <= 21) return { chapter: "الطمأنينة", reason: "وصلت لمرحلة العمق — الطمأنينة مفتاحك" };
  if (currentDay <= 28) return { chapter: "التحوّل", reason: "أنت في التحوّل — اقرأ كيف يكتمل" };
  return { chapter: "الغاية", reason: "أتممت الرحلة — اقرأ عن الغاية بعيون جديدة" };
}

const TYPE_LABELS: Record<NoteType, string> = {
  bookmark: "إشارة",
  quote: "اقتباس",
  note: "ملاحظة",
};

const TYPE_HINTS: Record<NoteType, string> = {
  bookmark: "احفظ موضعاً لتعود إليه",
  quote: "اقتبس جملة أثّرت فيك",
  note: "اكتب تأمّلاً على الفصل",
};

/**
 * BookTools — DB-backed reading companion.
 * Supports 3 note types: bookmark, quote, note.
 * Falls back gracefully to hidden state if the user is unauthenticated
 * or the /api/book/notes endpoint is unavailable.
 */
export function BookTools({ currentDay }: { currentDay?: number }) {
  const [notes, setNotes] = useState<BookNote[]>([]);
  const [activeType, setActiveType] = useState<NoteType>("quote");
  const [showAddForm, setShowAddForm] = useState(false);
  const [chapter, setChapter] = useState("");
  const [content, setContent] = useState("");
  const [pageRef, setPageRef] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async (type: NoteType = activeType) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/book/notes?type=${type}`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { ok?: boolean; notes?: BookNote[] };
        setNotes(data.notes ?? []);
      }
    } catch {
      // Silent: keep what we have
    } finally {
      setLoading(false);
    }
  }, [activeType]);

  useEffect(() => {
    void load(activeType);
  }, [activeType, load]);

  const suggested = getSuggestedChapter(currentDay ?? 1);

  async function handleSave() {
    if (!chapter.trim() || !content.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/book/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeType,
          chapter: chapter.trim(),
          content: content.trim(),
          pageRef: pageRef.trim() || undefined,
        }),
      });
      if (res.ok) {
        setChapter("");
        setContent("");
        setPageRef("");
        setShowAddForm(false);
        setMessage("✓ تم الحفظ");
        setTimeout(() => setMessage(null), 2000);
        await load(activeType);
      } else {
        setMessage("تعذّر الحفظ");
      }
    } catch {
      setMessage("تعذّر الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/book/notes?id=${id}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // Silent
    }
  }

  return (
    <div className="space-y-5">
      {/* Suggested chapter */}
      <div className="border-t border-[#c9b88a]/20 pt-4 space-y-1.5">
        <p className="text-[10px] uppercase tracking-widest text-[#c9b88a]/60">مقترح لك</p>
        <p className="text-sm font-semibold text-[#c9b88a]">{suggested.chapter}</p>
        <p className="text-xs text-white/40">{suggested.reason}</p>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1 text-xs">
        {(["bookmark", "quote", "note"] as NoteType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setActiveType(t);
              setShowAddForm(false);
            }}
            className={`flex-1 py-2 border-b transition-colors ${
              activeType === t
                ? "border-[#c9b88a] text-[#c9b88a]"
                : "border-white/5 text-white/40 hover:text-white/70"
            }`}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Add form */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-white/30">{TYPE_HINTS[activeType]}</p>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs text-[#c9b88a] hover:text-[#e0c29a]"
          >
            {showAddForm ? "إلغاء" : "+ أضف"}
          </button>
        </div>

        {showAddForm && (
          <div className="space-y-2 py-3">
            <input
              type="text"
              placeholder="اسم الفصل"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-white/10 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-[#c9b88a]/50"
            />
            <textarea
              placeholder={activeType === "quote" ? "الاقتباس..." : activeType === "note" ? "تأمّلك..." : "ملاحظة اختيارية"}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full bg-transparent border-0 border-b border-white/10 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-[#c9b88a]/50 resize-none"
            />
            <input
              type="text"
              placeholder="رقم الصفحة (اختياري)"
              value={pageRef}
              onChange={(e) => setPageRef(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-white/10 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-[#c9b88a]/50"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !chapter.trim() || !content.trim()}
              className="w-full border border-[#c9b88a]/30 py-2 text-xs font-semibold text-[#c9b88a] hover:bg-[#c9b88a]/10 disabled:opacity-40"
            >
              {saving ? "..." : "حفظ"}
            </button>
          </div>
        )}

        {message && <p className="text-[10px] text-white/50 italic">{message}</p>}
      </div>

      {/* Notes list */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-xs text-white/20 text-center py-2">جارٍ التحميل...</p>
        ) : notes.length === 0 ? (
          <p className="text-xs text-white/20 text-center py-3">لم تضف {TYPE_LABELS[activeType]} بعد</p>
        ) : (
          notes.map((n) => (
            <div key={n.id} className="border-t border-white/5 pt-2.5 pb-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold text-[#c9b88a]">{n.chapter}</p>
                <button
                  type="button"
                  onClick={() => handleDelete(n.id)}
                  className="text-[10px] text-white/20 hover:text-white/50 shrink-0"
                  aria-label="حذف"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs leading-relaxed text-[#e8e1d9]">
                {activeType === "quote" ? `"${n.content}"` : n.content}
              </p>
              {n.page_ref && (
                <p className="text-[10px] text-white/30">ص. {n.page_ref}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
