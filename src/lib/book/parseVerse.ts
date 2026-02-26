export interface VerseReference {
  surah: number;
  ayah: number;
}

export function parseVerseReference(input: string): VerseReference | null {
  const value = input.trim();
  if (!value) return null;

  // Supports patterns like "2:255", "2/255", "سورة ... (2:255)".
  const match = value.match(/(\d{1,3})\s*[:/]\s*(\d{1,3})/);
  if (!match) return null;

  const surah = Number(match[1]);
  const ayah = Number(match[2]);
  if (!Number.isFinite(surah) || !Number.isFinite(ayah)) return null;
  if (surah < 1 || surah > 114) return null;
  if (ayah < 1 || ayah > 286) return null;

  return { surah, ayah };
}
