import Link from "next/link";
import { getAppOriginServer } from "../../../lib/appOrigin";
import { AdminActivationsClient } from "./AdminActivationsClient";

interface PageProps {
  searchParams: Promise<{ admin?: string }>;
}

function UnauthorizedNav({ adminQuery }: { adminQuery: string }) {
  const q = adminQuery ? `?admin=${encodeURIComponent(adminQuery)}` : "";
  return (
    <nav className="mb-8 flex gap-4">
      <Link href="/" className="text-white/70 hover:text-white">
        الرئيسية
      </Link>
      <Link href={`/admin${q}`} className="text-white/70 hover:text-white">
        الأدمن
      </Link>
    </nav>
  );
}

export default async function AdminActivationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const adminKey = params.admin ?? "";
  const adminQuery = adminKey ? `admin=${encodeURIComponent(adminKey)}` : "";

  const origin = await getAppOriginServer();
  const res = await fetch(`${origin}/api/admin/verify?key=${encodeURIComponent(adminKey)}`, {
    cache: "no-store",
    headers: {
      "x-admin-key": adminKey,
    },
  });
  const data = (await res.json()) as { ok?: boolean };
  const isOk = data?.ok === true && res.ok;

  if (!isOk) {
    return (
      <div className="min-h-screen bg-[#0B0F14] p-6">
        <UnauthorizedNav adminQuery={adminKey} />
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-6">
          <p className="font-medium text-amber-400">غير مسموح</p>
        </div>
      </div>
    );
  }

  return <AdminActivationsClient adminQuery={adminQuery} apiBase={origin} />;
}
