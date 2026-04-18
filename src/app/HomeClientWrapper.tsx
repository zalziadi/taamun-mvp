"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

/**
 * Lazy-load HomeClient only when user is authenticated.
 * Unauthenticated users never download HomeClient JS → smaller landing bundle.
 */
const HomeClient = dynamic(
  () => import("./HomeClient").then((mod) => ({ default: mod.HomeClient })),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0A0908]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9b88a] border-t-transparent" />
      </div>
    ),
  }
);

/**
 * HomeClientWrapper — thin client island (~1 kB).
 * Checks localStorage for auth token. Only loads HomeClient if authenticated.
 * Zero JS cost for the majority of visitors (unauthenticated landing viewers).
 */
export function HomeClientWrapper() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasToken = Object.keys(localStorage).some(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
    );
    if (hasToken) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-30 overflow-auto bg-[#0A0908]">
      <HomeClient />
    </div>
  );
}
