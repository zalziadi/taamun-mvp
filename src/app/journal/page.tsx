"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type JournalDay = {
  day: number;
  observe: string;
  insight: string;
  contemplate: string;
  ai_reflection: string;
  updated_at?: string;
};

type HistoryPayload = {
  ok?: boolean;
  days?: JournalDay[];
};

type ReflectionPayload = {
  ok?: boolean;
  reflections?: Array<{
    day: number;
    note?: string | null;
    updated_at?: string;
  }>;
};

export default function JournalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<JournalDay[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setNotice(null);
      try {
        const res = await fetch("/api/history", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/auth?next=/journal");
          return;
        }
        const data = (await res.json()) as HistoryPayload;
        if (!res.ok || data.ok === false) {
          const fallbackRes = await fetch("/api/reflections", { cache: "no-store" });
          if (!fallbackRes.ok) {
            setDays([]);
            setNotice("الدفتر متاح، لكن لا توجد بيانات محفوظة حاليًا.");
            return;
          }
          const fallbackData = (await fallbackRes.json()) as ReflectionPayload;
          if (fallbackData.ok === false) {
            setDays([]);
            setNotice("الدفتر متاح، لكن لا توجد بيانات محفوظة حاليًا.");
            return;
          }
          const normalized = (fallbackData.reflections ?? []).map((item) => ({
            day: item.day,
            observe: item.note ?? "",
            insight: "",
            contemplate: "",
            ai_reflection: "",
            updated_at: item.updated_at,
          }));
          setDays(normalized.sort((a, b) => b.day - a.day));
          return;
        }
        setDays([...(data.days ?? [])].sort((a, b) => b.day - a.day));
      } catch {
        setDays([]);
        setNotice("لا يوجد سجل متاح الآن، يمكنك البدء بكتابة أول تأمل.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted">جارٍ تحميل الدفتر...</p>
      </div>
    );
  }

  return (
    <div className="tm-shell space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-[#d8cdb9] bg-[#f8f3ea]/90 p-7 backdrop-blur-xl">
        <div
          className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(231,196,104,0.16) 0%, rgba(231,196,104,0) 70%)" }}
        />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <span className="block text-[11px] tracking-[0.2em] text-[#7d7362]">مسار التهيئة</span>
            <h1 className="tm-heading text-4xl leading-tight text-[#5a4531]">الدفتر</h1>
            <p className="mt-2 text-sm text-[#6f6455]">تأملاتك المسجّلة عبر الرحلة.</p>
          </div>
          <Link href="/city" className="text-sm text-[#7d7362] transition-colors hover:text-[#7b694a]">
            خريطة المدينة
          </Link>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-100/70 p-4 text-sm text-red-700">
          {error}
          <p className="mt-2 text-xs text-[#7d7362]">جرّب إعادة فتح الصفحة بعد ثوانٍ.</p>
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-2xl border border-[#d8cdb9] bg-[#f8f3ea] p-4 text-sm text-[#6f6455]">
          {notice}
        </div>
      ) : null}

      {!error && days.length === 0 ? (
        <div className="rounded-3xl border border-[#d8cdb9] bg-[#fcfaf7]/80 p-8 text-center backdrop-blur-xl">
          <p className="text-sm text-[#7d7362]">لم يتم تسجيل تأملات بعد.</p>
          <Link href="/reflection" className="mt-3 inline-block rounded-xl bg-[#7b694a] px-5 py-2 text-sm font-semibold text-[#f4f1ea]">
            ابدأ أول تأمل
          </Link>
        </div>
      ) : null}

      <div className="space-y-4">
        {days.map((item) => (
          <article
            key={item.day}
            className="rounded-3xl border border-[#d8cdb9] bg-[#fdf8ef]/90 p-6 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[#8c7851]/35"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="tm-heading text-[1.35rem] text-[#5a4531]">تأمل يوم {item.day}</h2>
                <p className="tm-mono mt-1 text-[11px] text-[#7d7362]">
                  {item.updated_at ? new Date(item.updated_at).toLocaleDateString("ar-SA") : "بدون تاريخ"}
                </p>
              </div>
              <Link href="/reflection" className="rounded-full border border-[#d8cdb9] px-3 py-1 text-xs text-[#5f5648] hover:border-[#8c7851]/35 hover:text-[#7b694a]">
                فتح التأمل
              </Link>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-[#e1d7c7] bg-[#fffaf2] p-3">
                <p className="text-xs text-[#7d7362]">الملاحظة</p>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-[#2f2619]">{item.observe || "—"}</p>
              </div>
              <div className="rounded-2xl border border-[#e1d7c7] bg-[#fffaf2] p-3">
                <p className="text-xs text-[#7d7362]">الإدراك</p>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-[#2f2619]">{item.insight || "—"}</p>
              </div>
              <div className="rounded-2xl border border-[#e1d7c7] bg-[#fffaf2] p-3">
                <p className="text-xs text-[#7d7362]">التمعّن</p>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-[#2f2619]">{item.contemplate || "—"}</p>
              </div>
            </div>

            {item.ai_reflection ? (
              <div className="rounded-xl border border-[#cdb98f] bg-[#f1e7d4] p-3">
                <p className="text-xs text-[#7b694a]">لمسة المرشد</p>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-[#2f2619]">{item.ai_reflection}</p>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
