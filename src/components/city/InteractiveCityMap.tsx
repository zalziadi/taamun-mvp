"use client";

import { useMemo } from "react";
import {
  LIFE_DOMAINS,
  getDomainState,
  type AwarenessState,
  type DomainKey,
} from "@/lib/city-of-meaning";

// ─── Types ────────────────────────────────────────────────────────────────────

type TrackerEntry = { day: number; state: AwarenessState };

type DomainVisual = {
  key: DomainKey;
  title: string;
  hint: string;
  state: AwarenessState | "locked";
  completedDays: number;
  totalDays: number;
  cx: number;
  cy: number;
  icon: string;
};

type Props = {
  entries: TrackerEntry[];
  completedDays: number[];
  activeDomain: DomainKey | null;
  onDomainClick: (key: DomainKey) => void;
};

// ─── SVG Icon paths ──────────────────────────────────────────────────────────

const ICON_PATHS: Record<string, string> = {
  fingerprint:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z",
  people:
    "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z",
  trending:
    "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z",
  building:
    "M12 3L2 12h3v8h14v-8h3L12 3zm0 12.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 10.5 12 10.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  sparkle:
    "M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z",
  home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  mirror:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86z",
  coins:
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.94s4.18 1.36 4.18 3.85c-.01 1.83-1.38 2.83-3.12 3.19z",
  heart:
    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
};

// ─── Visual constants ─────────────────────────────────────────────────────────

const CENTER_X = 200;
const CENTER_Y = 200;
const ORBIT_RX = 145;
const ORBIT_RY = 135;
const NODE_R_DEFAULT = 28;
const NODE_R_ACTIVE = 34;

