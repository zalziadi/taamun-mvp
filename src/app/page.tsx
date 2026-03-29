"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { EidiyaLanding } from "./EidiyaLanding";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error && data.user) {
        router.replace("/program");
      } else {
        setReady(true);
      }
    });
  }, [router]);

  if (!ready) return null;
  return <EidiyaLanding />;
}
