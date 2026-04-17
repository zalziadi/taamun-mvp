"use client";

import { useEffect, useState } from "react";

const BOOK_CHAPTERS = [
  "الميلاد في الظلام",
  "المرايا الداخلية",
  "القلب المغلق",
  "الاستسلام",
  "الطريق",
  "الصراط المستقيم",
  "مرايا النفس",
  "الطمأنينة",
  "المرايا البشرية",
  "الجذور والنمو",
  "الرزق والوفرة",
  "العمل والمعنى",
  "الغاية",
  "التحوّل",
];

const STORAGE_KEY = "taamun.book.progress";

interface BookProgressData {
  lastChapter: number;
  chaptersRead: number[];
  lastReadAt: string | null;
}

function loadProgress(): BookProgressData {
  if (typeof window === "undefined") return { lastChapter: 0, chaptersRead: [], lastReadAt: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { lastChapter: 0, chaptersRead: [], lastReadAt: null };
}

function saveProgress(data: BookProgressData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function BookProgress() {
  const [progress, setProgress] = useState<BookProgressData>({ lastChapter: 0, chaptersRead: [], lastReadAt: null });

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const readCount = progress.chaptersRead.length;
  const percent = Math.round((readCount / BOOK_CHAPTERS.length) * 100);

  function markChapterRead(index: number) {
    const updated = {
      lastChapter: index,
      chaptersRead: [...new Set([...progress.chaptersRead, index])].sort(),
      lastReadAt: new Date().toISOString(),
    };
    setProgress(updated);
    saveProgress(updated);
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-xs text-[#c9b88a]/60">
        <span>تقدم القراءة</span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-l from-[#c9b88a] to-[#e0c29a] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Chapters */}
      <div className="space-y-1.5">
        {BOOK_CHAPTERS.map((chapter, i) => {
          const isRead = progress.chaptersRead.includes(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => markChapterRead(i)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-right text-sm transition-colors ${
                isRead
                  ? "bg-[#c9b88a]/10 text-[#c9b88a]"
                  : "bg-white/[0.03] text-white/40 hover:bg-white/5 hover:text-white/60"
              }`}
            >
              <span className="w-5 text-center text-xs">{isRead ? "✓" : i + 1}</span>
              <span>{chapter}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
