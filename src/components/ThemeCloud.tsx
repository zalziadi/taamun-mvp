"use client";

type ThemeCount = {
  theme: string;
  count: number;
};

interface ThemeCloudProps {
  themes: ThemeCount[];
}

const THEME_COLORS = [
  "bg-blue-500/20 text-blue-300",
  "bg-amber-500/20 text-amber-300",
  "bg-emerald-500/20 text-emerald-300",
  "bg-purple-500/20 text-purple-300",
  "bg-rose-500/20 text-rose-300",
  "bg-cyan-500/20 text-cyan-300",
  "bg-orange-500/20 text-orange-300",
];

export function ThemeCloud({ themes }: ThemeCloudProps) {
  if (themes.length === 0) return null;

  const maxCount = Math.max(...themes.map((t) => t.count));

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-widest text-white/40">المواضيع المتكررة</p>
      <div className="flex flex-wrap gap-2">
        {themes.map((t, i) => {
          const scale = 0.75 + (t.count / maxCount) * 0.5;
          const colorClass = THEME_COLORS[i % THEME_COLORS.length];
          return (
            <span
              key={t.theme}
              className={`rounded-xl px-3 py-1.5 font-medium ${colorClass}`}
              style={{ fontSize: `${scale}rem` }}
            >
              {t.theme}
              <span className="mr-1 text-[0.65em] opacity-60">×{t.count}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
