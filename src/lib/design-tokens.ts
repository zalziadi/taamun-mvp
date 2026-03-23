/**
 * Design Tokens — Taamun (تمعّن)
 * Stitch Design System: "Desert Sanctuary"
 *
 * Color palette, typography, and Tailwind configuration
 * for the Quranic contemplation app.
 *
 * Export as const and integrate with tailwind.config.ts
 */

export const designTokens = {
  colors: {
    // Background & Surface
    background: '#15130f',
    surface: '#15130f',
    'surface-dim': '#15130f',
    'surface-container-lowest': '#100e0a',
    'surface-container-low': '#1e1b16',
    'surface-container': '#221f1a',
    'surface-container-high': '#2c2a24',
    'surface-container-highest': '#37342f',
    'surface-bright': '#3c3933',
    'surface-variant': '#37342f',

    // Primary (Gold/Tan)
    primary: '#e6d4a4',
    'primary-container': '#c9b88a',
    'primary-fixed': '#f4e1b0',
    'primary-fixed-dim': '#d7c596',
    'on-primary': '#3a2f0d',

    // Secondary (Warm Neutral)
    secondary: '#d0c5b1',

    // Tertiary (Warm Cream)
    tertiary: '#e8d49f',
    'tertiary-container': '#cbb885',

    // Surface Text
    'on-surface': '#e8e1d9',
    'on-surface-variant': '#cdc6b7',

    // Outline & Dividers
    outline: '#969083',
    'outline-variant': '#4b463c',

    // Semantic
    error: '#ffb4ab',
  },

  fonts: {
    headline: ['Noto Serif', 'Amiri', 'serif'],
    body: ['Manrope', 'sans-serif'],
    label: ['Manrope', 'sans-serif'],
    quran: ['Amiri', 'serif'],
  },
} as const;

/**
 * Tailwind CSS Configuration Extension
 *
 * Add this to your tailwind.config.ts:
 *
 * extend: {
 *   colors: tailwindTokens.colors,
 *   fontFamily: tailwindTokens.fontFamily,
 * }
 */
export const tailwindTokens = {
  colors: {
    // Backgrounds
    'bg-base': designTokens.colors.background,
    'bg-surface': designTokens.colors.surface,
    'bg-surface-dim': designTokens.colors['surface-dim'],
    'bg-surface-lowest': designTokens.colors['surface-container-lowest'],
    'bg-surface-low': designTokens.colors['surface-container-low'],
    'bg-surface-container': designTokens.colors['surface-container'],
    'bg-surface-high': designTokens.colors['surface-container-high'],
    'bg-surface-highest': designTokens.colors['surface-container-highest'],
    'bg-surface-bright': designTokens.colors['surface-bright'],
    'bg-surface-variant': designTokens.colors['surface-variant'],

    // Primary
    'primary': designTokens.colors.primary,
    'primary-container': designTokens.colors['primary-container'],
    'primary-fixed': designTokens.colors['primary-fixed'],
    'primary-fixed-dim': designTokens.colors['primary-fixed-dim'],
    'on-primary': designTokens.colors['on-primary'],

    // Secondary
    'secondary': designTokens.colors.secondary,

    // Tertiary
    'tertiary': designTokens.colors.tertiary,
    'tertiary-container': designTokens.colors['tertiary-container'],

    // Text & Surface
    'text-on-surface': designTokens.colors['on-surface'],
    'text-on-surface-variant': designTokens.colors['on-surface-variant'],

    // Outlines & Dividers
    'outline': designTokens.colors.outline,
    'outline-variant': designTokens.colors['outline-variant'],

    // Semantic
    'error': designTokens.colors.error,
  },

  fontFamily: {
    headline: designTokens.fonts.headline.join(', '),
    body: designTokens.fonts.body.join(', '),
    label: designTokens.fonts.label.join(', '),
    quran: designTokens.fonts.quran.join(', '),
  },
} as const;

/**
 * CSS Custom Properties Helper
 *
 * Use this to generate CSS variables for use in global styles:
 */
export const generateCssVariables = () => {
  const vars: Record<string, string> = {};

  // Colors
  Object.entries(designTokens.colors).forEach(([key, value]) => {
    vars[`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value;
  });

  return vars;
};

/**
 * Type Safety Helper
 *
 * Use for strict color references:
 */
export type DesignColor = keyof typeof designTokens.colors;
export type DesignFont = keyof typeof designTokens.fonts;
