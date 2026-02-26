/** Phase → chapter slug mapping for "افتح الفصل المرجعي" button */
export const PHASE_TO_CHAPTER: Record<string, string> = {
  shadow: "muraqabah",
  awareness: "idrak",
  contemplation: "best-potential",
};

export function getChapterSlugForPhase(phase: string): string | null {
  return PHASE_TO_CHAPTER[phase] ?? null;
}
