/**
 * Dynamic Tone Engine
 *
 * Matches emotional tone to user state.
 * Used to adapt orchestrator.primarySignal and guidance.message.
 */

export type ToneType = "calm" | "firm" | "motivational" | "compassionate";

export interface ToneInput {
  momentum: number;        // -10 to +10
  drift: number;           // 0 to 28
  commitment: number;      // 0 to 100
  hesitationPatterns?: boolean;
}

/**
 * Detect tone based on user state.
 *
 * Priority order:
 * 1. drift high → calm (don't shame, just steady)
 * 2. hesitation patterns → firm (need clarity, not softness)
 * 3. momentum high → motivational (build on energy)
 * 4. commitment low → compassionate (support, not push)
 * 5. default → calm
 */
export function detectTone(input: ToneInput): ToneType {
  // High drift = needs calm presence (not pressure)
  if (input.drift > 5) return "calm";

  // Hesitation = needs firm direction
  if (input.hesitationPatterns) return "firm";

  // High momentum = ride the wave
  if (input.momentum >= 5) return "motivational";

  // Low commitment = compassionate support
  if (input.commitment < 30) return "compassionate";

  // Moderate drift still warrants calm
  if (input.drift > 2) return "calm";

  return "calm";
}

// ── Tone Application ──

const TONE_PREFIXES: Record<ToneType, string[]> = {
  calm: ["", "بهدوء: ", "خذ نفسك: "],
  firm: ["مباشرة: ", "بصراحة: ", ""],
  motivational: ["لا تتوقف: ", "أنت على الطريق: ", ""],
  compassionate: ["برفق: ", "خذ وقتك: ", "بحب: "],
};

const TONE_SUFFIXES: Record<ToneType, string[]> = {
  calm: ["", " — كل شيء في وقته", " — لا تستعجل"],
  firm: [" — افعل الآن", " — لا تأجيل", ""],
  motivational: [" — استمر", " — أنت تبني شيء حقيقي", ""],
  compassionate: [" — أنت لست لحالك", " — كل خطوة تحسب", ""],
};

/**
 * Apply tone to a message — adds prefix/suffix for emotional flavor.
 */
export function applyTone(message: string, tone: ToneType): string {
  const prefixes = TONE_PREFIXES[tone];
  const suffixes = TONE_SUFFIXES[tone];

  // Use deterministic selection based on message length to avoid randomness in tests
  const prefixIdx = message.length % prefixes.length;
  const suffixIdx = (message.length + 1) % suffixes.length;

  return `${prefixes[prefixIdx]}${message}${suffixes[suffixIdx]}`;
}

/**
 * Detect and apply tone to a message in one call.
 */
export function adaptToneToMessage(message: string, input: ToneInput): { tone: ToneType; message: string } {
  const tone = detectTone(input);
  return { tone, message: applyTone(message, tone) };
}
