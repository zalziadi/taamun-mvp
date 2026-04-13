/**
 * Brand Identity — Taamun (تمعّن)
 *
 * Extracted from the original calligraphic logo:
 * The عُّ (ain with shadda+damma) — the heart of تمعُّن
 * The shadda (ّ) marks the doubled letter, the damma (ُ) its vowel.
 * The ain represents deep seeing, contemplation, and inner vision.
 *
 * This file is the single source of truth for all brand values.
 * Import from here — never hardcode brand colors or assets.
 */

// ─── Logo Assets ───────────────────────────────────────────
export const BRAND_LOGOS = {
  /** Full logo: عـ mark + تمعّن wordmark badge + tagline */
  full: "/brand/logo-full.svg",
  /** Mark only: عُّ calligraphic symbol (ain + shadda + damma) */
  mark: "/brand/logo-mark.svg",
  /** Wordmark only: تمعّن text */
  wordmark: "/brand/logo-wordmark.svg",
  /** Favicon: simplified عُّ for small sizes */
  favicon: "/brand/favicon.svg",
} as const;

// ─── Core Palette ──────────────────────────────────────────
// Derived from the logo's visual language:
// Black ink on white parchment, cream badge, dark gradient surround

export const BRAND_COLORS = {
  // Ink — the عـ letterform color
  ink: "#1a1a1a",
  inkSoft: "#2A1D10",
  inkWarm: "#2f2619",
  inkMid: "#4A3520",
  inkLight: "#5f5648",

  // Parchment — the white card surface
  white: "#FFFFFF",
  parchment: "#F5EFE4",
  parchmentLight: "#FAF8F4",
  parchmentWarm: "#F5ECD4", // wordmark badge bg
  parchmentDeep: "#EDE5D5",

  // Earth — warm neutral midtones
  earth: "#7b694a",
  earthLight: "#8c7851",
  earthMuted: "#7d7362",
  stone: "#a09480",
  sand: "#c9bda8",
  sandLight: "#d8cdb9",

  // Gold / Breath — accent, CTA, emphasis
  gold: "#c9b88a",
  goldBright: "#e6d4a4",
  goldDim: "#a08850",
  breath: "#C4A265",

  // Background — the dark gradient surround
  bgDark: "#15130f",
  bgDarkGradient: "linear-gradient(135deg, #2a2a25 0%, #1a1a17 50%, #2a2a25 100%)",
} as const;

// ─── Typography ────────────────────────────────────────────
export const BRAND_FONTS = {
  /** Headings, verse display, logo wordmark */
  heading: "Amiri, serif",
  /** Body text, UI labels, descriptions */
  body: "IBM Plex Sans Arabic, Noto Sans Arabic, sans-serif",
  /** Code, timestamps, meta info */
  mono: "IBM Plex Mono, monospace",
  /** Quran verses */
  quran: "Amiri, serif",
} as const;

// ─── Spacing & Radius ──────────────────────────────────────
export const BRAND_RADIUS = {
  /** Cards, panels */
  card: "1.5rem",   // 24px — rounded-3xl
  /** Buttons, badges */
  button: "0.75rem", // 12px — rounded-xl
  /** Logo badge, tags */
  badge: "0.625rem", // 10px — rounded-[10px]
  /** Full round (pills, avatars) */
  full: "9999px",
} as const;

// ─── Shadows ───────────────────────────────────────────────
export const BRAND_SHADOWS = {
  /** Default card elevation */
  card: "0 16px 42px rgba(140, 120, 81, 0.12)",
  /** Hover/interactive card */
  cardHover: "0 20px 50px rgba(140, 120, 81, 0.16)",
  /** Subtle soft shadow */
  soft: "0 4px 14px 0 rgb(0 0 0 / 0.25)",
  /** Gold glow for emphasis */
  glow: "0 0 20px -5px hsl(42 86% 55% / 0.2)",
} as const;

// ─── Design Philosophy ─────────────────────────────────────
/**
 * Brand Principles:
 *
 * 1. DECONSTRUCTION — The logo breaks "تمعّن" into its essential
 *    calligraphic forms. Every design element should reveal
 *    hidden structure, not decorate the surface.
 *
 * 2. INK ON PARCHMENT — High contrast, honest materials.
 *    Black letterforms on warm white. No unnecessary gradients,
 *    no synthetic glow effects. Let the typography breathe.
 *
 * 3. THE عُّ (AIN + SHADDA + DAMMA) — "Eye" in Arabic, doubled
 *    and voiced. The shadda intensifies, the damma gives breath.
 *    UI should invite slow, focused looking — generous whitespace,
 *    deliberate hierarchy.
 *
 * 4. WARM NEUTRALS — Cream, sand, earth tones. The palette
 *    evokes old books, desert stone, handwritten manuscripts.
 *    Gold is used sparingly for moments of discovery.
 *
 * 5. ARABIC-FIRST — RTL layout, Arabic typography as primary,
 *    calligraphic details respected. The design honors the
 *    source material (Quranic text).
 */
