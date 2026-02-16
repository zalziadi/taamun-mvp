import type { Config } from "tailwindcss";

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
        bg: "hsl(222 47% 7%)",
        panel: "hsl(222 35% 10%)",
        panel2: "hsl(222 28% 12%)",
        text: "hsl(210 40% 96%)",
        muted: "hsl(215 16% 70%)",
        border: "hsl(222 22% 18%)",
        gold: "hsl(42 86% 55%)",
        gold2: "hsl(42 86% 45%)",
        danger: "hsl(0 72% 55%)",
        success: "hsl(142 70% 45%)",
      },
      boxShadow: {
        soft: "0 4px 14px 0 rgb(0 0 0 / 0.25)",
        glow: "0 0 20px -5px hsl(42 86% 55% / 0.2)",
      },
      fontFamily: {
        arabic: ["Noto Sans Arabic", "Tahoma", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
