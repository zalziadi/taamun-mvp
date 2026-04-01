"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface DailyHintProps {
  cycleDay: number;
}

export function DailyHint({ cycleDay }: DailyHintProps) {
  const [hint, setHint] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (cycleDay <= 1) return; // no hint for day 1

    let cancelled = false;

    async function fetchHint() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || cancelled) return;

      // Get yesterday's hint (cycle_day - 1)
      const { data } = await supabase
        .from("pattern_insights")
        .select("daily_hint")
        .eq("user_id", session.user.id)
        .eq("cycle_day", cycleDay - 1)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cancelled && data?.daily_hint) {
        setHint(data.daily_hint);
      }
    }

    fetchHint();
    return () => { cancelled = true; };
  }, [cycleDay]);

  if (!hint || dismissed) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-amber-400/80">✦</span>
          <p className="text-sm leading-relaxed text-white/70">{hint}</p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-xs text-white/30 hover:text-white/50 transition-colors"
          aria-label="إخفاء التلميح"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
