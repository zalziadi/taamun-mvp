/**
 * Slug helpers for creator journeys.
 * We keep slugs URL-safe and stable so they can be shared publicly.
 */

function toLatinBase(input: string): string {
  // Strip Arabic diacritics, normalize to lowercase, convert Arabic letters
  // to a rough Latin transliteration is overkill — keep Arabic if possible
  // by URL-encoding, but for slugs we prefer ASCII.
  return input
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670]/g, "") // Arabic diacritics
    .toLowerCase()
    .trim();
}

/**
 * Create a base slug from a title. If the title has no ASCII letters,
 * returns an empty string — caller must fall back to a random suffix.
 */
export function slugifyTitle(title: string): string {
  const base = toLatinBase(title)
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return base;
}

export function randomSuffix(len = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/** Build a full slug: base + short suffix for uniqueness. */
export function buildSlug(title: string): string {
  const base = slugifyTitle(title);
  const suffix = randomSuffix();
  return base ? `${base}-${suffix}` : `journey-${suffix}`;
}
