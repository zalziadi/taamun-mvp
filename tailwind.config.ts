import type { Config } from "tailwindcss";
import { designTokens } from "./src/lib/design-tokens";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ─── Remapped to Ta'ammun Design System palette (ink + gold) ───
        // Existing class names (bg-panel, text-text, etc.) now resolve to DS tokens.
        bg: "#0A0908",         // ink-900 — the silence
        panel: "#1C1916",      // ink-700 — card / panel
        panel2: "#14110F",     // ink-800 — raised surface
        text: "#D6D1C8",       // ink-100 — warm off-white
        muted: "#A8A29A",      // ink-200 — secondary text
        border: "#2A2621",     // ink-600 — hairline border
        gold: "#C9A84C",       // gold-500 — primary gold
        gold2: "#8B7332",      // gold-600 — pressed / dark gold
        danger: "#8E5A52",     // ember — silenced red
        success: "#6E7866",    // sage — completed
        // Legacy parchment/ink names — inverted into the dark canvas so
        // `bg-parchment` now reads as a raised surface, `text-ink` as fg.
        parchment: "#14110F",  // was cream → now ink-800
        parchment2: "#1C1916", // was cream2 → now ink-700
        ink: "#D6D1C8",        // was dark brown → now ink-100 (inverted)
        ink2: "#A8A29A",       // was medium brown → now ink-200
        ink3: "#807A72",       // was tan → now ink-300
        breath: "#C9A84C",     // was tan accent → now gold-500
        ...designTokens.colors,
      },
      spacing: {
        safe: "env(safe-area-inset-bottom)",
      },
      boxShadow: {
        soft: "0 4px 14px 0 rgb(0 0 0 / 0.25)",
        glow: "0 0 20px -5px hsl(42 86% 55% / 0.2)",
      },
      fontFamily: {
        arabic: ["Noto Sans Arabic", "Tahoma", "system-ui", "sans-serif"],
        serif: ["var(--font-amiri)", "Amiri", "serif"],
        body: ["var(--font-manrope)", "Noto Sans Arabic", "Tahoma", "sans-serif"],
        headline: ["var(--font-noto-serif)", "var(--font-amiri)", "Noto Serif", "serif"],
        quran: ["var(--font-amiri)", "Amiri", "serif"],
        label: ["var(--font-manrope)", "Noto Sans Arabic", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
