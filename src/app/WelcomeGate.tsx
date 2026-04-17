"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { JourneyLanding } from "./JourneyLanding";

/**
 * Thin client gate — checks localStorage for welcome redirect.
 * Renders JourneyLanding if already welcomed, redirects to /welcome otherwise.
 */
export function WelcomeGate() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [welcomed, setWelcomed] = useState(false);

  useEffect(() => {
    const hasWelcomed = localStorage.getItem("taamun.welcomed");
    const skipWelcome = new URLSearchParams(window.location.search).has("skip");

    if (skipWelcome) {
      localStorage.setItem("taamun.welcomed", "true");
      setWelcomed(true);
    } else if (hasWelcomed) {
      setWelcomed(true);
    } else {
      router.replace("/welcome");
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) {
    // Show JourneyLanding immediately to avoid blank flash (SSR content)
    return <JourneyLanding />;
  }

  if (welcomed) {
    return <JourneyLanding />;
  }

  return null;
}
