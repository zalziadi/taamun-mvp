import Link from "next/link";
import { HomeLinks } from "../components/HomeLinks";
import { StartTodayButton } from "../components/StartTodayButton";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F14] p-6">
      <h1 className="mb-2 text-3xl font-bold text-white">تمعّن</h1>
      <p className="mb-12 text-white/70">28 يوماً في رحلة رمضان</p>

      <div className="flex flex-col gap-4 text-center">
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
  );
}
