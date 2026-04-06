"use client";

import { motion, AnimatePresence } from "framer-motion";
import { rewardBurstVariants } from "./variants";
import type { RewardConfig } from "./types";

interface Props {
  config: RewardConfig;
  cx: number;
  cy: number;
}

const REWARD_COLORS: Record<string, string> = {
  streak: "#e7c468",
  breakthrough: "#c4a265",
  consistency: "#8a7b66",
  return: "#a8926b",
  depth: "#d4b86a",
};

export default function RewardBurst({ config, cx, cy }: Props) {
  if (!config.active || !config.type) return null;

  const color = REWARD_COLORS[config.type] ?? "#c4a265";
  const ringCount = config.intensity === "high" ? 3 : config.intensity === "medium" ? 2 : 1;

  return (
    <AnimatePresence>
      {config.active && (
        <g className="pointer-events-none">
          {Array.from({ length: ringCount }).map((_, i) => (
            <motion.circle
              key={`reward-ring-${i}`}
              cx={cx}
              cy={cy}
              r={30 + i * 15}
              fill="none"
              stroke={color}
              strokeWidth={2 - i * 0.5}
              variants={rewardBurstVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              style={{ transition: `all ${0.2 + i * 0.15}s` }}
            />
          ))}

          {/* Center flash */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={8}
            fill={color}
            variants={rewardBurstVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          />
        </g>
      )}
    </AnimatePresence>
  );
}
