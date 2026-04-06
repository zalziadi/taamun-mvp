"use client";

import { motion, AnimatePresence } from "framer-motion";
import { zoneVariants, glowRingVariants, focusVariants } from "./variants";
import type { ZoneState } from "@/lib/cityEngine";

interface Props {
  cx: number;
  cy: number;
  r: number;
  state: ZoneState;
  isFocused: boolean;
  name: string;
  signal: string;
  icon?: string;
  onClick?: () => void;
}

const STATE_COLORS: Record<ZoneState, { fill: string; stroke: string; glow: string; text: string }> = {
  weak: { fill: "#1a1610", stroke: "#3d3226", glow: "transparent", text: "#5a5044" },
  growing: { fill: "#2a2118", stroke: "#8a7b66", glow: "#8a7b6644", text: "#8a7b66" },
  stable: { fill: "#3d3226", stroke: "#c4a265", glow: "#c4a26555", text: "#c4a265" },
  thriving: { fill: "#4a3d2a", stroke: "#e7c468", glow: "#e7c468aa", text: "#e7c468" },
};

export default function ZoneNode({ cx, cy, r, state, isFocused, name, signal, onClick }: Props) {
  const colors = STATE_COLORS[state];
  const variant = zoneVariants[state];
  const glowVariant = glowRingVariants[state];

  return (
    <motion.g
      onClick={onClick}
      className="cursor-pointer"
      variants={focusVariants}
      animate={isFocused ? "focused" : "idle"}
      style={{ originX: `${cx}px`, originY: `${cy}px` }}
      role="button"
      aria-label={`${name} — ${state}`}
    >
      {/* Glow ring (outer) */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={r + 10}
        fill="none"
        stroke={colors.glow}
        strokeWidth={state === "thriving" ? 3 : 2}
        variants={glowVariant}
        animate="animate"
      />

      {/* Main node */}
      <motion.circle
        cx={cx}
        cy={cy}
        r={r}
        fill={colors.fill}
        stroke={isFocused ? "#e7c468" : colors.stroke}
        strokeWidth={isFocused ? 2.5 : 1.5}
        variants={variant}
        initial="initial"
        animate="animate"
      />

      {/* Zone name */}
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        className="text-[9px] font-semibold pointer-events-none select-none"
        fill={colors.text}
      >
        {name}
      </text>

      {/* State label below */}
      <text
        x={cx}
        y={cy + r + 14}
        textAnchor="middle"
        className="text-[7px] pointer-events-none select-none"
        fill={colors.text}
        opacity={0.7}
      >
        {state === "weak" ? "ضعيف" : state === "growing" ? "ينمو" : state === "stable" ? "مستقر" : "مزدهر"}
      </text>
    </motion.g>
  );
}
