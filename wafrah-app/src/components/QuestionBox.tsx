"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface QuestionBoxProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  minLength?: number;
}

export function QuestionBox({
  label,
  hint,
  value,
  onChange,
  placeholder,
  rows = 5,
  minLength = 0,
}: QuestionBoxProps) {
  const [focused, setFocused] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!value) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSavedFlash(true);
      const t = setTimeout(() => setSavedFlash(false), 1200);
      return () => clearTimeout(t);
    }, 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value]);

  const remaining = Math.max(0, minLength - value.trim().length);

  return (
    <label className="block">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-ink-800">{label}</span>
        {savedFlash && <span className="text-xs text-wafrah-600">حُفظ تلقائياً</span>}
      </div>
      {hint && <p className="text-xs text-ink-400 mb-2 leading-relaxed">{hint}</p>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "block w-full resize-y rounded-xl border bg-white px-4 py-3 text-base leading-relaxed text-ink-900 placeholder:text-ink-400 transition",
          "focus:outline-none focus:ring-4 focus:ring-wafrah-500/15 focus:border-wafrah-500",
          focused ? "border-wafrah-400" : "border-ink-200"
        )}
      />
      {minLength > 0 && remaining > 0 && (
        <p className="mt-1 text-xs text-ink-400">اكتب {remaining} حرف على الأقل لإكمال اليوم.</p>
      )}
    </label>
  );
}
