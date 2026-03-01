"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// All content is free — redirect to program directly
export default function SubscribePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/program");
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F14]">
      <p className="text-white/60">جارٍ التحويل...</p>
    </div>
  );
}
