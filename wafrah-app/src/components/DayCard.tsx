"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { DayContent } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DayCardProps {
  day: DayContent;
  unlocked: boolean;
  completed: boolean;
  index: number;
}

export function DayCard({ day, unlocked, completed, index }: DayCardProps) {
  const Wrapper = unlocked ? Link : "div";
  const wrapperProps = unlocked ? { href: `/day/${day.id}` } : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
    >
      <Wrapper
        {...(wrapperProps as { href: string })}
        aria-disabled={!unlocked}
        className={cn(
          "group relative block rounded-xl2 border bg-white p-5 shadow-soft transition",
          unlocked
            ? "border-ink-200 hover:-translate-y-0.5 hover:shadow-ring hover:border-wafrah-300"
            : "border-ink-100 cursor-not-allowed opacity-60",
          completed && "ring-1 ring-wafrah-300 border-wafrah-200"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-wafrah-700">
              {day.phaseLabel} · {day.phaseRange}
            </span>
            <h3 className="text-lg font-semibold text-ink-900 leading-tight">
              اليوم {day.id} — {day.title}
            </h3>
          </div>
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
              completed
                ? "bg-wafrah-600 text-white"
                : unlocked
                  ? "bg-wafrah-100 text-wafrah-700"
                  : "bg-ink-100 text-ink-400"
            )}
            aria-hidden
          >
            {completed ? "✓" : day.id}
          </div>
        </div>

        <p className="mt-3 text-sm text-ink-600 leading-relaxed line-clamp-2">{day.intro}</p>

        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-ink-400">
            {completed ? "مكتمل" : unlocked ? "متاح الآن" : "مقفل"}
          </span>
          {unlocked && (
            <span className="font-medium text-wafrah-700 group-hover:translate-x-[-2px] transition-transform">
              ادخل ←
            </span>
          )}
        </div>
      </Wrapper>
    </motion.div>
  );
}
