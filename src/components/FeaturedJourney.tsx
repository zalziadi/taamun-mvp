"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Featured {
  slug: string;
  title: string;
  description: string;
  duration_days: number;
  creator_display_name: string;
  subscriber_count: number;
}

/**
 * Homepage spotlight for the top published creator journey. Silent when
 * no journey has traction yet. Client-side fetch keeps the homepage
 * static.
 */
export function FeaturedJourney() {
  const [item, setItem] = useState<Featured | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/discover/featured", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.ok && data.journey) setItem(data.journey as Featured);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!item) return null;

  return (
    <section
      className="mx-auto w-full max-w-2xl px-5 py-10 text-center space-y-4"
      dir="rtl"
      aria-label="رحلة مميّزة من مبدع"
    >
      <p className="text-[10px] tracking-widest text-[#8c7851]/70 uppercase">
        رحلة مميّزة من مبدع في تمعّن
      </p>
      <Link
        href={`/journey/${item.slug}`}
        className="tm-card block p-6 sm:p-8 text-right space-y-3 hover:bg-[#fdfbf6] transition-colors"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#2f2619] leading-tight">
            {item.title}
          </h2>
          <span className="text-[10px] text-[#8c7851] shrink-0">
            {item.duration_days} يوم
          </span>
        </div>
        <p className="text-sm text-[#3d342a] leading-relaxed line-clamp-3">
          {item.description}
        </p>
        <div className="flex items-center justify-between pt-1 text-[11px] text-[#8c7851]">
          <span>بقلم {item.creator_display_name}</span>
          <span>
            {item.subscriber_count > 0 ? `${item.subscriber_count} مشترك` : "جديدة"}
          </span>
        </div>
      </Link>
      <Link
        href="/discover"
        className="inline-block text-xs text-[#5a4a35] underline hover:no-underline"
      >
        رحلات أخرى في الاستكشاف →
      </Link>
    </section>
  );
}
