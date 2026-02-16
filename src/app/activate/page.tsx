"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { StatusCard } from "../../components/StatusCard";

function ActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramCode = searchParams.get("code");

  const [code, setCode] = useState(paramCode ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "invalid" | "auth">("idle");
  const [autoChecked, setAutoChecked] = useState(false);

  const doActivate = useCallback(
    async (normalized: string) => {
      setStatus("loading");
      try {
        const res = await fetch("/api/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: normalized }),
        });
        const data = (await res.json()) as { ok?: boolean };
        if (data?.ok) {
          setStatus("success");
          router.replace("/day");
        } else if (res.status === 401) {
          setStatus("auth");
        } else {
          setStatus("invalid");
        }
      } catch {
        setStatus("invalid");
      }
    },
    [router]
  );

  useEffect(() => {
    if (autoChecked) return;
    const raw = paramCode ?? "";
    const normalized = raw.trim().toUpperCase().replace(/\s/g, "");
    setAutoChecked(true);
    if (!normalized) return;
    doActivate(normalized);
  }, [paramCode, autoChecked, doActivate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = code.trim().toUpperCase().replace(/\s/g, "");
    if (!normalized) return;
    doActivate(normalized);
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] p-6">
      <nav className="mb-8 flex gap-4">
        <Link href="/" className="text-white/70 hover:text-white">
          الرئيسية
        </Link>
        <Link href="/subscribe" className="text-white/70 hover:text-white">
          الاشتراك
        </Link>
      </nav>

      <h1 className="mb-8 text-2xl font-bold text-white">تفعيل الاشتراك</h1>

      <div className="max-w-md space-y-6">
        {status === "success" ? (
          <StatusCard
            title="تم التفعيل بنجاح ✅"
            message="يتم توجيهك إلى اليوم..."
            variant="success"
          />
        ) : status === "auth" ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
            <p className="font-medium text-amber-400">سجّل الدخول أولاً</p>
            <p className="mt-1 text-sm text-white/80">
              <Link href="/auth?next=/activate" className="underline">
                سجّل الدخول
              </Link>{" "}
              لتتمكن من تفعيل الكود.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor="code" className="block text-white/90">
              كود التفعيل
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (status !== "loading") setStatus("idle");
              }}
              className="w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white placeholder:text-white/40"
              placeholder="أدخل الكود أو استخدم الرابط مع ?code=TAAMUN-001"
              dir="ltr"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-lg bg-white px-6 py-3 font-medium text-[#0B0F14] transition-colors hover:bg-white/90 disabled:opacity-50"
            >
              {status === "loading" ? "جاري..." : "تفعيل"}
            </button>
            {status === "invalid" && (
              <StatusCard
                title="الكود غير صالح أو مستخدم"
                message="تأكد من نسخه كما هو."
                variant="warning"
              />
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0F14] p-6 text-white">جاري التحميل...</div>}>
      <ActivateContent />
    </Suspense>
  );
}
