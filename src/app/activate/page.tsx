"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { setEntitlement, markCodeUsed } from "../../lib/storage";
import { checkCode, getCodeKind } from "../../lib/activation";
import { setPlan820 } from "../../features/scan";
import { normalizeCode } from "../../lib/storage";
import { StatusCard } from "../../components/StatusCard";

function ActivateContent() {
  const searchParams = useSearchParams();
  const paramCode = searchParams.get("code");

  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "success820" | "invalid" | "used">("idle");
  const [autoChecked, setAutoChecked] = useState(false);

  const doActivate = useCallback((normalized: string) => {
    const result = checkCode(normalized);
    if (result === "ok") {
      const kind = getCodeKind(normalized);
      markCodeUsed(normalized);
      setEntitlement("active");
      if (kind === "plan820") setPlan820(true);
      setStatus(kind === "plan820" ? "success820" : "success");
    } else if (result === "used") {
      setStatus("used");
    } else {
      setStatus("invalid");
    }
  }, []);

  useEffect(() => {
    if (autoChecked) return;
    const raw = paramCode ?? "";
    const normalized = normalizeCode(raw).replace(/\s/g, "");
    if (!normalized) {
      const id = setTimeout(() => setAutoChecked(true), 0);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      setAutoChecked(true);
      doActivate(normalized);
    }, 0);
    return () => clearTimeout(id);
  }, [paramCode, autoChecked, doActivate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    const normalized = normalizeCode(code).replace(/\s/g, "");
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
        {status === "success" || status === "success820" ? (
          <>
            <StatusCard
              title="تم التفعيل بنجاح ✅"
              message={status === "success820" ? "يمكنك الآن استخدام تمعّن كاملاً. تم تفعيل باقة 820 ✅" : "يمكنك الآن استخدام تمعّن كاملاً."}
              variant="success"
            />
            <Link
              href="/day"
              className="inline-block rounded-lg bg-white px-6 py-3 font-medium text-[#0B0F14] transition-colors hover:bg-white/90"
            >
              ابدأ اليوم
            </Link>
          </>
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
                setStatus("idle");
              }}
              className="w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white placeholder:text-white/40"
              placeholder="أدخل الكود أو استخدم الرابط مع ?code=TAAMUN-001"
              dir="ltr"
              autoComplete="off"
            />
            <button
              type="submit"
              className="rounded-lg bg-white px-6 py-3 font-medium text-[#0B0F14] transition-colors hover:bg-white/90"
            >
              تفعيل
            </button>
            {status === "invalid" && (
              <StatusCard
                title="الكود غير موجود"
                message="تأكد من نسخه كما هو."
                variant="warning"
              />
            )}
            {status === "used" && (
              <StatusCard
                title="هذا الكود تم استخدامه على هذا الجهاز سابقاً"
                message="كل كود يُستخدم مرة واحدة على هذا الجهاز."
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
