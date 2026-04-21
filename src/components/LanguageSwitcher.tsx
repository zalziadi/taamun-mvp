"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Minimal AR ↔ EN switcher. Only shows one link at a time — the
 * language opposite to the current path. Scope for v2.0 is limited
 * to public pages with an English counterpart:
 *   `/` ↔ `/en`
 *   `/faq` ↔ `/en/faq`
 * Any other path falls back to linking between `/` and `/en`.
 */
export function LanguageSwitcher() {
  const pathname = usePathname() ?? "/";

  const onEnglishPage = pathname === "/en" || pathname.startsWith("/en/");

  // Derive the canonical counterpart path.
  let target = "/";
  let label = "العربية";
  let ariaLabel = "عرض الصفحة بالعربية";
  let hreflang: "ar" | "en" = "ar";

  if (onEnglishPage) {
    if (pathname === "/en") target = "/";
    else if (pathname === "/en/faq") target = "/faq";
    else target = "/"; // no mirror → send them to the Arabic home
    label = "العربية";
    ariaLabel = "عرض الصفحة بالعربية";
    hreflang = "ar";
  } else {
    if (pathname === "/") target = "/en";
    else if (pathname === "/faq") target = "/en/faq";
    else target = "/en"; // no mirror → English landing
    label = "English";
    ariaLabel = "View in English";
    hreflang = "en";
  }

  return (
    <Link
      href={target}
      hrefLang={hreflang}
      aria-label={ariaLabel}
      className="text-[11px] uppercase tracking-widest text-[#8c7851] hover:text-[#5a4a35] transition-colors"
    >
      {label}
    </Link>
  );
}
