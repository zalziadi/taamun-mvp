"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/journey", label: "الرحلة" },
  { href: "/progress", label: "تقدمي" },
  { href: "/reflection", label: "التأملات" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-wafrah-500 to-wafrah-700 text-white text-sm font-bold shadow-soft">
            و
          </span>
          <span className="text-base font-semibold text-ink-900 tracking-tight">
            لمة وفرة
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition",
                  active
                    ? "bg-wafrah-100 text-wafrah-800 font-medium"
                    : "text-ink-600 hover:text-ink-900 hover:bg-ink-50"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
