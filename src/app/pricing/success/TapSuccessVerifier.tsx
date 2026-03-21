"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function TapSuccessVerifier() {
  const sp = useSearchParams();
  const tapId = sp.get("tap_id");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!tapId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/tap/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tap_id: tapId }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          if (!cancelled) {
            if (data.error === "user_mismatch") {
              setMsg("تعذر ربط الدفع بهذا الحساب. سجّل الدخول بنفس الحساب الذي بدأت منه الدفع.");
            } else {
              setMsg("تعذر تأكيد الدفع من الخادم. إذا اكتملت العملية في Tap، انتظر قليلًا ثم حدّث الصفحة.");
            }
          }
        }
      } catch {
        if (!cancelled) setMsg("تعذر الاتصال بالخادم لتأكيد الدفع.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tapId]);

  if (!tapId) return null;
  return msg ? <p className="mt-3 text-xs text-[#9b5548]">{msg}</p> : null;
}
