"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AWARENESS_STATES, type AwarenessState } from "@/lib/city-of-meaning";

type TimelineDay = {
  day: number;
  completed: boolean;
  awareness_state: AwarenessState | null;
  awareness_score: number | null;
};

type AnalyticsPayload = {
  ok?: boolean;
  metrics?: {
    completion_percent: number;
    completed_days: number;
    total_days: number;
    awareness_avg: number;
    awareness_entries: number;
  };
  timeline?: TimelineDay[];
};

const TOTAL_DAYS = 28;

export default function JourneyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [metrics, setMetrics] = useState({
    completion_percent: 0,
    completed_days: 0,
    total_days: TOTAL_DAYS,
    awareness_avg: 0,
    awareness_entries: 0,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/journey/analytics", { cache: "no-store" });

        if (res.status === 401) {
          router.replace("/auth?next=/journey");
          return;
        }

        const data = (await res.json()) as AnalyticsPayload;
        if (res.ok && data.ok !== false) {
          setTimeline(data.timeline ?? []);
          if (data.metrics) setMetrics(data.metrics);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const statesByDay = useMemo(() => {
    const map = new Map<number, AwarenessState>();
    timeline.forEach((item) => {
      if (item.awareness_state) map.set(item.day, item.awareness_state);
    });
    return map;
  }, [timeline]);

  const completionSet = useMemo(() => {
    return new Set<number>(timeline.filter((item) => item.completed).map((item) => item.day));
  }, [timeline]);

  const polylinePoints = useMemo(() => {
    const points = timeline
      .filter((item) => item.awareness_score !== null)
      .map((item) => {
        const x = ((item.day - 1) / (TOTAL_DAYS - 1)) * 520 + 14;
        const y = 140 - ((item.awareness_score as number) - 1) * 55;
        return `${x},${y}`;
      });
    return points.join(" ");
  }, [timeline]);

  const hasJourneyData = timeline.some((item) => item.completed || item.awareness_state !== null);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted">جارٍ تحليل الرحلة...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1220px] space-y-6 px-4 py-8">
      <section className="relative overflow-hidden rounded-3xl border border-[#2c313c] bg-[#0b0f17] p-7 text-[#fdf3df] shadow-[0_16px_40px_rgba(8,8,12,0.55)]">
        <div className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-[#d4a853]/10 blur-[90px]" />
        <p className="text-xs tracking-[0.3em] text-[#d4a853]">المرحلة الأولى</p>
        <h1 className="mt-3 font-['Amiri'] text-5xl leading-tight">الظل</h1>
        <p className="mt-3 max-w-[780px] text-sm leading-relaxed text-[#d2c5b2]">
          تبدأ الرحلة من الداخل. لا نبحث عن إجابة سريعة، بل نمنح المساحة للأسئلة كي تنضج في الصمت.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-4 rounded-3xl border border-[#2c313c] bg-[#101520]/90 p-5 text-[#fdf3df]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="نسبة التقدم" value={`${metrics.completion_percent}%`} />
            <MetricCard label="الأيام المكتملة" value={`${metrics.completed_days}/${metrics.total_days}`} />
            <MetricCard label="متوسط الوعي" value={metrics.awareness_avg || "—"} />
            <MetricCard label="إدخالات الوعي" value={metrics.awareness_entries} />
          </div>

          <div className="rounded-2xl border border-[#343947] bg-[#0b111c] p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-['Amiri'] text-2xl">منحنى الوعي</h2>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-rose-300">الظل</span>
                <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-amber-300">الهدية</span>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">أفضل احتمال</span>
              </div>
            </div>
            <svg viewBox="0 0 548 160" className="h-auto w-full">
              <rect x="0" y="0" width="548" height="160" fill="#0f1623" rx="12" />
              <line x1="14" y1="140" x2="534" y2="140" stroke="#334155" strokeWidth="1" />
              <line x1="14" y1="85" x2="534" y2="85" stroke="#334155" strokeWidth="1" />
              <line x1="14" y1="30" x2="534" y2="30" stroke="#334155" strokeWidth="1" />
              {polylinePoints ? (
                <polyline
                  fill="none"
                  stroke="#d4a853"
                  strokeWidth="2.8"
                  points={polylinePoints}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
              <text x="520" y="145" className="fill-[#a7b1c3] text-[10px]">الظل</text>
              <text x="515" y="90" className="fill-[#a7b1c3] text-[10px]">الهدية</text>
              <text x="485" y="35" className="fill-[#a7b1c3] text-[10px]">أفضل احتمال</text>
            </svg>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-[#2c313c] bg-[#101520]/90 p-5 text-[#fdf3df]">
            <h3 className="text-xs tracking-[0.2em] text-[#d4a853]">مسار الرحلة</h3>
            <div className="mt-3 space-y-2">
              <div className="rounded-xl border border-[#d4a853]/30 bg-[#d4a853]/10 px-3 py-2 text-sm">الظل</div>
              <div className="rounded-xl border border-[#3b4252] bg-[#121926] px-3 py-2 text-sm text-[#b8c0cf]">الهدية</div>
              <div className="rounded-xl border border-[#3b4252] bg-[#121926] px-3 py-2 text-sm text-[#b8c0cf]">أفضل احتمال</div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#2c313c] bg-[#101520]/90 p-5 text-[#fdf3df]">
            <h2 className="font-['Amiri'] text-2xl">الخلاصة الذكية</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#d2c5b2]">
              {metrics.awareness_avg >= 2.4
                ? "رحلتك تتجه بثبات نحو أفضل احتمال. استمر على نفس نسق الحضور اليومي."
                : metrics.awareness_avg >= 1.6
                ? "هناك انتقال متوازن بين الظل والهدية. ركّز على تحويل الإدراك إلى فعل واضح."
                : "الرحلة في بدايتها. ثبّت عادة التأمل اليومي، حتى لو بسطر واحد."}
            </p>
          </section>
        </aside>
      </section>

      <section className="rounded-3xl border border-[#2c313c] bg-[#101520]/90 p-6 text-[#fdf3df]">
        <h2 className="mb-4 font-['Amiri'] text-2xl">خط زمني 28 يومًا</h2>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
          {Array.from({ length: TOTAL_DAYS }, (_, index) => {
            const day = index + 1;
            const state = statesByDay.get(day);
            const done = completionSet.has(day);
            const color =
              state === "best_possibility"
                ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                : state === "gift"
                ? "bg-amber-500/20 border-amber-400/40 text-amber-300"
                : state === "shadow"
                ? "bg-rose-500/20 border-rose-400/40 text-rose-300"
                : done
                ? "bg-[#d4a853]/15 border-[#d4a853]/30 text-[#d4a853]"
                : "bg-[#121926] border-[#3b4252] text-[#9aa4b8]";

            return (
              <div key={day} className={`rounded-xl border p-3 text-center text-xs ${color}`}>
                <div>يوم {day}</div>
                <div className="mt-1 text-[11px]">
                  {state
                    ? AWARENESS_STATES.find((item) => item.value === state)?.label
                    : done
                    ? "منجز"
                    : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {!hasJourneyData ? (
        <section className="rounded-3xl border border-[#2c313c] bg-[#101520]/90 p-6 text-center text-[#fdf3df]">
          <p className="text-sm text-[#d2c5b2]">لا توجد بيانات كافية بعد لعرض منحنى التحول.</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Link href="/program/day/1" className="rounded-xl bg-[#7b5804] px-4 py-2 text-sm font-semibold text-[#ffdea6]">
              ابدأ أول يوم
            </Link>
            <Link href="/reflection" className="rounded-xl border border-[#3b4252] px-4 py-2 text-sm text-[#fdf3df]">
              افتح التأمل اليومي
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#3b4252] bg-[#121926] p-4">
      <p className="text-xs text-[#9aa4b8]">{label}</p>
      <p className={`mt-1 text-2xl font-bold text-[#fdf3df] ${tone ?? ""}`}>{value}</p>
    </div>
  );
}
