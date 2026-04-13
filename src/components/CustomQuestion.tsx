"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface CustomQuestionProps {
  cycleDay: number;
}

export function CustomQuestion({ cycleDay }: CustomQuestionProps) {
  const [question, setQuestion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (cycleDay <= 1) return;
    let cancelled = false;

    async function fetchQuestion() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || cancelled) return;

      const { data } = await supabase
        .from("pattern_insights")
        .select("custom_question")
        .eq("user_id", session.user.id)
        .eq("cycle_day", cycleDay - 1)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cancelled && data?.custom_question) {
        setQuestion(data.custom_question);
      }
    }

    fetchQuestion();
    return () => { cancelled = true; };
  }, [cycleDay]);

  if (!question || dismissed) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-white/40">◈</span>
          <div>
            <p className="mb-1 text-xs uppercase tracking-widest text-white/30">سؤال لك</p>
            <p className="text-sm leading-relaxed text-white/70">{question}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 text-xs text-white/30 hover:text-white/50 transition-colors"
          aria-label="إخفاء السؤال"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
