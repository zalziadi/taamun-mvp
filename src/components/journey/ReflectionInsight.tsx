"use client";

/**
 * ReflectionInsight — a living mirror for AI reflection output.
 *
 * Phase 4 · Task 3 (frontend only).
 *
 * Design principles (from "living mirror, not static card"):
 *
 *   1. Sentiment is NEVER displayed as a label. The user should not
 *      feel classified. Instead, sentiment quietly tints the mirror
 *      box border and background gradient.
 *
 *   2. No imperative UI — the suggestion is styled italic + muted
 *      so it reads as an invitation, not a directive.
 *
 *   3. Subtle life signs — fade-in on mount, slow ✦ pulse, gradient
 *      background. No harsh borders, no hard shadows.
 *
 *   4. Null-safe — passing all nulls renders nothing (no placeholder
 *      ghost). Pass `loading={true}` for a breathing skeleton.
 *
 *   5. Voice v2 alignment — matches WhyYouAreHereCard's heading
 *      label pattern (small uppercase tracking + ✦) and mirror box
 *      (border-r-2 highlight strip). Different enough to be its
 *      own moment, similar enough to feel like the same system.
 *
 * What this component does NOT do:
 *   - Does not fetch data. It only renders what's passed in.
 *   - Does not call /api/ai/reflection. Integration layer (Task 2
 *     server-side) handles that.
 *   - Does not know about journey state, continuity, or routing.
 *
 * Passive, isolated, reusable.
 */

