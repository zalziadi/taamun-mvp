"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: "home" | "program" | "city" | "journey" | "reflection" | "sources" | "account" | "tasbeeh";
  activeWhen: (pathname: string) => boolean;
};

function NavGlyph({ name, className }: { name: NavItem["icon"]; className?: string }) {
  const cn = className ?? "h-5 w-5";
  const stroke = { strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "home":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
          <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-5v-7H10v7H5a1 1 0 0 1-1-1v-8.5z" />
        </svg>
      );
    case "program":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "city":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
          <path d="M3 21h18M5 21V7l4-2v16M9 21V5l4 2v14M13 21V9l4-2v14M17 21v-8l3-1v9" />
        </svg>
      );
    case "journey":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
          <path d="M3 17h4l3-8 4 10 3-6h4" />
          <circle cx="7" cy="17" r="1.25" fill="currentColor" stroke="none" />
          <circle cx="17" cy="13" r="1.25" fill="currentColor" stroke="none" />
        </svg>
      );
    case "reflection":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
          <path d="M12 3v2.5M12 18.5V21M4.22 4.22l1.77 1.77M17.99 17.99l1.79 1.79M3 12h2.5M18.5 12H21M4.22 19.78l1.77-1.77M17.99 6.01l1.79-1.79" />
          <circle cx="12" cy="12" r="3.25" />
        </svg>
      );
    case "sources":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
          <path d="M6 4h9a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2V6a2 2 0 0 1 2-2z" />
          <path d="M9 4v16a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2V8a4 4 0 0 0-4-4H9z" />
        </svg>
      );
    case "account":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
          <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
          <path d="M12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
        </svg>
      );
    case "tasbeeh":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden {...stroke}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="3" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}

function itemClass(active: boolean) {
  return [
    "flex min-w-[56px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 outline-none transition-colors duration-200 ease-out",
    "cursor-pointer [-webkit-tap-highlight-color:transparent]",
    "focus-visible:ring-2 focus-visible:ring-[#8c7851]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f1ea]",
    active ? "text-[#7b694a]" : "text-[#8b8172] opacity-70 hover:opacity-100",
  ].join(" ");
}

export function MobileBottomNav({ ramadanClosed: _unused }: { ramadanClosed: boolean }) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/", label: "الرئيسية", icon: "home", activeWhen: (p) => p === "/" },
    { href: "/program", label: "البرنامج", icon: "program", activeWhen: (p) => p.startsWith("/program") },
    { href: "/city", label: "المدينة", icon: "city", activeWhen: (p) => p.startsWith("/city") },
    { href: "/journey", label: "الرحلة", icon: "journey", activeWhen: (p) => p.startsWith("/journey") },
    { href: "/reflection", label: "التمعّن", icon: "reflection", activeWhen: (p) => p.startsWith("/reflection") },
    { href: "/account", label: "كهفي", icon: "account", activeWhen: (p) => p.startsWith("/account") },
  ];

  return (
    <nav
      aria-label="التنقل السفلي"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#ddd3c3] bg-[#f4f1ea]/95 px-2 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_32px_rgba(47,38,25,0.06)] backdrop-blur-[20px] md:hidden"
    >
      <div className="mx-auto flex w-full max-w-[440px] items-center justify-between gap-1">
        {items.map((item) => {
          const active = item.activeWhen(pathname);
          return (
            <Link key={item.href} href={item.href} className={itemClass(active)} aria-current={active ? "page" : undefined}>
              <NavGlyph name={item.icon} />
              <span className="max-w-[4.5rem] truncate text-[10px] font-medium leading-tight">{item.label}</span>
              <span
                className={
                  active ? "h-1 w-1 rounded-full bg-[#8c7851] shadow-[0_0_0_3px_rgba(140,120,81,0.2)]" : "h-1 w-1 rounded-full bg-transparent"
                }
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
