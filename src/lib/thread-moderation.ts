/**
 * Thread auto-moderation: instant-publish for clean content; flag anything
 * that contains URL / domain / handle patterns for founder review.
 */
export function moderate(text: string): "published" | "flagged" {
  if (/(https?:\/\/|www\.|\.com|\.net|\.org|\.sa|@[a-zA-Z])/.test(text)) {
    return "flagged";
  }
  return "published";
}
