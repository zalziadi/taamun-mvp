import Link from "next/link";
import { getAppOriginServer } from "../../../lib/appOrigin";
import { AdminActivationsClient } from "./AdminActivationsClient";

function UnauthorizedNav() {
  return (
    <nav className="mb-8 flex gap-4">
      <Link href="/" className="text-white/70 hover:text-white">
        الرئيسية
      </Link>
      <Link href="/admin" className="text-white/70 hover:text-white">
        الأدمن
      </Link>
    </nav>
  );
}

export default async function AdminActivationsPage() {
  const origin = await getAppOriginServer();
  const res = await fetch(`${origin}/api/admin/verify`, {
    cache: "no-store",
  });
  const data = (await res.json()) as { ok?: boolean };
  const isOk = data?.ok === true && res.ok;

  if (!isOk) {
    return (
      <div className="min-h-screen bg-[#0B0F14] p-6">
        <UnauthorizedNav />
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-6">
          <p className="font-medium text-amber-400">غير مسموح</p>
        </div>
      </div>
    );
  }

  return <AdminActivationsClient apiBase={origin} />;
}
