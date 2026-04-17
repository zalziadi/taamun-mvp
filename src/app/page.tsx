import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JourneyLanding } from "./JourneyLanding";
import { HomeClient } from "./HomeClient";
import { WelcomeGate } from "./WelcomeGate";

/**
 * Server Component homepage — SSR'd for instant LCP.
 *
 * Fast path: check for Supabase auth cookie BEFORE making a full auth call.
 * No cookie → skip auth entirely → render landing instantly (saves ~500ms TTFB).
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ skip?: string }>;
}) {
  const params = await searchParams;

  // Fast path: if no Supabase auth cookie exists, skip the full auth check
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  // No auth cookie → definitely unauthenticated → skip Supabase call
  if (!hasAuthCookie) {
    if (params?.skip !== undefined) {
      return <JourneyLanding />;
    }
    return <WelcomeGate />;
  }

  // Has cookie → verify with Supabase (may be expired)
  let isAuthenticated = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    isAuthenticated = !error && !!data.user;
  } catch {
    // Auth check failed — treat as unauthenticated
  }

  if (isAuthenticated) {
    return <HomeClient />;
  }

  // Cookie exists but invalid → render landing
  if (params?.skip !== undefined) {
    return <JourneyLanding />;
  }
  return <WelcomeGate />;
}
