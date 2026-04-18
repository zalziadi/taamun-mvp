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

// ─── Remapped to Ta'ammun Design System (ink + gold) 2026-04-19 ───
// Legacy key names preserved so every importer keeps working.
// "ink*" now means LIGHT text on dark (inverted). "parchment*" now means
// raised dark surfaces. "earth*" / "gold*" all collapse to the DS gold ramp.
export const BRAND_COLORS = {
  // Ink — primary text stack (inverted: now LIGHT tones, for use on dark bg)
  ink: "#D6D1C8",        // ink-100 — primary text
  inkSoft: "#E8E3D9",    // ink-050 — headline highlight
  inkWarm: "#D6D1C8",    // ink-100 — warm body text
  inkMid: "#A8A29A",     // ink-200 — secondary text
  inkLight: "#807A72",   // ink-300 — tertiary / muted text

  // Parchment — now DARK raised surfaces (not light cards)
  white: "#D6D1C8",      // banned: pure white → warm off-white
  parchment: "#14110F",  // ink-800 — raised surface
  parchmentLight: "#1C1916", // ink-700 — card
  parchmentWarm: "#1C1916",  // ink-700 — card variant
  parchmentDeep: "#0A0908",  // ink-900 — deepest surface

  // Earth — collapsed onto the gold scale + ink-400 for muted
  earth: "#C9A84C",      // gold-500 — primary gold (was warm brown)
  earthLight: "#D9BC6B", // gold-400 — hover gold
  earthMuted: "#55504A", // ink-400 — disabled / faint
  stone: "#807A72",      // ink-300
  sand: "#A8A29A",       // ink-200
  sandLight: "#D6D1C8",  // ink-100

  // Gold / Breath — the accent ramp (unified)
  gold: "#C9A84C",       // gold-500 — primary
  goldBright: "#D9BC6B", // gold-400 — hover
  goldDim: "#8B7332",    // gold-600 — pressed
  breath: "#C9A84C",     // collapsed to gold-500

  // Background — the ink canvas (no gradient — DS bans gradients)
  bgDark: "#0A0908",     // ink-900 — the silence
  bgDarkGradient: "#0A0908", // flattened per DS rule (no gradients)
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
