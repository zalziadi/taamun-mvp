/**
 * Server-side journey guard — DB is the ONLY source of truth.
 *
 * This module is called from Server Components (pages) and reads
 * progress directly from Supabase via the cookie-authenticated
 * server client. No localStorage, no V9 state, no race conditions.
 *
 * The mental model:
 *   DB   → determines WHERE the user should be (routing)
 *   state → determines HOW the page looks (UX, voice, bridge)
 *
 * Usage:
 *   const progress = await getServerProgress();
 *   if (progress.redirectTo) redirect(progress.redirectTo);
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { readUserProgress } from "@/lib/progressStore";

export interface ServerProgress {
  authenticated: boolean;
  currentDay: number;
  completedDays: number[];
  totalDays: number;
}

/**
 * Read the user's journey progress directly from the DB.
 * Returns a stable, server-authoritative snapshot.
 *
 * If the user is not authenticated, returns authenticated: false
 * with default values. Callers should redirect to /auth.
 *
 * If the DB read fails, returns currentDay: 1 as a safe fallback
 * so the user is never locked out.
 */
export async function getServerProgress(): Promise<ServerProgress> {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();

  if (authError || !auth?.user) {
    return {
      authenticated: false,
      currentDay: 1,
      completedDays: [],
      totalDays: 28,
    };
  }

  const progress = await readUserProgress(supabase, auth.user.id);

  if (!progress.ok) {
    // DB read failed — fallback to day 1 so user isn't blocked
    return {
      authenticated: true,
      currentDay: 1,
      completedDays: [],
      totalDays: 28,
    };
  }

  return {
    authenticated: true,
    currentDay: progress.currentDay,
    completedDays: progress.completedDays,
    totalDays: 28,
  };
}

/**
 * Determine if a requested day should redirect.
 *
 * Rules (simple, no ambiguity):
 *   - day > currentDay → redirect to currentDay (can't jump forward)
 *   - day ≤ currentDay → allow (current day OR past day revisit)
 *   - invalid day       → redirect to currentDay
 *
 * Returns null if the day is allowed, or a route string if redirect needed.
 */
export function shouldRedirectDay(
  requestedDay: number,
  progress: ServerProgress
): string | null {
  // Invalid day — send to their current day
  if (!Number.isInteger(requestedDay) || requestedDay < 1 || requestedDay > 28) {
    return `/program/day/${progress.currentDay}`;
  }

  // Forward jump — not allowed
  if (requestedDay > progress.currentDay) {
    return `/program/day/${progress.currentDay}`;
  }

  // Current day or backward visit — always allowed
  return null;
}
