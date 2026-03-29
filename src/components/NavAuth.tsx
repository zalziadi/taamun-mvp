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
        className="text-sm font-medium text-[#7b694a] hover:opacity-80"
      >
        حسابي
      </Link>
    );
  }

  return null;
}
