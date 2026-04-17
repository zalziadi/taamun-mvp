"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { programDayRoute } from "@/lib/routes";

type EchoData = {
  day: number;
  snippet: string;
  daysAgo: number;
};

/**
 * ReflectionEcho — shows a past reflection on the homepage.
 * Creates continuity: "قلبك كتب قبل X يوم".
 * Only renders if user has a reflection from ~7 days ago.
 */
export function ReflectionEcho({ offset = 7 }: { offset?: number }) {
  const [echo, setEcho] = useState<EchoData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/reflections/echo?offset=${offset}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.reflection) {
          setEcho(data.reflection);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [offset]);

  if (!loaded || !echo) return null;

  return (
    <section className="tm-card border-[#c4a265]/20 bg-gradient-to-b from-[#faf6ee] to-[#fcfaf7] p-5 sm:p-6 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] tracking-[0.15em] text-[#8c7851]/70">
          من دفترك — قبل {toArabicNumber(echo.daysAgo)} يوم
        </p>
        <Link
          href={programDayRoute(echo.day)}
          className="text-[10px] text-[#8c7851] hover:text-[#5a4a35]"
        >
          يوم {toArabicNumber(echo.day)} →
        </Link>
      </div>
      <blockquote className="text-sm leading-relaxed text-[#2f2619] font-[var(--font-amiri)]">
        &ldquo;{echo.snippet}&rdquo;
      </blockquote>
      <p className="text-[10px] text-[#8c7851]/60">
        وش تغيّر منذ ذلك اليوم — لاحظ.
      </p>
    </section>
  );
}

function toArabicNumber(n: number): string {
  const map = "٠١٢٣٤٥٦٧٨٩";
  return String(n).split("").map((d) => map[parseInt(d, 10)] ?? d).join("");
}
