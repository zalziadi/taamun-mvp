"use client";

import { useEffect, useState } from "react";
import { HomeClient } from "./HomeClient";
import { useRouter } from "next/navigation";

/**
 * HomeClientWrapper — thin client island that checks auth.
 * If authenticated: renders HomeClient dashboard (overlays the server-rendered landing).
 * If not: renders nothing (landing page stays visible underneath).
 *
 * This allows the homepage to be STATIC (cached on CDN) while still
 * showing the dashboard for authenticated users.
 */
export function HomeClientWrapper() {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Fast check: does an auth token exist in localStorage?
    const hasToken = Object.keys(localStorage).some(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
    );

    if (hasToken) {
      setShow(true);
    } else {
      // Check welcome gate
      const welcomed = localStorage.getItem("taamun.welcomed");
      const skipWelcome = new URLSearchParams(window.location.search).has("skip");
      if (skipWelcome) {
        localStorage.setItem("taamun.welcomed", "true");
      } else if (!welcomed) {
        router.replace("/welcome");
      }
    }
  }, [router]);

  if (!show) return null;

  // Render HomeClient on top of the landing (landing is behind)
  return (
    <div className="fixed inset-0 z-30 overflow-auto bg-[#f4f1ea]">
      <HomeClient />
    </div>
  );
}
