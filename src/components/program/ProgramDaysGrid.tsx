"use client";

import { useRouter } from "next/navigation";
import { programDayRoute } from "@/lib/routes";

type ProgramDaysGridProps = {
  totalDays?: number;
  currentDay: number;
  completedDays: number[];
};

export function ProgramDaysGrid({
  totalDays = 28,
  currentDay,
  completedDays,
}: ProgramDaysGridProps) {
  const router = useRouter();
  const completedSet = new Set(completedDays);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {Array.from({ length: totalDays }, (_, index) => {
        const day = index + 1;
        const isDone = completedSet.has(day);
        const isLocked = day > currentDay;

        return (
          <button
            key={day}
            type="button"
            onClick={() => router.push(programDayRoute(day))}
            className={[
              "focus-ring rounded-xl border p-3 text-center transition-colors",
              isDone
                ? "border-gold bg-gold/10 text-gold"
                : isLocked
                  ? "border-border bg-panel2 text-muted"
                  : "border-border bg-panel text-text hover:bg-panel2",
            ].join(" ")}
          >
            <div className="text-xs font-medium">اليوم</div>
            <div className="mt-1 text-lg font-semibold">{day}</div>
            <div className="mt-1 text-xs">
              {isDone ? "مكتمل" : isLocked ? "مغلق" : "متاح"}
            </div>
          </button>
        );
      })}
    </div>
  );
}
