"use client";

type ProgramProgressBarProps = {
  completedCount: number;
  totalDays?: number;
  percent?: number;
};

export function ProgramProgressBar({
  completedCount,
  totalDays = 28,
  percent,
}: ProgramProgressBarProps) {
  const width = Math.max(0, Math.min(100, percent ?? Math.round((completedCount / totalDays) * 100)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted">نسبة الإنجاز</div>
        <div className="text-sm font-semibold text-text">
          {completedCount} / {totalDays} ({width}%)
        </div>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-panel2">
        <div className="h-full bg-gold transition-all" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
