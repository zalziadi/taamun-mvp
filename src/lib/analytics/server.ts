/**
 * src/lib/analytics/server.ts
 *
 * Server-side PostHog event emission. Lives in its own file (NOT in
 * `src/lib/analytics.ts`) because that file carries a `"use client"` pragma
 * required by the browser-only `posthog-js` SDK. Splitting keeps:
 *
 *   - `src/lib/analytics.ts`           → client helpers (`initAnalytics`,
 *                                        `track`, `trackFbq`, `identifyUser`)
 *                                        — `person_profiles: "never"` preserved
 *   - `src/lib/analytics/server.ts`    → server helpers (`emitEvent`)
 *   - `src/lib/analytics/events.ts`    → shared typed event catalog
 *
 * Plan 06.01 · Option B · ANALYTICS-07 / ANALYTICS-08 / NFR-08.
 *
 * Transport: native `fetch` POST to PostHog's Capture API. We intentionally
 * do NOT depend on `posthog-node` (banned by CLAUDE.md rule #6 and STACK.md
 * "no new deps"). The Capture API contract is a stable public HTTP endpoint
 * documented at https://app.posthog.com/capture/ — `fetch` is sufficient.
 *
 * Error model: never throws. Emission is fire-and-forget from the caller's
 * perspective; analytics failures must NEVER block a user-facing API route's
 * success response. Missing env vars are also a silent no-op so local dev
 * without PostHog configured doesn't crash `/api/program/*` handlers.
 */

import { assertAllowedProperties, type TypedEvent } from "./events";

/**
 * Emit a typed analytics event to PostHog server-side.
 *
 * @param event      Discriminated event from `./events` — name + typed properties.
 * @param distinctId Stable user identifier (Supabase user id preferred; anonymous
 *                   UUID is acceptable when pre-auth). Must not be PII.
 *
 * Behavior:
 *   - No-op (returns resolved Promise<void>) if `NEXT_PUBLIC_POSTHOG_KEY` or
 *     `NEXT_PUBLIC_POSTHOG_HOST` is missing.
 *   - Catches all fetch / network errors and logs via `console.warn`; never
 *     rejects the returned Promise.
 *   - Does NOT touch `window`, `document`, or `localStorage` — safe for Node.js
 *     runtime Route Handlers.
 */
export async function emitEvent(
  event: TypedEvent,
  distinctId: string
): Promise<void> {
  // ANALYTICS-12 runtime defense (Plan 06.02):
  // Reject banned property-name patterns BEFORE any network I/O. TypeScript's
  // `TypedEvent` narrowing is bypassable via `as any`; this guard is not.
  // In dev/CI the error propagates so violations are caught loudly; in prod
  // we swallow + warn so analytics failures never break a user-facing route.
  try {
    assertAllowedProperties(
      event.properties as Record<string, unknown>
    );
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      throw err;
    }
    console.warn(
      "[analytics] emitEvent rejected:",
      (err as Error).message
    );
    return;
  }

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  // Silent no-op in environments without PostHog configured (local dev, CI).
  if (!key || !host) return;

  try {
    await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event: event.name,
        distinct_id: distinctId,
        properties: event.properties,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    // Analytics failures must never block the caller's success path.
    console.warn("[analytics] emitEvent failed:", err);
  }
}
