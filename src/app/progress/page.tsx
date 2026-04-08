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

type LoadStatus = "idle" | "loading" | "ok" | "offline" | "unauthenticated";

export default function ProgressPage() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");

  const load = async () => {
    setStatus("loading");

    try {
      const res = await fetch("/api/reflections", { cache: "no-store" });

      if (res.status === 401) {
        // Guest mode: fall back to local reflections
        const localRows = normalizeLocalReflections();
        setReflections(localRows);
        setStatus("unauthenticated");
        return;
      }

      const data = (await res.json()) as ReflectionsPayload;
      if (!res.ok || data.ok === false) {
        const localRows = normalizeLocalReflections();
        setReflections(localRows);
        setStatus("offline");
        return;
      }

      const rows = [...(data.reflections ?? [])].sort((a, b) => b.day - a.day);
      setReflections(rows);
      setStatus("ok");
    } catch {
      const localRows = normalizeLocalReflections();
      setReflections(localRows);
      setStatus("offline");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#15130f] flex items-center justify-center">
        <p className="text-[#c9b88a] text-sm">جارٍ التحميل...</p>
      </div>
    );
  }

  const isEmpty = reflections.length === 0;

  return (
    <div className="min-h-screen bg-[#15130f] p-6">
      <div className="mx-auto max-w-[720px] space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-[#e8e1d9]">سجل التمعّنات</h1>
          <Link
            href={PROGRAM_ROUTE}
            className="text-sm text-[#c9b88a] hover:text-[#e8e1d9] transition-colors"
          >
            ← البرنامج
          </Link>
        </div>

        {/* Subtle offline notice — shown when API failed but we may have local data */}
        {status === "offline" && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#c9b88a]/25 bg-[#c9b88a]/5 px-4 py-3 text-xs text-[#c9b88a]">
            <span>ما قدرنا نوصل للخادم الآن — جرّب مرة أخرى</span>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-[#c9b88a]/30 bg-[#c9b88a]/10 px-3 py-1 text-[11px] font-semibold text-[#c9b88a] hover:bg-[#c9b88a]/20 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Unauthenticated notice — sign in to sync */}
        {status === "unauthenticated" && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#c9b88a]/25 bg-[#c9b88a]/5 px-4 py-3 text-xs text-[#c9b88a]">
            <span>سجّل الدخول لحفظ تمعّناتك في كل جهازك</span>
            <Link
              href="/login?next=/progress"
              className="rounded-lg border border-[#c9b88a]/30 bg-[#c9b88a]/10 px-3 py-1 text-[11px] font-semibold text-[#c9b88a] hover:bg-[#c9b88a]/20 transition-colors"
            >
              دخول
            </Link>
          </div>
        )}

        {/* Empty state — shown whenever there are no reflections, regardless of status */}
        {isEmpty && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#c9b88a]/30 bg-[#c9b88a]/5">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9b88a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-[#e8e1d9]">ابدأ سجلك الآن</p>
              <p className="text-xs text-[#c9b88a]/80">كل تمعّن يُحفظ هنا — لتعود إليه وتبني عليه</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/program/day/1"
                className="inline-block rounded-xl bg-[#c9b88a] px-5 py-2.5 text-sm font-semibold text-[#15130f] hover:opacity-90 transition-opacity"
              >
                ابدأ اليوم الأول
              </Link>
              <Link
                href="/reflection"
                className="inline-block rounded-xl border border-[#c9b88a]/40 px-5 py-2.5 text-sm text-[#c9b88a] hover:bg-[#c9b88a]/10 transition-colors"
              >
                افتح التمعّن
              </Link>
            </div>
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
