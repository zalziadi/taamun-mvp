"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { JournalPage } from "@/components/stitch/JournalPage";

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

export default function JournalRoutePage() {
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
      <div className="dark flex min-h-[60vh] items-center justify-center bg-background">
        <p className="text-sm text-on-surface-variant">جارٍ تحميل الدفتر...</p>
      </div>
    );
  }

  return (
    <JournalPage
      stepNumber={3}
      stepTitle="الدفتر"
      prompt="كيف تنطبق آيات رحلتك على يومك؟"
      placeholder="ابدأ الكتابة هنا بكل صدق وهدوء..."
    >
      <div className="mt-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="block text-[11px] tracking-[0.2em] text-on-surface-variant">مسار التهيئة</span>
            <p className="mt-1 text-sm text-on-surface/80">تأملاتك المسجّلة عبر الرحلة.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="rounded-xl border border-outline-variant px-3 py-1.5 text-xs text-on-surface-variant hover:border-primary/40 hover:text-primary">
              الرئيسية
            </Link>
            <Link href="/city" className="text-sm text-primary transition-colors hover:text-primary-fixed">
              خريطة المدينة
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-200">
            {error}
            <p className="mt-2 text-xs text-on-surface-variant">جرّب إعادة فتح الصفحة بعد ثوانٍ.</p>
          </div>
        ) : null}

        {notice ? (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/40 p-4 text-sm text-on-surface-variant">
            {notice}
          </div>
        ) : null}

        {!error && days.length === 0 ? (
          <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-low/40 p-8 text-center backdrop-blur-xl">
            <p className="text-sm text-on-surface-variant">لم يتم تسجيل تأملات بعد.</p>
            <Link
              href="/reflection"
              className="mt-3 inline-block rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-on-primary"
            >
              ابدأ أول تأمل
            </Link>
          </div>
        ) : null}

        <div className="space-y-4">
          {days.map((item) => (
            <article
              key={item.day}
              className="rounded-3xl border border-outline-variant/30 bg-surface-container-low/40 p-6 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-primary/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-headline text-[1.35rem] text-on-surface">تأمل يوم {item.day}</h2>
                  <p className="mt-1 text-[11px] text-on-surface-variant">
                    {item.updated_at ? new Date(item.updated_at).toLocaleDateString("ar-SA") : "بدون تاريخ"}
                  </p>
                </div>
                <Link
                  href="/reflection"
                  className="rounded-full border border-outline-variant px-3 py-1 text-xs text-on-surface-variant hover:border-primary/40 hover:text-primary"
                >
                  فتح التأمل
                </Link>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-outline-variant/40 bg-surface-container/40 p-3">
                  <p className="text-xs text-on-surface-variant">الملاحظة</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-on-surface">{item.observe || "—"}</p>
                </div>
                <div className="rounded-2xl border border-outline-variant/40 bg-surface-container/40 p-3">
                  <p className="text-xs text-on-surface-variant">الإدراك</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-on-surface">{item.insight || "—"}</p>
                </div>
                <div className="rounded-2xl border border-outline-variant/40 bg-surface-container/40 p-3">
                  <p className="text-xs text-on-surface-variant">التمعّن</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-on-surface">{item.contemplate || "—"}</p>
                </div>
              </div>

              {item.ai_reflection ? (
                <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-3">
                  <p className="text-xs text-primary">لمسة المرشد</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-on-surface">{item.ai_reflection}</p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </JournalPage>
  );
}
