/**
 * Simple in-memory rate limiter (per-process).
 * Works well for serverless with a conservative limit.
 * For multi-instance production, replace with Redis/Upstash.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // clean stale keys every 5 min
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}

/**
 * Check rate limit for a key.
 * @param key       - unique identifier (e.g. user_id)
 * @param limit     - max requests per window
 * @param windowMs  - window size in milliseconds
 * @returns { ok: true } or { ok: false, retryAfterMs: number }
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterMs: number } {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= limit) {
    return { ok: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { ok: true };
}
