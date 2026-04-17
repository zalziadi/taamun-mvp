import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JourneyLanding } from "./JourneyLanding";
import { HomeClient } from "./HomeClient";
import { WelcomeGate } from "./WelcomeGate";

/**
 * Server Component homepage — SSR'd for instant LCP.
 *
 * Unauthenticated users: JourneyLanding rendered from server (no JS wait).
 * Authenticated users: HomeClient island (client hydration for dashboard).
 *
 * Eliminates the 6s LCP from client-side Supabase auth check.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ skip?: string }>;
}) {
  const params = await searchParams;

  // Server-side auth check via cookie
  let isAuthenticated = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    isAuthenticated = !error && !!data.user;
  } catch {
    // Auth check failed — treat as unauthenticated
  }

  // Authenticated → client island dashboard
  if (isAuthenticated) {
    return <HomeClient />;
  }

  // Skip param → go directly to landing
  if (params?.skip !== undefined) {
    return <JourneyLanding />;
  }

  // Unauthenticated without skip → WelcomeGate checks localStorage
  return <WelcomeGate />;
}
