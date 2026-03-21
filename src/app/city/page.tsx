"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AWARENESS_STATES, LIFE_DOMAINS, type AwarenessState } from "@/lib/city-of-meaning";

type TrackerEntry = {
  day: number;
  state: AwarenessState;
};

type TrackerPayload = {
  ok?: boolean;
  entries?: TrackerEntry[];
  counts?: Record<AwarenessState, number>;
};

const TOTAL_DAYS = 28;

export default function CityPage() {
  const router = useRouter();
  const [today, setToday] = useState(1);
  const [selected, setSelected] = useState<AwarenessState | null>(null);
  const [saving, setSaving] = useState(false);
  const [tracker, setTracker] = useState<TrackerEntry[]>([]);
  const [counts, setCounts] = useState<Record<AwarenessState, number>>({
    shadow: 0,
    gift: 0,
    best_possibility: 0,
  });
  const [activeDomain, setActiveDomain] = useState<string>(LIFE_DOMAINS[0].key);

  useEffect(() => {
    const day = Math.max(1, Math.min(TOTAL_DAYS, new Date().getDate()));
    setToday(day);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/awareness-tracker", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/auth?next=/city");
          return;
        }
        const data = (await res.json()) as TrackerPayload;
        if (!res.ok || data.ok === false) return;
        setTracker(data.entries ?? []);
        if (data.counts) setCounts(data.counts);
      } catch {
        // Non-blocking for city map.
      }
    };
    load();
  }, [router]);

  const todayState = useMemo(
    () => tracker.find((entry) => entry.day === today)?.state ?? null,
    [today, tracker]
  );

  async function saveState(state: AwarenessState) {
    setSelected(state);
    setSaving(true);
    try {
      const res = await fetch("/api/awareness-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: today, state }),
      });
      if (!res.ok) return;
      setTracker((prev) => {
        const next = prev.filter((entry) => entry.day !== today);
        next.push({ day: today, state });
        return next.sort((a, b) => a.day - b.day);
      });
      setCounts((prev) => {
        const next = { ...prev };
        const previousState = tracker.find((entry) => entry.day === today)?.state;
        if (previousState) next[previousState] = Math.max(0, next[previousState] - 1);
        next[state] += 1;
        return next;
      });
    } finally {
      setSaving(false);
    }
  }

  const domain = LIFE_DOMAINS.find((item) => item.key === activeDomain) ?? LIFE_DOMAINS[0];

  return (
    <div className="tm-shell space-y-7">
      <section className="relative overflow-hidden rounded-3xl border border-[#d8cdb9] bg-[#fcfaf7]/80 p-7 shadow-[0_14px_36px_rgba(140,120,81,0.15)]">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(231,196,104,0.22) 0%, rgba(231,196,104,0) 70%)" }}
        />
        <p className="relative text-xs tracking-[0.26em] text-[#8c7851]">CITY OF MEANING</p>
        <h1 className="tm-heading relative text-4xl leading-tight">مدينة المعنى</h1>
        <p className="relative mt-2 max-w-[780px] text-sm leading-relaxed text-[#5f5648]/85">
          القرآن ليس مجرد نص، بل نظام تحويل داخلي. هنا تنتقل عبر دوائر الحياة بتوازن: من الظل إلى الهدية ثم أفضل
          احتمال، مع أثر عملي يومي.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.65fr_1fr]">
        <div className="rounded-3xl border border-[#d8cdb9] bg-[#fcfaf7]/80 p-5 shadow-[0_10px_30px_rgba(140,120,81,0.14)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="tm-heading text-[1.7rem]">الخريطة التفاعلية</h2>
            <span className="text-xs text-[#7d7362]">اضغط على أي نطاق</span>
          </div>
          <div className="rounded-2xl border border-[#d8cdb9] bg-[#f8f4ec] p-4">
            <svg viewBox="0 0 740 420" className="w-full h-auto" role="img" aria-label="خريطة مدينة المعنى">
              <defs>
                <linearGradient id="cityGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6D8BFF" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#E7C468" stopOpacity="0.2" />
                </linearGradient>
                <radialGradient id="coreGlow" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#E7C468" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#E7C468" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect x="0" y="0" width="740" height="420" rx="22" fill="#f6f1e8" />
              <circle cx="370" cy="210" r="150" fill="url(#cityGlow)" />
              <circle cx="370" cy="210" r="120" fill="url(#coreGlow)" />

              {LIFE_DOMAINS.map((item, index) => {
                const angle = (Math.PI * 2 * index) / LIFE_DOMAINS.length - Math.PI / 2;
                const cx = 370 + Math.cos(angle) * 170;
                const cy = 210 + Math.sin(angle) * 145;
                const isActive = item.key === activeDomain;
                return (
                  <g key={item.key}>
                    <line x1={370} y1={210} x2={cx} y2={cy} stroke="#c9bda8" strokeWidth="1.2" />
                    <g
                      onClick={() => setActiveDomain(item.key)}
                      className="cursor-pointer"
                      transform={`translate(${cx}, ${cy})`}
                    >
                      <circle
                        r={isActive ? 34 : 26}
                        fill={isActive ? "#8c7851" : "#e7dece"}
                        fillOpacity={isActive ? 0.95 : 1}
                        stroke={isActive ? "#7b694a" : "#b7ab98"}
                        strokeWidth={isActive ? 2.8 : 1.2}
                      />
                      {isActive ? <circle r="39" fill="none" stroke="#E7C468" strokeOpacity="0.35" strokeWidth="1.6" /> : null}
                      <text
                        x="0"
                        y="5"
                        textAnchor="middle"
                        className={`text-[11px] font-semibold ${isActive ? "fill-[#f4f1ea]" : "fill-[#4e4637]"}`}
                      >
                        {item.title}
                      </text>
                    </g>
                  </g>
                );
              })}

              <g>
                <circle cx="370" cy="210" r="48" fill="#f1e7d4" stroke="#8c7851" strokeWidth="2.4" />
                <text x="370" y="203" textAnchor="middle" className="fill-[#7b694a] text-[11px] font-semibold">
                  مدينة المعنى
                </text>
                <text x="370" y="220" textAnchor="middle" className="fill-[#7d7362] text-[10px]">
                  وعي - إدراك - أثر
                </text>
              </g>
            </svg>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-[#d8cdb9] bg-[#fcfaf7]/80 p-5 shadow-[0_10px_30px_rgba(140,120,81,0.14)] backdrop-blur-xl">
            <h3 className="tm-heading text-[1.45rem]">{domain.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5f5648]/85">{domain.hint}</p>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {AWARENESS_STATES.map((state) => {
                const active = (selected ?? todayState) === state.value;
                return (
                  <button
                    key={state.value}
                    type="button"
                    disabled={saving}
                    onClick={() => saveState(state.value)}
                    className={[
                      "rounded-xl border px-3 py-2.5 text-sm transition-colors text-right duration-200",
                      active
                        ? "border-[#8c7851] bg-[#cdb98f]/18 text-[#7b694a]"
                        : "border-[#d8cdb9] bg-[#f8f4ec] text-[#7d7362] hover:border-[#8c7851]/40 hover:text-[#2f2619]",
                    ].join(" ")}
                  >
                    {state.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#7d7362]">اليوم {today}</p>
          </section>

          <section className="rounded-3xl border border-[#d8cdb9] bg-[#fcfaf7]/80 p-5 shadow-[0_10px_30px_rgba(140,120,81,0.14)] backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-[#2f2619]">مؤشر حالتك عبر الأيام</h3>
            <div className="space-y-2">
              <StatRow
                label="الظل"
                value={counts.shadow}
                tone="text-rose-300"
                barClass="bg-rose-500/30"
                percent={Math.round((counts.shadow / Math.max(1, tracker.length)) * 100)}
              />
              <StatRow
                label="الهدية"
                value={counts.gift}
                tone="text-amber-300"
                barClass="bg-amber-500/30"
                percent={Math.round((counts.gift / Math.max(1, tracker.length)) * 100)}
              />
              <StatRow
                label="أفضل احتمال"
                value={counts.best_possibility}
                tone="text-emerald-300"
                barClass="bg-emerald-500/30"
                percent={Math.round((counts.best_possibility / Math.max(1, tracker.length)) * 100)}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-[#d8cdb9] bg-[#fcfaf7]/80 p-5 shadow-[0_10px_30px_rgba(140,120,81,0.14)] backdrop-blur-xl">
            <Link href="/program" className="block rounded-xl bg-[#7b694a] px-4 py-2.5 text-center text-sm font-semibold text-[#f4f1ea] transition hover:opacity-90">
              متابعة البرنامج
            </Link>
            <Link href="/journal" className="mt-2 block text-center text-sm text-[#7d7362] transition hover:text-[#2f2619]">
              فتح دفتر التأملات
            </Link>
          </section>
        </aside>
      </section>
    </div>
  );
}

function StatRow({
  label,
  value,
  tone,
  barClass,
  percent,
}: {
  label: string;
  value: number;
  tone: string;
  barClass: string;
  percent: number;
}) {
  return (
    <div className="space-y-1.5 rounded-lg border border-[#d8cdb9] bg-[#f8f4ec] px-3 py-2">
      <div className="flex items-center justify-between">
        <span className={`text-sm ${tone}`}>{label}</span>
        <span className="text-sm font-semibold text-[#2f2619]">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-black/20 overflow-hidden">
        <div className={`h-full ${barClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
