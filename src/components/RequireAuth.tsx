"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

interface RequireAuthProps {
  children: React.ReactNode;
  next?: string;
}

export function RequireAuth({ children, next }: RequireAuthProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus("authenticated");
      } else {
        setStatus("unauthenticated");
        const suffix = next ? `?next=${encodeURIComponent(next)}` : "";
        router.replace(`/auth${suffix}`);
      }
    });
  }, [router, next]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setStatus("authenticated");
      else {
        setStatus("unauthenticated");
        const suffix = next ? `?next=${encodeURIComponent(next)}` : "";
        router.replace(`/auth${suffix}`);
      }
    });
    return () => subscription.unsubscribe();
  }, [router, next]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] p-6">
        <p className="text-white/70">جارٍ التحقق...</p>
      </div>
    );
  }

  return <>{children}</>;
}