const STATE_COLORS = {
  locked: { fill: "#1a1610", stroke: "#3d3226", glow: "transparent" },
  shadow: { fill: "#2a2118", stroke: "#5a4a38", glow: "#5a4a3844" },
  gift: { fill: "#4a3d2a", stroke: "#c4a265", glow: "#c4a26555" },
  best_possibility: { fill: "#6b5830", stroke: "#e7c468", glow: "#e7c468aa" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function InteractiveCityMap({
  entries,
  completedDays,
  activeDomain,
  onDomainClick,
}: Props) {
  const domains: DomainVisual[] = useMemo(() => {
    return LIFE_DOMAINS.map((d, i) => {
      const angle = (Math.PI * 2 * i) / LIFE_DOMAINS.length - Math.PI / 2;
      const cx = CENTER_X + Math.cos(angle) * ORBIT_RX;
      const cy = CENTER_Y + Math.sin(angle) * ORBIT_RY;
      const ds = getDomainState(d.days, entries);

      return {
        key: d.key as DomainKey,
        title: d.title,
        hint: d.hint,
        state: ds.state,
        completedDays: ds.completedDays,
        totalDays: ds.totalDays,
        cx,
        cy,
        icon: d.icon,
      };
    });
  }, [entries]);

  const totalCompleted = completedDays.length;
  const illuminatedCount = domains.filter(
    (d) => d.state === "gift" || d.state === "best_possibility"
  ).length;
  const fullyLitCount = domains.filter(
    (d) => d.state === "best_possibility"
  ).length;
  const allComplete = fullyLitCount === LIFE_DOMAINS.length;

  // Center glow intensity: 0 = no progress, 1 = fully illuminated
  const centerIntensity = LIFE_DOMAINS.length > 0
    ? (illuminatedCount * 0.5 + fullyLitCount * 0.5) / LIFE_DOMAINS.length
    : 0;

  return (
    <svg
      viewBox="0 0 400 400"
      className="w-full h-auto max-w-[420px] mx-auto"
      role="img"
      aria-label="خريطة مدينة المعنى التفاعلية"
    >
      <defs>
        {/* Center glow */}
        <radialGradient id="cityCore" cx="50%" cy="50%" r="50%">
          <stop
            offset="0%"
            stopColor="#e7c468"
            stopOpacity={0.15 + centerIntensity * 0.65}
          />
          <stop
            offset="60%"
            stopColor="#c4a265"
            stopOpacity={0.05 + centerIntensity * 0.2}
          />
          <stop offset="100%" stopColor="#c4a265" stopOpacity="0" />
        </radialGradient>

        {/* Domain glow filters */}
        <filter id="glow-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-gift" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-best" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Orbit dashed circle */}
        <circle
          id="orbitPath"
          cx={CENTER_X}
          cy={CENTER_Y}
          r={(ORBIT_RX + ORBIT_RY) / 2}
          fill="none"
        />
      </defs>

      {/* Background */}
      <rect width="400" height="400" fill="transparent" />

      {/* Orbit circle (dashed) */}
      <ellipse
        cx={CENTER_X}
        cy={CENTER_Y}
        rx={ORBIT_RX}
        ry={ORBIT_RY}
        fill="none"
        stroke="#3d3226"
        strokeWidth="1"
        strokeDasharray="4 6"
        opacity={0.4}
      />

      {/* Center glow circle */}
      <circle
        cx={CENTER_X}
        cy={CENTER_Y}
        r={80}
        fill="url(#cityCore)"
        className={allComplete ? "city-core-pulse" : ""}
      />

      {/* Connection lines from center to each domain */}
      {domains.map((d) => {
        const colors = STATE_COLORS[d.state];
        return (
          <line
            key={`line-${d.key}`}
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={d.cx}
            y2={d.cy}
            stroke={colors.stroke}
            strokeWidth={d.state === "best_possibility" ? 1.5 : 0.8}
            strokeDasharray={d.state === "locked" ? "3 5" : "none"}
            opacity={d.state === "locked" ? 0.25 : 0.6}
          />
        );
      })}

      {/* Domain nodes */}
      {domains.map((d) => {
        const isActive = d.key === activeDomain;
        const r = isActive ? NODE_R_ACTIVE : NODE_R_DEFAULT;
        const colors = STATE_COLORS[d.state];
        const glowFilter =
          d.state === "best_possibility"
            ? "url(#glow-best)"
            : d.state === "gift"
            ? "url(#glow-gift)"
            : d.state === "shadow"
            ? "url(#glow-shadow)"
            : undefined;

        return (
          <g
            key={d.key}
            onClick={() => onDomainClick(d.key)}
            className="cursor-pointer"
            role="button"
            aria-label={`${d.title} — ${d.state === "locked" ? "مقفل" : d.state === "shadow" ? "ظل" : d.state === "gift" ? "هدية" : "أفضل احتمال"}`}
          >
            {/* Outer glow ring for gift/best */}
            {(d.state === "gift" || d.state === "best_possibility") && (
              <circle
                cx={d.cx}
                cy={d.cy}
                r={r + 8}
                fill="none"
                stroke={colors.glow}
                strokeWidth={d.state === "best_possibility" ? 2.5 : 1.5}
                className={
                  d.state === "best_possibility"
                    ? "city-node-pulse-best"
                    : "city-node-pulse-gift"
                }
                filter={glowFilter}
              />
            )}

            {/* Node background */}
            <circle
              cx={d.cx}
              cy={d.cy}
              r={r}
              fill={colors.fill}
              stroke={isActive ? "#e7c468" : colors.stroke}
              strokeWidth={isActive ? 2.5 : 1.5}
              filter={glowFilter}
            />

            {/* Progress arc (mini ring around node) */}
            {d.totalDays > 0 && d.completedDays > 0 && (
              <circle
                cx={d.cx}
                cy={d.cy}
                r={r + 3}
                fill="none"
                stroke={
                  d.state === "best_possibility"
                    ? "#e7c468"
                    : d.state === "gift"
                    ? "#c4a265"
                    : "#5a4a38"
                }
                strokeWidth="2"
                strokeDasharray={`${(d.completedDays / d.totalDays) * 2 * Math.PI * (r + 3)} ${2 * Math.PI * (r + 3)}`}
                strokeDashoffset={0.25 * 2 * Math.PI * (r + 3)}
                strokeLinecap="round"
                opacity={0.8}
              />
            )}

            {/* Icon */}
            <g
              transform={`translate(${d.cx - 10}, ${d.cy - 16}) scale(0.83)`}
              fill={
                d.state === "best_possibility"
                  ? "#e7c468"
                  : d.state === "gift"
                  ? "#c4a265"
                  : d.state === "shadow"
                  ? "#7d6b52"
                  : "#4a4038"
              }
              opacity={d.state === "locked" ? 0.35 : 0.9}
            >
              <path d={ICON_PATHS[d.icon] ?? ICON_PATHS.sparkle} />
            </g>

            {/* Domain title */}
            <text
              x={d.cx}
              y={d.cy + r + 16}
              textAnchor="middle"
              className="text-[10px] font-semibold"
              fill={
                d.state === "best_possibility"
                  ? "#e7c468"
                  : d.state === "gift"
                  ? "#c4a265"
                  : d.state === "shadow"
                  ? "#8a7b66"
                  : "#5a5044"
              }
            >
              {d.title}
            </text>
          </g>
        );
      })}

      {/* Center core node */}
      <g>
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={allComplete ? 42 : 36}
          fill={allComplete ? "#6b5830" : "#D6D1C8"}
          stroke={allComplete ? "#e7c468" : "#4a3d2a"}
          strokeWidth={allComplete ? 3 : 2}
          className={allComplete ? "city-core-pulse" : ""}
        />

        {/* Center icon: city/castle */}
        <g
          transform={`translate(${CENTER_X - 12}, ${CENTER_Y - 16}) scale(1)`}
          fill={allComplete ? "#e7c468" : "#8a7b66"}
        >
          <path d={ICON_PATHS.building} />
        </g>

        <text
          x={CENTER_X}
          y={CENTER_Y + 14}
          textAnchor="middle"
          className="text-[8px]"
          fill={allComplete ? "#e7c468" : "#6b5d4a"}
        >
          {allComplete ? "مضيئة" : "مدينة المعنى"}
        </text>
      </g>

      {/* Completion badge */}
      {totalCompleted > 0 && (
        <g>
          <text
            x={CENTER_X}
            y={380}
            textAnchor="middle"
            className="text-[11px] font-semibold"
            fill="#c4a265"
          >
            {totalCompleted}/28 يوم
          </text>
        </g>
      )}
    </svg>
  );
}
