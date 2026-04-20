"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Insight {
  slug: string;
  content: string;
  attribution: string | null;
}

/**
 * Client-side rotator that surfaces up to 3 real published shared_insights.
 * Falls back silently when Supabase isn't reachable or no insights exist.
 * Renders nothing until it has at least one row — quiet default state.
 */
export function SocialProofRotator({ limit = 3 }: { limit?: number } = {}) {
  const [items, setItems] = useState<Insight[] | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/shared?limit=${limit}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const list = (data?.insights ?? []) as Insight[];
        setItems(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [limit]);

  useEffect(() => {
    if (!items || items.length < 2) return;
    const id = setInterval(() => {
      setActive((a) => (a + 1) % items.length);
    }, 6000);
    return () => clearInterval(id);
  }, [items]);

  if (!items || items.length === 0) return null;
  const current = items[active] ?? items[0];

  return (
    <section
      className="mx-auto w-full max-w-2xl px-5 py-8 text-center space-y-4"
      dir="rtl"
      aria-label="رؤى من المجتمع"
    >
      <p className="text-[10px] tracking-widest text-[#8c7851]/70 uppercase">
        من قلوبهم
      </p>
      <Link
        href={`/shared/${current.slug}`}
        className="block space-y-3 hover:opacity-90"
      >
        <p className="text-lg sm:text-xl leading-relaxed text-[#2f2619] font-serif">
          &ldquo;{current.content}&rdquo;
        </p>
        <p className="text-xs text-[#8c7851]">
          — {current.attribution ?? "قارئ تمعّن"}
        </p>
      </Link>
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`رؤية ${i + 1}`}
              className={
                "h-1.5 w-1.5 rounded-full transition-colors " +
                (i === active ? "bg-[#5a4a35]" : "bg-[#c9bda8]/50")
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
