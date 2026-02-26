"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface RequireEntitlementProps {
  children: React.ReactNode;
  subscribeReason?: string;
  allowDemoDay?: boolean;
  demoDayId?: number;
}

const DEMO_DAY_USED_KEY = "taamun.demo.day1.used.v1";

export function markDemoUsed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_DAY_USED_KEY, "1");
  } catch {
    // ignore
  }
}

function isDemoUnused(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DEMO_DAY_USED_KEY) !== "1";
}

export function RequireEntitlement({
  children,
  subscribeReason,
  allowDemoDay = false,
}: RequireEntitlementProps) {
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
      if (allowDemoDay && isDemoUnused()) {
        setStatus("active");
        return;
      }
      setStatus("locked");
      const reason = subscribeReason || "locked";
      router.replace(`/subscribe?reason=${encodeURIComponent(reason)}`);
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, subscribeReason, allowDemoDay]);

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
