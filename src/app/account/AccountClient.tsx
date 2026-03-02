"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { DAY1_ROUTE } from "@/lib/routes";

interface AccountClientProps {
  embedded?: boolean;
  userEmail: string | null;
}

export function AccountClient({ embedded, userEmail }: AccountClientProps) {
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setError(null);
    setLogoutLoading(true);
    try {
      await supabase.auth.signOut();
      router.push("/auth");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setLogoutLoading(false);
    }
  };

  const content = (
    <div className="w-full max-w-md space-y-4">
      <h1 className="mb-6 text-center text-2xl font-bold text-white">حسابي</h1>

      {userEmail && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="mb-1 text-sm text-white/60">البريد الإلكتروني</p>
          <p className="text-lg text-white">{userEmail}</p>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
          {error}
        </p>
      )}

      <Link
        href={DAY1_ROUTE}
        className="block w-full rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-center font-medium text-white transition-colors hover:bg-white/15"
      >
        ابدأ اليوم الأول
      </Link>

      <button
        type="button"
        onClick={handleLogout}
        disabled={logoutLoading}
        className="w-full rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
      >
        {logoutLoading ? "جاري..." : "تسجيل الخروج"}
      </button>

      <Link
        href="/"
        className="block w-full rounded-xl border border-white/10 px-6 py-3 text-center text-sm text-white/60 transition-colors hover:text-white"
      >
        الرئيسية
      </Link>
    </div>
  );

  if (embedded) {
    return <div className="flex flex-1 flex-col items-center justify-center py-8">{content}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F14] p-6">
      {content}
    </div>
  );
}
