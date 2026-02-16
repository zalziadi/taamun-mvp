"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface RequireEntitlementProps {
  children: React.ReactNode;
}

export function RequireEntitlement({ children }: RequireEntitlementProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "active" | "auth" | "locked" | "error">("loading");

  const runCheck = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/entitlement", { cache: "no-store" });
      const data = await res.json();
      if (res.status === 401) {
        setStatus("auth");
        router.replace("/auth");
        return;
      }
      if (data?.active) {
        setStatus("active");
        return;
      }
      setStatus("locked");
      router.replace("/subscribe?reason=locked");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    runCheck();
  }, [router]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0B0F14] p-6">
        <p className="text-sm text-red-400">فشل التحقق من الاشتراك.</p>
        <button
          type="button"
          onClick={() => runCheck()}
          className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white hover:bg-white/10"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (status !== "active") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] p-6">
        <p className="text-white/70">جارٍ التحقق من الاشتراك...</p>
      </div>
    );
  }

  return <>{children}</>;
}
