"use client";

type TimelineDay = {
  cycle_day: number;
  depth_score: number;
  shift_detected: boolean;
};

interface PatternTimelineProps {
  days: TimelineDay[];
  currentDay: number;
}

export function PatternTimeline({ days, currentDay }: PatternTimelineProps) {
  const dayMap = new Map(days.map((d) => [d.cycle_day, d]));

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-widest text-white/40">خط الرحلة</p>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {Array.from({ length: 28 }, (_, i) => {
          const dayNum = i + 1;
          const data = dayMap.get(dayNum);
          const isCurrent = dayNum === currentDay;
          const depth = data?.depth_score ?? 0;
          const heightPx = Math.max(8, Math.round((depth / 100) * 48));
          const isShift = data?.shift_detected ?? false;

          return (
            <div
              key={dayNum}
              className="flex flex-col items-center gap-1"
              title={data ? `يوم ${dayNum}: عمق ${depth}%` : `يوم ${dayNum}`}
            >
              <div
                className="w-3 rounded-sm transition-all"
                style={{
                  height: `${heightPx}px`,
                  backgroundColor: isShift
                    ? "hsl(42 86% 55%)"
                    : data
                      ? `hsl(222 60% ${35 + depth * 0.4}%)`
                      : "hsl(222 20% 15%)",
                  border: isCurrent ? "1px solid rgba(255,255,255,0.5)" : "none",
                }}
              />
              <span className={`text-[9px] ${isCurrent ? "text-white/80" : "text-white/25"}`}>
                {dayNum}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
