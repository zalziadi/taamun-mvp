"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface CompanionVerseProps {
  cycleDay: number;
}

export function CompanionVerse({ cycleDay }: CompanionVerseProps) {
  const [verse, setVerse] = useState<{ text: string; ref: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (cycleDay <= 1) return;
    let cancelled = false;

    async function fetchVerse() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || cancelled) return;

      const { data } = await supabase
        .from("pattern_insights")
        .select("companion_verse, companion_verse_ref")
        .eq("user_id", session.user.id)
        .eq("cycle_day", cycleDay - 1)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cancelled && data?.companion_verse) {
        setVerse({ text: data.companion_verse, ref: data.companion_verse_ref ?? "" });
      }
    }

    fetchVerse();
    return () => { cancelled = true; };
  }, [cycleDay]);

  if (!verse || dismissed) return null;

  return (
    <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.03] p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs text-amber-400/50">آية لك</p>
          <p className="text-base leading-loose text-white/80">﴿ {verse.text} ﴾</p>
          {verse.ref && <p className="text-xs text-amber-400/40">{verse.ref}</p>}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-xs text-white/30 hover:text-white/50 transition-colors"
          aria-label="إخفاء الآية"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
