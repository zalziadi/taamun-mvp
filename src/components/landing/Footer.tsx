import Link from "next/link";
import { APP_NAME } from "@/lib/appConfig";

export function LandingFooter() {
  return (
    <footer className="mx-auto w-full max-w-[1080px] px-5 sm:px-8 pb-10 pt-6">
      <div className="border-t border-[color:var(--glass-border)] pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-[13px] text-[color:var(--text-mid)]">
          {`© ${new Date().getFullYear()} ${APP_NAME} — رحلة 28 يومًا.`}
        </div>
        <div className="flex items-center gap-4 text-[13px] text-[color:var(--text-mid)]">
          <Link className="hover:text-[color:var(--ink)]" href="/progress">
            تقدمك
          </Link>
          <Link className="hover:text-[color:var(--ink)]" href="/activate">
            التفعيل
          </Link>
        </div>
      </div>
    </footer>
  );
}
