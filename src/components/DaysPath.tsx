"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Progress = {
  current_day: number;
  completed_days: number[];
};

export default function DaysPath() {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    fetch("/api/progress")
      .then((res) => res.json())
      .then((data) => setProgress(data as Progress))
      .catch(() => setProgress({ current_day: 1, completed_days: [] }));
  }, []);

  if (!progress) return null;

  const totalDays = 28;

  return (
    <section className="days-section">
      <div className="days-inner">
        <h2 className="days-title">٢٨ يوم</h2>
        <p className="days-sub">رحلتك الحالية</p>

        <div className="days-grid">
          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1;
            const isCompleted = progress.completed_days.includes(day);
            const isCurrent = day === progress.current_day;
            const isLocked = day > progress.current_day;

            return (
              <div
                key={i}
                className={`day-node ${
                  isCompleted ? "completed" : ""
                } ${isCurrent ? "current" : ""} ${isLocked ? "locked" : ""}`}
                onClick={() => {
                  if (!isLocked) {
                    router.push(`/day/${day}`);
                  }
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
