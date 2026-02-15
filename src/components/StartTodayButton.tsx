"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

const DAY_PATH = "/day";

export function StartTodayButton() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (hasSession === null) return;
    router.push(hasSession ? DAY_PATH : "/auth");
  };

  return (
    <button
      onClick={handleClick}
      className="rounded-xl bg-white px-10 py-4 font-bold text-[#0B0F14] transition-colors hover:bg-white/90"
    >
      {hasSession === null ? "جاري..." : "ابدأ اليوم"}
    </button>
  );
}
