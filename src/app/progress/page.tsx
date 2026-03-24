"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTaamunDailyByDay } from "@/lib/taamun-daily";
import { PROGRAM_ROUTE } from "@/lib/routes";
import { loadProgress } from "@/lib/storage";

type Reflection = {
  id: string;
  day: number;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type ReflectionsPayload = {
  ok?: boolean;
  error?: string;
  reflections?: Reflection[];
};

function normalizeLocalReflections(): Reflection[] {
  const local = loadProgress();
  const rows = Object.values(local.entries)
    .filter((entry) => entry.dayId >= 1 && entry.dayId <= 28)
    .map((entry) => ({
      id: `local-${entry.dayId}`,
      day: entry.dayId,
      note: entry.note ?? null,
      created_at: entry.answeredAtISO,
      updated_at: entry.answeredAtISO,
    }));

  return rows.sort((a, b) => b.day - a.day);
}

export default function ProgressPage() {
  const [loading, setLoading] = useState(true);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/reflections", { cache: "no-store" });

        if (res.status === 401) {
          // Progress page should remain usable for guests.
          setReflections(normalizeLocalReflections());
          return;
        }

        const data = (await res.json()) as ReflectionsPayload;
        if (!res.ok || data.ok === false) {
          const localRows = normalizeLocalReflections();
          setReflections(localRows);
          if (localRows.length === 0) {
            setError("تعذر تحميل سجل التأملات من الخادم، وتم استخدام النسخة المحلية.");
          }
          return;
        }

        setReflections([...(data.reflections ?? [])].sort((a, b) => b.day - a.day));
      } catch {
        const localRows = normalizeLocalReflections();
        setReflections(localRows);
        if (localRows.length === 0) {
          setError("تعذر الاتصال بالخادم، ولا توجد نسخة محلية بعد.");
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#15130f] flex items-center justify-center">
        <p className="text-[#c9b88a] text-sm">جارٍ التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#15130f] p-6">
      <div className="mx-auto max-w-[720px] space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-[#e8e1d9]">سجل التأملات</h1>
          <Link
            href={PROGRAM_ROUTE}
            className="text-sm text-[#c9b88a] hover:text-[#e8e1d9] transition-colors"
          >
            ← البرنامج
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {!error && reflections.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center space-y-4">
            <p className="text-[#c9b88a]">لا توجد تأملات مسجلة بعد.</p>
            <Link
              href="/program/day/1"
              className="inline-block rounded-xl bg-[#c9b88a] px-6 py-2.5 text-sm font-semibold text-[#15130f] hover:opacity-90 transition-opacity"
            >
              ابدأ اليوم الأول
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {reflections.map((r) => {
            const entry = getTaamunDailyByDay(r.day);
            return (
              <div
                key={r.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c9b88a]/10 text-sm font-bold text-[#c9b88a]">
                      {r.day}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#e8e1d9]">
                        اليوم {r.day}
                      </p>
                      {entry?.theme && (
                        <p className="text-xs text-[#c9b88a]">{entry.theme}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/program/day/${r.day}`}
                    className="text-xs text-[#c9b88a] hover:text-[#e8e1d9] transition-colors"
                  >
                    فتح
                  </Link>
                </div>

                {entry?.verse.arabic && (
                  <p
                    className="text-sm leading-relaxed text-[#c9b88a] border-r-2 border-[#c9b88a]/30 pr-3"
                    style={{ fontFamily: "Amiri, serif" }}
                  >
                    ﴿{entry.verse.arabic}﴾
                  </p>
                )}

                {r.note ? (
                  <p className="text-sm text-[#e8e1d9] leading-relaxed whitespace-pre-wrap">
                    {r.note}
                  </p>
                ) : (
                  <p className="text-xs text-[#c9b88a]/60 italic">لا يوجد تأمل مكتوب</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