import { AnimatePresence, motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ReflectionSentiment = "resistant" | "neutral" | "open";

export interface ReflectionInsightProps {
  /** The three voices. Null → use neutral tint and skip state-specific styling. */
  sentiment: ReflectionSentiment | null;
  /** The main mirror sentence. Null → the mirror box is skipped. */
  mirror: string | null;
  /** The gentle invitation. Null → the suggestion line is skipped. */
  suggestion: string | null;
  /** Optional 2-3 word theme label. Null/omitted → the heading line is skipped. */
  theme?: string | null;
  /**
   * If true and there is no content yet, a pulsing skeleton is shown.
   * If false (default) and there is no content, the component renders nothing.
   */
  loading?: boolean;
  /**
   * Optional variant. Parchment matches /program + /city + home.
   * Dark matches /progress.
   */
  variant?: "parchment" | "dark";
}

// ---------------------------------------------------------------------------
// Sentiment → visual tint mapping
//
// The tint is intentionally subtle. You should see a shift, not a label.
// ---------------------------------------------------------------------------

interface Tint {
  container: string;
  labelText: string;
  accent: string;
  mirrorWrapper: string;
  mirrorText: string;
  suggestionText: string;
}

function parchmentTint(sentiment: ReflectionSentiment | null): Tint {
  switch (sentiment) {
    case "resistant":
      // Warmer/darker — acknowledges weight without alarm
      return {
        container:
          "border-[#9b7f65]/35 bg-gradient-to-b from-[#f5ebd8] to-[#fcfaf7]",
        labelText: "text-[#7d6547]/85",
        accent: "text-[#9b7f65]",
        mirrorWrapper:
          "rounded-xl border-r-2 border-[#9b7f65]/55 bg-gradient-to-b from-[#f1e3c7]/70 to-[#f4ead7]/30 px-5 py-4",
        mirrorText: "text-[#3a2e1c]",
        suggestionText: "text-[#5f5648]/80",
      };
    case "open":
      // Gentle gold — recognition of flow
      return {
        container:
          "border-[#c4a265]/55 bg-gradient-to-b from-[#faf4e4] to-[#fcfaf7]",
        labelText: "text-[#8c7851]",
        accent: "text-[#c4a265]",
        mirrorWrapper:
          "rounded-xl border-r-2 border-[#c4a265]/70 bg-gradient-to-b from-[#f4ead7]/70 to-[#faf4e4]/30 px-5 py-4",
        mirrorText: "text-[#3a2e1c]",
        suggestionText: "text-[#5f5648]/85",
      };
    case "neutral":
    default:
      // Calm parchment baseline
      return {
        container: "border-[#d8cdb9] bg-[#fcfaf7]",
        labelText: "text-[#8c7851]/85",
        accent: "text-[#b39b71]",
        mirrorWrapper:
          "rounded-xl border-r-2 border-[#b39b71]/50 bg-gradient-to-b from-[#faf6ee]/70 to-[#fcfaf7]/30 px-5 py-4",
        mirrorText: "text-[#3a2e1c]",
        suggestionText: "text-[#5f5648]/85",
      };
  }
}

function darkTint(sentiment: ReflectionSentiment | null): Tint {
  switch (sentiment) {
    case "resistant":
      return {
        container: "border-[#c9b88a]/25 bg-white/[0.04]",
        labelText: "text-[#c9b88a]/70",
        accent: "text-[#c9b88a]/85",
        mirrorWrapper:
          "rounded-xl border-r-2 border-[#c9b88a]/40 bg-[#15130f]/60 px-5 py-4",
        mirrorText: "text-[#e8e1d9]",
        suggestionText: "text-[#c9b88a]/80",
      };
    case "open":
      return {
        container: "border-[#c9b88a]/45 bg-[#c9b88a]/[0.06]",
        labelText: "text-[#c9b88a]/85",
        accent: "text-[#c9b88a]",
        mirrorWrapper:
          "rounded-xl border-r-2 border-[#c9b88a]/60 bg-[#15130f]/70 px-5 py-4",
        mirrorText: "text-[#e8e1d9]",
        suggestionText: "text-[#c9b88a]/85",
      };
    case "neutral":
    default:
      return {
        container: "border-[#c9b88a]/30 bg-white/[0.03]",
        labelText: "text-[#c9b88a]/75",
        accent: "text-[#c9b88a]/75",
        mirrorWrapper:
          "rounded-xl border-r-2 border-[#c9b88a]/45 bg-[#15130f]/60 px-5 py-4",
        mirrorText: "text-[#e8e1d9]",
        suggestionText: "text-[#c9b88a]/75",
      };
  }
}

// ---------------------------------------------------------------------------
// Loading skeleton — a quiet breathing placeholder
// ---------------------------------------------------------------------------

function LoadingState({ variant }: { variant: "parchment" | "dark" }) {
  const isDark = variant === "dark";
  const wrapperClass = isDark
    ? "rounded-2xl border border-[#c9b88a]/20 bg-white/[0.03] p-6"
    : "tm-card border-[#d8cdb9]/40 bg-[#fcfaf7]/60 p-6";
  const barClass = isDark ? "bg-[#c9b88a]/15" : "bg-[#e1d7c7]/60";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0.35, 0.75, 0.35] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      className={wrapperClass}
      aria-label="جارٍ التأمّل"
      role="status"
    >
      <div className="space-y-3">
        <div className={`h-2.5 w-24 rounded-full ${barClass}`} />
        <div className={`h-4 w-full rounded-lg ${barClass}`} />
        <div className={`h-4 w-5/6 rounded-lg ${barClass}`} />
        <div className={`h-3 w-2/3 rounded-full ${barClass} mt-2`} />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * ReflectionInsight — renders AI reflection output as a living mirror.
 *
 * Usage:
 *   <ReflectionInsight
 *     sentiment={row.ai_sentiment}
 *     theme={row.ai_theme}
 *     mirror={row.ai_mirror}
 *     suggestion={row.ai_suggestion}
 *   />
 *
 * Loading:
 *   <ReflectionInsight
 *     sentiment={null}
 *     theme={null}
 *     mirror={null}
 *     suggestion={null}
 *     loading
 *   />
 */
export function ReflectionInsight({
  sentiment,
  mirror,
  suggestion,
  theme = null,
  loading = false,
  variant = "parchment",
}: ReflectionInsightProps) {
  const trimmedMirror = mirror?.trim() ?? "";
  const trimmedSuggestion = suggestion?.trim() ?? "";
  const trimmedTheme = theme?.trim() ?? "";
  const hasContent = trimmedMirror.length > 0 || trimmedSuggestion.length > 0;

  // 1. Loading takes precedence over empty
  if (loading && !hasContent) {
    return <LoadingState variant={variant} />;
  }

  // 2. No content, not loading → render nothing (not even a placeholder)
  if (!hasContent) {
    return null;
  }

  const tint = variant === "dark" ? darkTint(sentiment) : parchmentTint(sentiment);
  const isDark = variant === "dark";

  const containerBaseClass = isDark
    ? "rounded-2xl border p-6 space-y-4"
    : "tm-card p-6 space-y-4";

  // Use mirror text as the React key so content changes retrigger
  // the fade-in animation — "the mirror breathes when it changes."
  const animationKey = `${trimmedMirror || trimmedSuggestion}`.slice(0, 40);

  return (
    <AnimatePresence mode="wait">
      <motion.section
        key={animationKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className={`${containerBaseClass} ${tint.container}`}
        aria-label="انعكاس من تأمّلك"
      >
        {/* Heading — theme as a quiet label, ✦ as a slow pulse */}
        {trimmedTheme && (
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] tracking-[0.18em] ${tint.labelText}`}
            >
              {trimmedTheme}
            </span>
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={tint.accent}
              aria-hidden
            >
              ✦
            </motion.span>
          </div>
        )}

        {/* Mirror — the main reflection. Always the focal point. */}
        {trimmedMirror && (
          <div className={tint.mirrorWrapper}>
            <p
              className={`text-base leading-[1.95] whitespace-pre-line ${tint.mirrorText}`}
            >
              {trimmedMirror}
            </p>
          </div>
        )}

        {/* Suggestion — italic, muted, smaller. Reads as invitation. */}
        {trimmedSuggestion && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
            className={`text-sm leading-[1.9] italic whitespace-pre-line ${tint.suggestionText}`}
          >
            {trimmedSuggestion}
          </motion.p>
        )}
      </motion.section>
    </AnimatePresence>
  );
}
