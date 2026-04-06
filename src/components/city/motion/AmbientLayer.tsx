"use client";

import { motion } from "framer-motion";
import { breathVariants, particleVariants } from "./variants";
import type { AmbientConfig } from "./types";

interface Props {
  config: AmbientConfig;
}

const PARTICLE_POSITIONS = [
  { x: 80, y: 120 },
  { x: 300, y: 80 },
  { x: 180, y: 320 },
  { x: 50, y: 280 },
  { x: 340, y: 260 },
  { x: 200, y: 60 },
  { x: 120, y: 200 },
  { x: 280, y: 340 },
];

export default function AmbientLayer({ config }: Props) {
  const variant = breathVariants[config.intensity] ?? breathVariants.calm;
  const particles = PARTICLE_POSITIONS.slice(0, config.particleCount);

  return (
    <g className="pointer-events-none">
      {/* Central breathing glow */}
      <motion.circle
        cx={200}
        cy={200}
        r={160}
        fill="url(#ambientGlow)"
        variants={variant}
        animate="animate"
      />

      {/* Floating particles */}
      {particles.map((pos, i) => (
        <motion.circle
          key={`particle-${i}`}
          cx={pos.x}
          cy={pos.y}
          r={1.5}
          fill="#c4a265"
          custom={i}
          variants={particleVariants}
          animate="float"
        />
      ))}
    </g>
  );
}
