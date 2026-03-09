"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getTaamunDailyByDay } from "@/lib/taamun-daily";
import { PROGRAM_ROUTE } from "@/lib/routes";

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

export default function ProgressPage() {
  const router = useRouter();
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
          router.replace("/auth?next=/progress");
          return;
        }
        const data = (await res.json()) as ReflectionsPayload;
        if (!res.ok || data.ok === false) {
          setError("تعذر تحميل سجل التأملات.");
          return;
        }
        setReflections(
          [...(data.reflections ?? [])].sort((a, b) => b.day - a.day)
        );
      } catch {
        setError("تعذر الاتصال بالخادم.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted text-sm">جارٍ التحميل...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text">سجل التأملات</h1>
        <Link
          href={PROGRAM_ROUTE}
          className="text-sm text-muted hover:text-text transition-colors"
        >
          ← البرنامج
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {!error && reflections.length === 0 && (
        <div className="rounded-2xl border border-border bg-panel p-8 text-center space-y-4">
          <p className="text-muted">لا توجد تأملات مسجلة بعد.</p>
          <Link
            href="/program/day/1"
            className="inline-block rounded-xl bg-gold px-6 py-2.5 text-sm font-semibold text-bg hover:opacity-90 transition-opacity"
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
              className="rounded-2xl border border-border bg-panel p-5 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/10 text-sm font-bold text-gold">
                    {r.day}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-text">
                      اليوم {r.day}
                    </p>
                    {entry?.theme && (
                      <p className="text-xs text-muted">{entry.theme}</p>
                    )}
                  </div>
                </div>
                <Link
                  href={`/program/day/${r.day}`}
                  className="text-xs text-muted hover:text-gold transition-colors"
                >
                  فتح
                </Link>
              </div>

              {/* Verse */}
              {entry?.verse.arabic && (
                <p
                  className="text-sm leading-relaxed text-muted border-r-2 border-gold/30 pr-3"
                  style={{ fontFamily: "Amiri, serif" }}
                >
                  ﴿{entry.verse.arabic}﴾
                </p>
              )}

              {/* Note */}
              {r.note ? (
                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                  {r.note}
                </p>
              ) : (
                <p className="text-xs text-muted/60 italic">لا يوجد تأمل مكتوب</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
