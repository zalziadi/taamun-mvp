"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Living breathing center + concentric rings. RTL-safe (scale only). */
export function BreathingRings() {
  const reduce = useReducedMotion();

  const breatheTransition = reduce
    ? { duration: 0 }
    : {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut" as const,
      };

  const ringPulse = reduce
    ? {}
    : {
        scale: [1, 1.35, 1],
        opacity: [0.35, 0, 0.35],
      };

  return (
    <div className="relative flex h-[220px] w-[220px] items-center justify-center" dir="rtl">
      <motion.div
        aria-hidden
        className="absolute rounded-full border border-primary/15"
        style={{ width: 200, height: 200 }}
        animate={reduce ? {} : ringPulse}
        transition={
          reduce
            ? undefined
            : {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0,
              }
        }
      />
      <motion.div
        aria-hidden
        className="absolute rounded-full border border-primary/25"
        style={{ width: 160, height: 160 }}
        animate={reduce ? {} : ringPulse}
        transition={
          reduce
            ? undefined
            : {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }
        }
      />
      <motion.div
        aria-hidden
        className="relative z-10 rounded-full bg-[#e6d4a4]/25"
        style={{ width: 112, height: 112 }}
        animate={
          reduce
            ? undefined
            : {
                scale: [1, 1.15, 1],
                boxShadow: [
                  "0 0 60px rgba(230,212,164,0.15)",
                  "0 0 100px rgba(230,212,164,0.3)",
                  "0 0 60px rgba(230,212,164,0.15)",
                ],
              }
        }
        transition={breatheTransition}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute z-20 h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-transparent"
        animate={reduce ? undefined : { scale: [1, 1.12, 1] }}
        transition={breatheTransition}
      />
    </div>
  );
}
