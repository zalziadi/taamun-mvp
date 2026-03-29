"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function NavAuth() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      setLoggedIn(!error && !!data.user);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!ready) return null;

  if (loggedIn) {
    return (
      <Link
        href="/account"
        className="rounded-lg border border-[#d8cdb9] bg-[#fcfaf7]/80 px-4 py-1.5 text-sm font-medium text-[#7b694a] transition-colors hover:bg-[#f4efe7]"
      >
        حسابي
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded-lg border border-[#c9b88a] bg-[#c9b88a]/10 px-4 py-1.5 text-sm font-medium text-[#7b694a] transition-colors hover:bg-[#c9b88a]/20"
    >
      تسجيل الدخول
    </Link>
  );
}
