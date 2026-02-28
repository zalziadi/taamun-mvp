"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [message, setMessage] = useState("جاري تأكيد عملية الدفع...");

  const sessionId = useMemo(() => searchParams.get("session_id")?.trim() ?? "", [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function confirm() {
      if (!sessionId) {
        if (!cancelled) {
          setStatus("error");
          setMessage("معرّف الجلسة غير موجود.");
        }
        return;
      }
      try {
        const res = await fetch(`/api/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          if (!cancelled) {
            setStatus("error");
            setMessage("تم الدفع لكن تعذر تفعيل الاشتراك تلقائياً. جرّب مرة أخرى.");
          }
          return;
        }
        if (!cancelled) {
          setStatus("done");
          setMessage("تم تفعيل اشتراكك بنجاح. جارٍ تحويلك...");
          setTimeout(() => {
            router.replace("/day/1");
          }, 1200);
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("حدث خطأ أثناء التأكيد.");
        }
      }
    }

    confirm();
    return () => {
      cancelled = true;
    };
  }, [router, sessionId]);

  return (
    <AppShell title="تأكيد الدفع">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">تأكيد الدفع</h1>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/85">
          {status === "loading" && <p>{message}</p>}
          {status === "done" && <p>{message}</p>}
          {status === "error" && (
            <div className="space-y-4">
              <p className="text-red-300">{message}</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => router.refresh()}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10"
                >
                  إعادة المحاولة
                </button>
                <Link href="/subscribe" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0B0F14]">
                  العودة للاشتراك
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <AppShell title="تأكيد الدفع">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/85">
            جاري التحقق...
          </div>
        </AppShell>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
