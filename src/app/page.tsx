import Link from "next/link";
import { AppShell } from "../components/AppShell";
import { HomeLinks } from "../components/HomeLinks";
import { StartTodayButton } from "../components/StartTodayButton";

export default function LandingPage() {
  return (
    <AppShell title="الرحلة">
      <div className="flex flex-col items-center justify-center py-8">
        <h1 className="tmn-hero-animate mb-2 text-3xl font-bold text-white">تمَعُّن</h1>
        <p className="tmn-hero-animate mb-12 text-white/70" style={{ animationDelay: "80ms" }}>
          28 يوماً في رحلة رمضان
        </p>

        <div className="tmn-hero-animate flex flex-col gap-4 text-center" style={{ animationDelay: "160ms" }}>
          <StartTodayButton />
          <Link
            href="/progress"
            className="rounded-xl border border-white/20 bg-white/5 px-10 py-4 text-white transition-colors hover:bg-white/10"
          >
            شاهد التقدم
          </Link>
          <Link
            href="/subscribe"
            className="rounded-xl border border-white/20 bg-white/5 px-10 py-4 text-white transition-colors hover:bg-white/10"
          >
            اشتراك
          </Link>
          <HomeLinks />
        </div>
      </div>
    </AppShell>
  );
}
