"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Slow-moving radial light + subtle grain — Desert Sanctuary atmosphere */
export function JourneyAtmosphere() {
  const reduce = useReducedMotion();

  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden bg-[#0A0908]"
        animate={
          reduce
            ? undefined
            : {
                background: [
                  "radial-gradient(ellipse 80% 60% at 20% 25%, rgba(230,212,164,0.12) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 80% 75%, rgba(200,180,120,0.06) 0%, transparent 50%), #0A0908",
                  "radial-gradient(ellipse 85% 65% at 75% 30%, rgba(230,212,164,0.11) 0%, transparent 58%), radial-gradient(ellipse 65% 45% at 25% 80%, rgba(200,180,120,0.07) 0%, transparent 52%), #0A0908",
                  "radial-gradient(ellipse 75% 55% at 45% 55%, rgba(230,212,164,0.1) 0%, transparent 60%), radial-gradient(ellipse 80% 55% at 90% 20%, rgba(200,180,120,0.05) 0%, transparent 48%), #0A0908",
                  "radial-gradient(ellipse 80% 60% at 20% 25%, rgba(230,212,164,0.12) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 80% 75%, rgba(200,180,120,0.06) 0%, transparent 50%), #0A0908",
                ],
              }
        }
        transition={
          reduce
            ? undefined
            : {
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }
        }
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
        }}
      />
    </>
  );
}
