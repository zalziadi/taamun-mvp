"use client";

type DepthPoint = {
  cycle_day: number;
  depth_score: number;
};

interface DepthChartProps {
  points: DepthPoint[];
}

export function DepthChart({ points }: DepthChartProps) {
  if (points.length < 2) return null;

  const sorted = [...points].sort((a, b) => a.cycle_day - b.cycle_day);

  const W = 600;
  const H = 160;
  const PAD_X = 30;
  const PAD_Y = 20;
  const chartW = W - PAD_X * 2;
  const chartH = H - PAD_Y * 2;

  function x(day: number) {
    return PAD_X + ((day - 1) / 27) * chartW;
  }
  function y(score: number) {
    return PAD_Y + chartH - (score / 100) * chartH;
  }

  // Build SVG path
  const pathD = sorted
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.cycle_day).toFixed(1)} ${y(p.depth_score).toFixed(1)}`)
    .join(" ");

  // Filled area
  const areaD = `${pathD} L ${x(sorted[sorted.length - 1].cycle_day).toFixed(1)} ${H - PAD_Y} L ${x(sorted[0].cycle_day).toFixed(1)} ${H - PAD_Y} Z`;

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-widest text-white/40">منحنى عمق التمعّن</p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="رسم بياني لعمق التمعّن عبر الأيام"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line
              x1={PAD_X} y1={y(v)} x2={W - PAD_X} y2={y(v)}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1"
            />
            <text x={PAD_X - 4} y={y(v) + 3} textAnchor="end"
              fill="rgba(255,255,255,0.2)" fontSize="8">
              {v}
            </text>
          </g>
        ))}

        {/* Filled area */}
        <path d={areaD} fill="url(#depthGrad)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="hsl(222 60% 60%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {sorted.map((p) => (
          <circle key={p.cycle_day} cx={x(p.cycle_day)} cy={y(p.depth_score)} r="3"
            fill="hsl(222 60% 70%)" stroke="hsl(222 47% 7%)" strokeWidth="1.5" />
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="depthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(222 60% 60%)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="hsl(222 60% 60%)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
