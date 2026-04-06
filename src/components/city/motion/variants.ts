import type { Variants } from "framer-motion";
import type { ZoneState } from "@/lib/cityEngine";

// ── Zone State Variants ──

export const zoneVariants: Record<ZoneState, Variants> = {
  weak: {
    initial: { opacity: 0.4, scale: 1 },
    animate: {
      opacity: [0.35, 0.45, 0.35],
      scale: 1,
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
    },
  },
  growing: {
    initial: { opacity: 0.6, scale: 1 },
    animate: {
      opacity: [0.55, 0.75, 0.55],
      scale: [1, 1.02, 1],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    },
  },
  stable: {
    initial: { opacity: 0.85, scale: 1 },
    animate: {
      opacity: [0.8, 0.9, 0.8],
      scale: 1,
      transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
    },
  },
  thriving: {
    initial: { opacity: 1, scale: 1 },
    animate: {
      opacity: [0.9, 1, 0.9],
      scale: [1, 1.04, 1],
      transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
    },
  },
};

// ── Glow Ring Variants (outer ring pulse) ──

export const glowRingVariants: Record<ZoneState, Variants> = {
  weak: {
    animate: { opacity: 0, scale: 1 },
  },
  growing: {
    animate: {
      opacity: [0, 0.3, 0],
      scale: [1, 1.15, 1],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    },
  },
  stable: {
    animate: {
      opacity: [0.2, 0.4, 0.2],
      scale: [1, 1.08, 1],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
    },
  },
  thriving: {
    animate: {
      opacity: [0.3, 0.7, 0.3],
      scale: [1, 1.2, 1],
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
    },
  },
};

// ── Focus Variants ──

export const focusVariants: Variants = {
  idle: { scale: 1, filter: "brightness(1)" },
  focused: {
    scale: 1.12,
    filter: "brightness(1.3)",
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

// ── Ambient Breathing Variants ──

export const breathVariants: Record<string, Variants> = {
  calm: {
    animate: {
      opacity: [0.03, 0.08, 0.03],
      scale: [1, 1.02, 1],
      transition: { duration: 8, repeat: Infinity, ease: "easeInOut" },
    },
  },
  alive: {
    animate: {
      opacity: [0.05, 0.15, 0.05],
      scale: [1, 1.04, 1],
      transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
    },
  },
  deep: {
    animate: {
      opacity: [0.04, 0.12, 0.04],
      scale: [1, 1.03, 1],
      transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
    },
  },
};

// ── Reward Burst Variants ──

export const rewardBurstVariants: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: [0, 1, 1, 0],
    scale: [0.5, 1.3, 1.1, 1.5],
    transition: { duration: 1.8, ease: "easeOut" },
  },
};

// ── Particle Variants ──

export const particleVariants: Variants = {
  float: (i: number) => ({
    y: [0, -20 - i * 5, 0],
    x: [0, (i % 2 === 0 ? 10 : -10), 0],
    opacity: [0, 0.4, 0],
    transition: {
      duration: 6 + i * 0.5,
      repeat: Infinity,
      ease: "easeInOut",
      delay: i * 0.8,
    },
  }),
};
