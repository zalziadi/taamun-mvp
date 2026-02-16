import { LandingFooter } from "@/components/landing/Footer";
import { LandingHero } from "@/components/landing/Hero";
import { LandingNavbar } from "@/components/landing/Navbar";
import { LandingSections } from "@/components/landing/Sections";
import { amiri, tajawal } from "@/components/landing/landing-fonts";

export default function HomePage() {
  return (
    <main
      className={`theme-parchment ${tajawal.variable} ${amiri.variable} min-h-screen bg-[color:var(--parchment)]`}
    >
      <LandingNavbar />
      <LandingHero />
      <LandingSections />
      <LandingFooter />
    </main>
  );
}
