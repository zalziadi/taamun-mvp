"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/appConfig";
import { DAY1_ROUTE } from "@/lib/routes";

const SECTIONS = [
  { id: "journey", label: "الرحلة" },
  { id: "daily", label: "اليومي" },
  { id: "pricing", label: "الاشتراك" },
] as const;

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("journey");
  const [open, setOpen] = useState(false);

  const ids = useMemo(() => SECTIONS.map((s) => s.id), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (visible?.target?.id) setActive(visible.target.id);
      },
      {
        root: null,
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0.05, 0.1, 0.2, 0.35, 0.5, 0.7],
      }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ids]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function NavLinks({ onClick }: { onClick?: () => void }) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-[14px]">
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={onClick}
              className={cn(
                "transition-colors rounded-xl px-3 py-2",
                isActive
                  ? "text-[color:var(--ink)] font-semibold bg-white/25"
                  : "text-[color:var(--text-mid)] hover:text-[color:var(--ink)] hover:bg-white/20"
              )}
            >
              {s.label}
            </a>
          );
        })}
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50">
      <div
        className={cn(
          "mx-auto max-w-[1080px] px-5 sm:px-8 py-4",
          scrolled
            ? "bg-[color:var(--glass)] backdrop-blur-md border-b border-[color:var(--glass-border)]"
            : "bg-transparent"
        )}
      >
        <nav className="flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[color:var(--parchment-deep)] border border-[color:var(--glass-border)] grid place-items-center text-[color:var(--ink)] font-bold">
              ت
            </div>
            <div className="leading-tight">
              <div className="text-[13px] text-[color:var(--text-quiet)]">
                {APP_NAME}
              </div>
              <div className="font-amiri text-[18px] text-[color:var(--ink)]">
                {APP_NAME}
              </div>
            </div>
          </div>

          {/* Desktop links */}
          <div className="hidden sm:block">
            <NavLinks />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/activate"
              className="hidden sm:inline-flex rounded-xl px-4 py-2 text-[13px] border border-[color:var(--glass-border)] bg-white/30 hover:bg-white/45 text-[color:var(--ink)]"
            >
              لدي كود
            </Link>
            <Link
              href={DAY1_ROUTE}
              className="hidden sm:inline-flex rounded-xl px-4 py-2 text-[13px] bg-[color:var(--ink)] text-[color:var(--parchment)] hover:opacity-90"
            >
              ابدأ اليوم
            </Link>

            {/* Mobile menu button */}
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="sm:hidden rounded-xl px-3 py-2 border border-[color:var(--glass-border)] bg-white/30 hover:bg-white/45 text-[color:var(--ink)]"
            >
              ☰
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-[60]">
          <button
            aria-label="Close menu overlay"
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-3 left-3 right-3 rounded-3xl border border-[color:var(--glass-border)] bg-[color:var(--parchment)] shadow-soft p-4">
            <div className="flex items-center justify-between">
              <div className="font-amiri text-[18px] text-[color:var(--ink)]">
                القائمة
              </div>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 border border-[color:var(--glass-border)] bg-white/30 text-[color:var(--ink)]"
              >
                ✕
              </button>
            </div>

            <div className="mt-3">
              <NavLinks onClick={() => setOpen(false)} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <Link
                href={DAY1_ROUTE}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-5 py-3 bg-[color:var(--ink)] text-[color:var(--parchment)] text-[14px] text-center hover:opacity-90"
              >
                ابدأ اليوم
              </Link>
              <Link
                href="/activate"
                onClick={() => setOpen(false)}
                className="rounded-2xl px-5 py-3 border border-[color:var(--glass-border)] bg-white/30 text-[color:var(--ink)] text-[14px] text-center hover:bg-white/45"
              >
                لدي كود
              </Link>
              <Link
                href="/progress"
                onClick={() => setOpen(false)}
                className="rounded-2xl px-5 py-3 border border-[color:var(--glass-border)] bg-white/10 text-[color:var(--ink)] text-[14px] text-center hover:bg-white/20"
              >
                تقدمك
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
