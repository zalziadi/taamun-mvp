/**
 * /program/day/[id] — Server Component with DB-first guard.
 *
 * Architecture:
 *   1. Server reads progress from DB (via serverGuard.ts)
 *   2. If day > currentDay → redirect (Next.js server redirect, instant)
 *   3. If not authenticated → redirect to /auth
 *   4. Otherwise → render DayPageClient (all UI logic)
 *
 * Why Server Component:
 *   - No race conditions (DB read completes before render)
 *   - No flash of wrong content
 *   - No dependency on localStorage for routing
 *   - redirect() is instant (HTTP 307), not a client-side router.replace
 *
 * What this file does NOT import:
 *   ❌ resolveJourneyRoute
 *   ❌ hasStarted
 *   ❌ classifyVisit / reconciliationFor
 *   ❌ useJourneyMemory (that's in the Client Component)
 *   ❌ useRouter / useParams (Server Components don't use hooks)
 */

import { redirect } from "next/navigation";
import { getServerProgress, shouldRedirectDay } from "@/lib/journey/serverGuard";
import DayPageClient from "./DayPageClient";

type Params = {
  params: Promise<{ id: string }>;
};

export default async function DayPage({ params }: Params) {
  const { id } = await params;
  const day = Number(id);

  // 1. Read progress from DB — the ONLY source of truth for routing
  const progress = await getServerProgress();

  // 2. Not authenticated → send to auth
  if (!progress.authenticated) {
    redirect(`/auth?next=${encodeURIComponent(`/program/day/${day}`)}`);
  }

  // 3. Check if this day is allowed
  const redirectTo = shouldRedirectDay(day, progress);
  if (redirectTo) {
    redirect(redirectTo);
  }

  // 4. Day is valid — render the client component
  return <DayPageClient day={day} />;
}
