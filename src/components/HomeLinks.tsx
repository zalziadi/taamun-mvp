import Link from "next/link";

/** Quick navigation links shown on home page */
export function HomeLinks() {
  return (
    <Link
      href="/scan"
      className="rounded-xl border border-white/20 bg-white/5 px-10 py-4 text-white transition-colors hover:bg-white/10"
    >
      مسح آية
    </Link>
  );
}
