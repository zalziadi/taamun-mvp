"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSystemBrain } from "@/hooks/useSystemBrain";

// ── Searchable routes catalog ──
type SearchEntry = {
  label: string;       // main Arabic label
  keywords: string[];  // alternative search terms
  route: string;
  category: "صفحة" | "يوم" | "أداة";
};

const ROUTES: SearchEntry[] = [
  { label: "الرئيسية", keywords: ["رئيسية", "home"], route: "/", category: "صفحة" },
  { label: "البرنامج", keywords: ["برنامج", "الأيام", "28", "٢٨"], route: "/program", category: "صفحة" },
  { label: "الرحلة", keywords: ["رحلة", "منحنى", "الوعي", "تقدم"], route: "/journey", category: "صفحة" },
  { label: "التمعّن", keywords: ["تمعن", "تأمل", "كتابة", "reflection"], route: "/reflection", category: "صفحة" },
  { label: "المدينة", keywords: ["مدينة", "مناطق", "city"], route: "/city", category: "صفحة" },
  { label: "المرشد الذكي", keywords: ["مرشد", "guide", "ai"], route: "/guide", category: "أداة" },
  { label: "وضع القرار", keywords: ["قرار", "decision", "dpos"], route: "/decision", category: "أداة" },
  { label: "كهفي", keywords: ["حساب", "account", "ملف"], route: "/account", category: "صفحة" },
  { label: "الدفتر", keywords: ["دفتر", "journal", "ملاحظات"], route: "/journal", category: "صفحة" },
  { label: "المسبحة", keywords: ["مسبحة", "ذكر", "tasbeeh"], route: "/tasbeeh", category: "أداة" },
  { label: "الكتاب", keywords: ["كتاب", "book", "فصول"], route: "/book", category: "صفحة" },
  { label: "المصادر", keywords: ["مصادر", "sources"], route: "/sources", category: "صفحة" },
  { label: "الأسعار", keywords: ["اشتراك", "pricing", "سعر"], route: "/pricing", category: "صفحة" },
  { label: "تنفس", keywords: ["breathing", "تمرين"], route: "/breathing", category: "أداة" },
  // Days 1-28
  ...Array.from({ length: 28 }, (_, i) => ({
    label: `اليوم ${i + 1}`,
    keywords: [`يوم ${i + 1}`, `day ${i + 1}`, `${i + 1}`],
    route: `/program/day/${i + 1}`,
    category: "يوم" as const,
  })),
];

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[ًٌٍَُِّْـ]/g, "");
}

function fuzzyMatch(entry: SearchEntry, query: string): number {
  if (!query) return 0;
  const q = normalize(query);
  const label = normalize(entry.label);

  if (label === q) return 100;
  if (label.startsWith(q)) return 90;
  if (label.includes(q)) return 80;

  for (const kw of entry.keywords) {
    const nk = normalize(kw);
    if (nk === q) return 85;
    if (nk.startsWith(q)) return 75;
    if (nk.includes(q)) return 60;
  }
  return 0;
}

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // V8: Brain suggestion — shown at top when query is empty
  const { decision: brainDecision } = useSystemBrain({ pageName: "searchbox" });

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: "/" to focus search (like GitHub)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) {
      // Show top 6 popular routes when empty
      return ROUTES.filter((r) => r.category !== "يوم").slice(0, 6);
    }
    return ROUTES
      .map((r) => ({ entry: r, score: fuzzyMatch(r, query) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.entry);
  }, [query]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[highlight];
      if (target) {
        router.push(target.route);
        setOpen(false);
        setQuery("");
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-[#d8cdb9] bg-[#fcfaf7]/80 px-3 py-2.5 focus-within:border-[#C9A84C]/60 focus-within:ring-2 focus-within:ring-[#C9A84C]/20 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#C9A84C]/70" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder="ابحث..."
          aria-label="ابحث في الموقع"
          className="w-28 sm:w-40 bg-transparent text-sm text-[#14110F] placeholder:text-[#C9A84C]/60 outline-none"
        />
        <kbd className="hidden sm:inline-block rounded border border-[#d8cdb9] bg-[#0A0908] px-1 text-xs text-[#C9A84C]/70 font-mono">/</kbd>
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full right-0 mt-2 w-[min(92vw,320px)] rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] shadow-[0_12px_32px_rgba(47,38,25,0.12)] overflow-hidden z-50">
          {/* V8: Brain suggestion at the top when query is empty */}
          {!query.trim() && brainDecision && (
            <Link
              href={brainDecision.primaryAction.target}
              onClick={() => { setOpen(false); setQuery(""); }}
              className="block border-b border-[#e8dfc9] bg-gradient-to-b from-[#faf4e4] to-[#fcfaf7] px-3 py-3 transition-colors hover:bg-[#f4ead7]"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[9px] tracking-[0.15em] text-[#C9A84C]/80">اقتراح النظام</span>
                <span className="text-xs text-[#c4a265]">✦</span>
              </div>
              <p className="text-xs text-[#A8A29A] leading-relaxed text-right">{brainDecision.message}</p>
              <p className="mt-1.5 text-[13px] font-semibold text-[#5a4531] text-right">← {brainDecision.primaryAction.label}</p>
            </Link>
          )}

          <ul role="listbox" className="max-h-[320px] overflow-y-auto">
            {results.map((r, i) => (
              <li key={r.route}>
                <Link
                  href={r.route}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className={[
                    "flex items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors",
                    i === highlight
                      ? "bg-[#f4ead7] text-[#14110F]"
                      : "text-[#A8A29A] hover:bg-[#f9f3e7]",
                  ].join(" ")}
                  onMouseEnter={() => setHighlight(i)}
                >
                  <span className="text-xs text-[#C9A84C]/70">{r.category}</span>
                  <span className="flex-1 text-right">{r.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {open && results.length === 0 && query.trim() && (
        <div className="absolute top-full right-0 mt-2 w-[min(92vw,320px)] rounded-xl border border-[#d8cdb9] bg-[#fcfaf7] p-4 text-center text-xs text-[#7d7362] shadow-[0_12px_32px_rgba(47,38,25,0.12)] z-50">
          لا توجد نتائج لـ &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
