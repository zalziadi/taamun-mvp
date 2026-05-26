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

  // 3. User finished the full 28 days → render the grid/completion view
  //    instead of redirecting back into day 28 forever.
  const finished = progress.completedDays.length >= progress.totalDays;

  // 4. User has started but not finished → send to current day
  //    This replaces the old resolveJourneyRoute(journey.state) pattern
  //    which read from localStorage and caused race conditions.
  if (!finished && progress.completedDays.length > 0) {
    redirect(`/program/day/${progress.currentDay}`);
  }

  // 5. Fresh user OR finished user → render the grid (welcome / completion UI)
  return <ProgramPageClient serverCurrentDay={progress.currentDay} />;
}
