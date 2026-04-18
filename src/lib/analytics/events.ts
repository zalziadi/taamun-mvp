/**
 * src/lib/analytics/events.ts
 *
 * SINGLE source of truth for v1.2 PostHog analytics event shapes.
 *
 * Every v1.2 retention event — across Phases 6 through 11 — is defined here
 * as a variant of the `TypedEvent` discriminated union. Plans that wire call
 * sites MUST import `TypedEvent` from this module and MUST NOT invent new
 * event names or property keys locally.
 *
 * Call-site ownership:
 *   - `day_complete`               → Plan 06.04 (proof-of-pipeline)
 *   - `cycle_start`                → Phase 7 (Cycle 2 Transition)
 *   - `badge_unlock`               → Phase 8 (Milestone Badges)
 *   - `renewal_prompted`           → Phase 9 (Renewal Prompts In-App)
 *   - `referral_code_generated`    → Phase 10 (Referral Program)
 *   - `referral_code_redeemed`     → Phase 10 (Referral Program)
 *   - `year_review_opened`         → Phase 11 (Year-in-Review Archive)
 *   - `year_review_shared`         → Phase 11 (Year-in-Review Archive)
 *
 * Privacy contract (REQ: ANALYTICS-11, ANALYTICS-12):
 *   - Property names are drawn ONLY from the `ALLOWED_PROPERTY_KEYS` whitelist
 *     below. Names matching `*_email`, `*_phone`, `reflection_*`, `verse_*`,
 *     `journal_*`, `message_*`, `prayer_*` are BANNED and must never be added.
 *   - This module imports nothing from `posthog-js` or any client-only package,
 *     so it is safe to import from Next.js Route Handlers and Server Components.
 *   - To avoid an import cycle with `src/lib/analytics.ts` (which has
 *     `"use client"` on line 1), this file never imports from `../analytics`.
 *
 * Never add `as any` escape hatches to widen `TypedEvent` — downstream typed
 * helpers rely on exhaustive narrowing via the discriminator.
 */

export type TypedEvent =
  | {
      name: "day_complete";
      properties: {
        day_number: number;
        cycle_number: number;
        tier: string;
      };
    }
  | {
      name: "cycle_start";
      properties: {
        new_cycle_number: number;
        prior_cycle_days_completed: number;
        tier: string;
      };
    }
  | {
      name: "badge_unlock";
      properties: {
        badge_code: string;
        day_number: number;
        cycle_number: number;
      };
    }
  | {
      name: "renewal_prompted";
      properties: {
        renewal_days_remaining: number;
        gateway: "salla" | "tap" | "stripe";
        tier: string;
      };
    }
  | {
      name: "referral_code_generated";
      properties: {
        referral_code_prefix: string;
      };
    }
  | {
      name: "referral_code_redeemed";
      properties: {
        referral_code_prefix: string;
      };
    }
  | {
      name: "year_review_opened";
      properties: {
        year_key: string;
        reflections_count: number;
      };
    }
  | {
      name: "year_review_shared";
      properties: {
        year_key: string;
        reflections_count: number;
      };
    };

/**
 * Whitelist of property keys permitted on any PostHog event emitted from
 * Taamun. Plan 06.02 will import this constant to build:
 *   (1) the runtime property-shape guard in the server emitter, and
 *   (2) the CI grep lint rule that fails the build on any property name
 *       outside this list.
 *
 * Derived from `.planning/phases/06-posthog-event-instrumentation/06-CONTEXT.md`
 * §"Property whitelist" and `.planning/research/SUMMARY.md` §R5.
 */
export const ALLOWED_PROPERTY_KEYS: readonly string[] = [
  "day_number",
  "cycle_number",
  "new_cycle_number",
  "prior_cycle_days_completed",
  "milestone_code",
  "badge_code",
  "referral_code_prefix",
  "renewal_days_remaining",
  "gateway",
  "tier",
  "year_key",
  "reflections_count",
] as const;
