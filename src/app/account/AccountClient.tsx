"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export function AccountClient() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/auth");
        return;
      }
      setUser(session.user);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/auth");
        return;
      }
      setUser(session.user);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [router]);

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] p-6">
        <p className="text-white/70">جارٍ التحميل...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F14] p-6">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">حسابي</h1>

        {user?.email && (
          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="mb-1 text-sm text-white/60">البريد الإلكتروني</p>
            <p className="text-lg text-white">{user.email}</p>
          </div>
        )}

        {error && (
          <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleLogout}
          disabled={logoutLoading}
          className="mb-4 w-full rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          {logoutLoading ? "جاري..." : "تسجيل الخروج"}
        </button>

        <Link
          href="/"
          className="block w-full rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-center font-medium text-white transition-colors hover:bg-white/10"
        >
          الرئيسية
        </Link>
      </div>
    </div>
  );
}
