/**
 * /program — Server Component entry gate.
 *
 * DB-first routing:
 *   1. Read progress from Supabase (via serverGuard)
 *   2. If user has completed ≥ 1 day → server redirect to their current day
 *   3. If fresh user (no completions) → render ProgramPageClient (the grid)
 *   4. If not authenticated → redirect to /auth
 *
 * What this file does NOT import:
 *   ❌ resolveJourneyRoute
 *   ❌ hasStarted
 *   ❌ useJourneyMemory
 *   ❌ useRouter / useEffect
 *   ❌ Any localStorage-based logic
 *
 * The grid is the "welcome UI" for fresh users. Returning users never
 * see it — they go straight to their current day via HTTP 307.
 */

import { redirect } from "next/navigation";
import { getServerProgress } from "@/lib/journey/serverGuard";
import ProgramPageClient from "./ProgramPageClient";

export default async function ProgramPage() {
  // 1. Read progress from DB — the ONLY source of truth
  const progress = await getServerProgress();

  // 2. Not authenticated → auth gate
  if (!progress.authenticated) {
    redirect("/auth?next=/program");
  }

  // 3. User has started (any completed day) → send to current day
  //    This replaces the old resolveJourneyRoute(journey.state) pattern
  //    which read from localStorage and caused race conditions.
  if (progress.completedDays.length > 0) {
    redirect(`/program/day/${progress.currentDay}`);
  }

  // 4. Fresh user → show the 28-day grid as welcome UI
  return <ProgramPageClient serverCurrentDay={progress.currentDay} />;
}
