"use client";

import { motion, useReducedMotion } from "framer-motion";

/** Word-by-word reveal — RTL-safe (no horizontal motion). */
export function WordReveal({ text, baseDelaySec = 0.9 }: { text: string; baseDelaySec?: number }) {
  const reduce = useReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);

  if (reduce) {
    return <span>{text}</span>;
  }

  return (
    <span className="inline-block text-on-surface-variant" dir="rtl">
      {words.map((word, i) => (
        <motion.span
          key={`${i}-${word.slice(0, 12)}`}
          className="inline-block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: baseDelaySec + i * 0.15,
            duration: 0.6,
            ease: "easeOut",
          }}
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </span>
  );
}
