import { JourneyLanding } from "./JourneyLanding";
import { HomeClientWrapper } from "./HomeClientWrapper";
import { SocialProofRotator } from "@/components/SocialProofRotator";
import { FeaturedJourney } from "@/components/FeaturedJourney";

/**
 * Homepage — STATIC (cached on CDN).
 *
 * No server-side auth, no dynamic inputs → Next.js pre-renders at build
 * time and Vercel serves from the edge with zero cold start.
 *
 * JourneyLanding: Server Component, rendered at build time.
 * FeaturedJourney + SocialProofRotator: client islands that fetch their
 *   data on mount and render nothing until data exists. Keeps the page
 *   itself static.
 * HomeClientWrapper: client island that checks the auth token from
 *   localStorage and overlays the authed dashboard when present.
 */
export default function Home() {
  return (
    <>
      <JourneyLanding />
      <FeaturedJourney />
      <SocialProofRotator limit={3} />
      <HomeClientWrapper />
    </>
  );
}
