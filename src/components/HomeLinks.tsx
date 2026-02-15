"use client";

import Link from "next/link";
import { hasPlan820 } from "../features/scan";

/** Renders premium links (e.g. scan) only when user has access */
export function HomeLinks() {
  if (!hasPlan820()) return null;
  return (
    <Link
      href="/scan"
      className="rounded-xl border border-white/20 bg-white/5 px-10 py-4 text-white transition-colors hover:bg-white/10"
    >
      مسح آية
    </Link>
  );
}
