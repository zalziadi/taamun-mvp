import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f9f8",
          100: "#eef2f1",
          200: "#d8e0dd",
          400: "#7d8a86",
          600: "#3d4744",
          800: "#1c2321",
          900: "#0f1413",
        },
        wafrah: {
          50: "#f0f9f4",
          100: "#dcf0e3",
          200: "#bbe1c8",
          300: "#8dcca6",
          400: "#58af80",
          500: "#329365",
          600: "#207651",
          700: "#1b5e43",
          800: "#184b38",
          900: "#143e2f",
        },
        sand: {
          50: "#fbfaf6",
          100: "#f4f0e6",
          200: "#e7decb",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-arabic)", "system-ui", "sans-serif"],
        arabic: ["var(--font-arabic)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 20, 19, 0.04), 0 8px 24px rgba(15, 20, 19, 0.06)",
        ring: "0 0 0 4px rgba(50, 147, 101, 0.12)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 600ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
