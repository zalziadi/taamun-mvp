"use client";

import { useState, useEffect } from "react";

const BOOKMARKS_KEY = "taamun.book.bookmarks";

interface Bookmark {
  chapter: string;
  note: string;
  createdAt: string;
}

function loadBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? "[]");
  } catch { return []; }
}

function saveBookmarks(bookmarks: Bookmark[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
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

export function BookTools({ currentDay }: { currentDay?: number }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChapter, setNewChapter] = useState("");
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    setBookmarks(loadBookmarks());
  }, []);

  const suggested = getSuggestedChapter(currentDay ?? 1);

  function addBookmark() {
    if (!newChapter.trim()) return;
    const updated = [...bookmarks, { chapter: newChapter.trim(), note: newNote.trim(), createdAt: new Date().toISOString() }];
    setBookmarks(updated);
    saveBookmarks(updated);
    setNewChapter("");
    setNewNote("");
    setShowAddForm(false);
  }

  function removeBookmark(index: number) {
    const updated = bookmarks.filter((_, i) => i !== index);
    setBookmarks(updated);
    saveBookmarks(updated);
  }

  return (
    <div className="space-y-5">
      {/* Suggested chapter */}
      <div className="rounded-xl border border-[#c9b88a]/20 bg-[#c9b88a]/5 p-4 space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-[#c9b88a]/60">مقترح لك</p>
        <p className="text-sm font-semibold text-[#c9b88a]">{suggested.chapter}</p>
        <p className="text-xs text-white/40">{suggested.reason}</p>
      </div>

      {/* Bookmarks */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#c9b88a]/60">إشاراتك المرجعية</p>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs text-[#c9b88a] hover:text-[#e0c29a]"
          >
            {showAddForm ? "إلغاء" : "+ أضف"}
          </button>
        </div>

        {showAddForm && (
          <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <input
              type="text"
              placeholder="اسم الفصل أو رقم الصفحة"
              value={newChapter}
              onChange={(e) => setNewChapter(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/25 focus:border-[#c9b88a]/30 focus:outline-none"
            />
            <input
              type="text"
              placeholder="ملاحظة (اختياري)"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/25 focus:border-[#c9b88a]/30 focus:outline-none"
            />
            <button
              type="button"
              onClick={addBookmark}
              className="w-full rounded-lg bg-[#c9b88a]/15 py-2 text-xs font-semibold text-[#c9b88a] hover:bg-[#c9b88a]/25"
            >
              حفظ الإشارة
            </button>
          </div>
        )}

        {bookmarks.length === 0 && !showAddForm && (
          <p className="text-xs text-white/20 text-center py-3">لم تضف إشارات بعد</p>
        )}

        {bookmarks.map((bm, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
            <div>
              <p className="text-xs font-medium text-[#e8e1d9]">{bm.chapter}</p>
              {bm.note && <p className="text-[10px] text-white/30">{bm.note}</p>}
            </div>
            <button
              type="button"
              onClick={() => removeBookmark(i)}
              className="text-[10px] text-white/20 hover:text-white/50"
              aria-label="حذف الإشارة"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
