"use client";

import { useEffect } from "react";
import { useProgressStore } from "@/store/useProgressStore";

export function HydrateGate({ children }: { children: React.ReactNode }) {
  const hydrate = useProgressStore((s) => s.hydrate);
  const hydrated = useProgressStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  return <>{children}</>;
}
