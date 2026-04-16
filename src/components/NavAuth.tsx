"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function NavAuth() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [isVip, setIsVip] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      const hasUser = !error && !!data.user;
      setLoggedIn(hasUser);
      setReady(true);

      if (hasUser && data.user) {
        supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", data.user.id)
          .single()
          .then(({ data: profile }) => {
            const tier = profile?.subscription_tier?.toLowerCase();
            if (tier && ["yearly", "vip", "lifetime", "premium"].includes(tier)) {
              setIsVip(true);
            }
          });
      }
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
        className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
          isVip
            ? "border border-[#c9b88a]/50 bg-gradient-to-l from-[#c9b88a]/20 to-[#c9b88a]/5 text-[#7b694a] hover:from-[#c9b88a]/30 hover:to-[#c9b88a]/10"
            : "border border-[#d8cdb9] bg-[#fcfaf7]/80 text-[#7b694a] hover:bg-[#f4efe7]"
        }`}
      >
        {isVip && (
          <span className="ml-1.5 inline-block rounded-full bg-[#c9b88a] px-1.5 py-px text-[9px] font-bold text-[#15130f] align-middle">
            VIP
          </span>
        )}
        كهفي
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded-lg border border-[#c9b88a] bg-[#c9b88a]/10 px-4 py-2.5 text-sm font-medium text-[#7b694a] transition-colors hover:bg-[#c9b88a]/20"
    >
      تسجيل الدخول
    </Link>
  );
}
