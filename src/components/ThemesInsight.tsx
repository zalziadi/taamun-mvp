"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Theme = {
  label: string;
  keywords: string[];
  reflection_count: number;
  sample_texts: string[];
  rank: number;
  generated_at: string;
};

/**
 * ThemesInsight — compact home widget showing the user's top recurring themes.
 * Pulls from /api/reflections/themes. Silent if user has < 3 themes yet.
 */
export function ThemesInsight({ compact = true }: { compact?: boolean }) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/reflections/themes")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.themes)) {
          setThemes(data.themes);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || themes.length === 0) return null;

  const display = compact ? themes.slice(0, 3) : themes;

  return (
    <section className="tm-card p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#5a4a35]">
          {compact ? "ما يتكرر في تأملاتك" : "المواضيع التي تعود إليها"}
        </h2>
        {compact && (
          <Link href="/insights" className="text-[10px] text-[#8c7851] hover:text-[#5a4a35]">
            كل المواضيع →
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {display.map((t) => (
          <div key={t.label} className="border-t border-[#d8cdb9] pt-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#2f2619]">{t.label}</p>
              <span className="text-[10px] text-[#8c7851]">{t.reflection_count} تأمل</span>
            </div>
            {t.keywords.length > 0 && (
              <p className="text-[11px] text-[#8c7851]">
                {t.keywords.join(" · ")}
              </p>
            )}
            {!compact && t.sample_texts.length > 0 && (
              <blockquote className="mt-2 text-xs leading-relaxed text-[#5f5648] italic">
                &ldquo;{t.sample_texts[0]}&rdquo;
              </blockquote>
            )}
          </div>
        ))}
      </div>

      {compact && (
        <p className="text-[10px] text-[#8c7851]/60 italic">
          استخرجها تمعّن من ما كتبته — تحدّث شهرياً.
        </p>
      )}
    </section>
  );
}
