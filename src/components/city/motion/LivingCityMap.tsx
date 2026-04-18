"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { CityMap, CityZone } from "@/lib/cityEngine";
import type { MicroReward } from "@/lib/personalityEngine";
import AmbientLayer from "./AmbientLayer";
import ZoneNode from "./ZoneNode";
import RewardBurst from "./RewardBurst";
import { ambientFromEmotional } from "./types";
import type { AmbientConfig, RewardConfig } from "./types";

interface Props {
  city: CityMap;
  emotionalState?: "engaged" | "resistant" | "lost" | "curious";
  focusZoneId?: string | null;
  microReward?: MicroReward | null;
  onZoneClick?: (zoneId: string) => void;
}

const CENTER_X = 200;
const CENTER_Y = 200;
const ORBIT_RX = 140;
const ORBIT_RY = 130;
const NODE_R = 26;

function getZonePosition(index: number, total: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return {
    cx: CENTER_X + Math.cos(angle) * ORBIT_RX,
    cy: CENTER_Y + Math.sin(angle) * ORBIT_RY,
  };
}

export default function LivingCityMap({
  city,
  emotionalState = "curious",
  focusZoneId = null,
  microReward = null,
  onZoneClick,
}: Props) {
  const [selectedZone, setSelectedZone] = useState<CityZone | null>(null);

  const ambientConfig: AmbientConfig = useMemo(() => ({
    intensity: ambientFromEmotional(emotionalState),
    particleCount: emotionalState === "engaged" ? 8 : emotionalState === "lost" ? 3 : 5,
    breathDuration: emotionalState === "engaged" ? 5 : 8,
  }), [emotionalState]);

  const rewardConfig: RewardConfig = useMemo(() => ({
    active: !!microReward,
    type: microReward?.type ?? null,
    intensity: microReward?.intensity ?? "low",
  }), [microReward]);

  const effectiveFocus = focusZoneId ?? city.weakestZone;

  const handleZoneClick = (zone: CityZone) => {
    setSelectedZone(selectedZone?.id === zone.id ? null : zone);
    onZoneClick?.(zone.id);
  };

  return (
    <div className="relative w-full max-w-[420px] mx-auto">
      <svg viewBox="0 0 400 400" className="w-full h-auto" role="img" aria-label="مدينة الوعي الحيّة">
        <defs>
          <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c4a265" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#c4a265" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background */}
        <rect width="400" height="400" fill="transparent" />

        {/* Ambient breathing + particles */}
        <AmbientLayer config={ambientConfig} />

        {/* Orbit path */}
        <motion.ellipse
          cx={CENTER_X}
          cy={CENTER_Y}
          rx={ORBIT_RX}
          ry={ORBIT_RY}
          fill="none"
          stroke="#3d3226"
          strokeWidth="0.8"
          strokeDasharray="4 8"
          opacity={0.3}
          animate={{ opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Connection lines */}
        {city.zones.map((zone, i) => {
          const pos = getZonePosition(i, city.zones.length);
          const isThisZoneFocused = zone.id === effectiveFocus;
          return (
            <motion.line
              key={`line-${zone.id}`}
              x1={CENTER_X}
              y1={CENTER_Y}
              x2={pos.cx}
              y2={pos.cy}
              stroke={zone.state === "thriving" ? "#c4a265" : "#3d3226"}
              strokeWidth={isThisZoneFocused ? 1.5 : 0.6}
              opacity={zone.state === "weak" ? 0.15 : 0.4}
              animate={{
                opacity: isThisZoneFocused ? [0.3, 0.6, 0.3] : undefined,
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          );
        })}

        {/* Zone nodes */}
        {city.zones.map((zone, i) => {
          const pos = getZonePosition(i, city.zones.length);
          return (
            <ZoneNode
              key={zone.id}
              cx={pos.cx}
              cy={pos.cy}
              r={NODE_R}
              state={zone.state}
              isFocused={zone.id === effectiveFocus}
              name={zone.name}
              signal={zone.signal}
              onClick={() => handleZoneClick(zone)}
            />
          );
        })}

        {/* Center core */}
        <motion.circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={32}
          fill="#D6D1C8"
          stroke="#4a3d2a"
          strokeWidth={2}
          animate={{
            opacity: [0.8, 1, 0.8],
            scale: [1, 1.02, 1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <text
          x={CENTER_X}
          y={CENTER_Y + 4}
          textAnchor="middle"
          className="text-[8px] font-semibold pointer-events-none select-none"
          fill="#8a7b66"
        >
          مدينة الوعي
        </text>

        {/* Reward burst (anchored at center) */}
        <RewardBurst config={rewardConfig} cx={CENTER_X} cy={CENTER_Y} />
      </svg>

      {/* Signal card (appears on zone click) */}
      {selectedZone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute bottom-4 left-4 right-4 rounded-xl border border-[#3d3226] bg-[#1a1610]/95 backdrop-blur-sm p-4 text-right"
          dir="rtl"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#8a7b66]">
              {selectedZone.state === "weak" ? "ضعيف" : selectedZone.state === "growing" ? "ينمو" : selectedZone.state === "stable" ? "مستقر" : "مزدهر"}
            </span>
            <span className="text-sm font-semibold text-[#c4a265]">{selectedZone.name}</span>
          </div>
          <p className="text-xs text-[#a8926b] leading-relaxed">{selectedZone.signal}</p>
          <button
            onClick={() => setSelectedZone(null)}
            className="mt-3 text-[10px] text-[#5a5044] hover:text-[#c4a265] transition-colors"
          >
            إغلاق
          </button>
        </motion.div>
      )}

      {/* Micro-reward toast */}
      {microReward && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
          className="absolute top-4 left-4 right-4 rounded-xl border border-[#c4a265]/30 bg-[#2a2118]/95 backdrop-blur-sm p-3 text-center"
          dir="rtl"
        >
          <p className="text-xs font-semibold text-[#e7c468]">{microReward.message}</p>
        </motion.div>
      )}
    </div>
  );
}
