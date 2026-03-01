"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function NavAuth() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!ready) return null;

  return loggedIn ? (
    <Link href="/account" className="text-sm font-medium text-gold hover:opacity-80">
      حسابي
    </Link>
  ) : (
    <Link href="/auth" className="text-sm font-medium text-gold hover:opacity-80">
      تسجيل الدخول
    </Link>
  );
}
