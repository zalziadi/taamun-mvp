"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between text-xs text-ink-600 mb-2">
        <span>{label ?? "تقدّمك في الرحلة"}</span>
        <span className="font-medium tabular-nums text-ink-800">{clamped}%</span>
      </div>
      <div
        className="relative h-2 w-full overflow-hidden rounded-full bg-ink-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
      >
        <motion.div
          className="absolute inset-y-0 right-0 bg-gradient-to-l from-wafrah-400 to-wafrah-600"
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ type: "spring", stiffness: 70, damping: 20 }}
        />
      </div>
    </div>
  );
}
