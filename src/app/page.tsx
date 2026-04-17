import { JourneyLanding } from "./JourneyLanding";
import { HomeClientWrapper } from "./HomeClientWrapper";

/**
 * Homepage — STATIC (cached on CDN).
 *
 * No cookies(), no server auth, no searchParams → Next.js pre-renders this
 * as a static page. Vercel serves it from the edge with zero cold start.
 *
 * JourneyLanding: Server Component, rendered at build time.
 * HomeClientWrapper: Client island, checks auth on mount:
 *   - Has token → overlays with HomeClient dashboard
 *   - No token → landing stays visible, checks welcome gate
 *
 * LCP is instant because the HTML is pre-built and cached.
 */
export default function Home() {
  return (
    <>
      <JourneyLanding />
      <HomeClientWrapper />
    </>
  );
}
