/**
 * Sacred path exclusions per .planning/phases/06-posthog-event-instrumentation/06-CONTEXT.md
 * §"Privacy exclusions (paths)" and REQUIREMENTS ANALYTICS-09.
 *
 * Zero PostHog `$pageview` or `capture(...)` calls are allowed on these routes.
 * PROJECT.md principle #4: no tracking on prayer/reflection pages — non-negotiable.
 *
 * Source of truth consumed by:
 *   - PageviewTracker (runtime, Plan 06.03)
 *   - CI grep (build-time, Plan 06.06)
 */
export const EXCLUDED_PATH_PREFIXES: readonly string[] = [
  "/day",
  "/reflection",
  "/book",
  "/program/day",
  "/api/guide",
  "/guide",
] as const;

/**
 * Returns true when the given pathname matches any sacred-path prefix
 * either exactly (e.g. "/day") or as a subpath (e.g. "/day/7", "/book/chapter-1").
 *
 * `/program` alone is NOT excluded — only `/program/day/*`.
 */
export function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
