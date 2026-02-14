"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { isAdminRequest } from "../../../lib/admin";
import { VALID_CODES } from "../../../lib/activation";
import { getUsedCodes, clearUsedCodes } from "../../../lib/storage";

function CodesContent() {
  const searchParams = useSearchParams();
  const isAdmin = isAdminRequest(searchParams);
  const adminKey = searchParams.get("admin") ?? "";
  const query = adminKey ? `?admin=${encodeURIComponent(adminKey)}` : "";
  const [refreshKey, setRefreshKey] = useState(0);

  const usedCodes = getUsedCodes();
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
  };

  const handleClearUsed = () => {
    if (confirm("هل تريد مسح قائمة الأكواد المستخدمة (هذا الجهاز فقط)؟")) {
      clearUsedCodes();
      setRefreshKey((k) => k + 1);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0B0F14] p-6">
        <nav className="mb-8 flex gap-4">
          <Link href="/" className="text-white/70 hover:text-white">
            الرئيسية
          </Link>
          <Link href={`/admin${query}`} className="text-white/70 hover:text-white">
            الأدمن
          </Link>
        </nav>
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-6">
          <p className="font-medium text-amber-400">غير مسموح</p>
          <Link href={`/admin${query}`} className="mt-2 inline-block text-white/70 hover:text-white">
            العودة للأدمن
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] p-6" key={refreshKey}>
      <nav className="mb-8 flex gap-4">
        <Link href="/" className="text-white/70 hover:text-white">
          الرئيسية
        </Link>
        <Link href={`/admin${query}`} className="text-white/70 hover:text-white">
          الأدمن
        </Link>
      </nav>

      <h1 className="mb-6 text-2xl font-bold text-white">الأكواد (28)</h1>

      <div className="mb-6">
        <button
          type="button"
          onClick={handleClearUsed}
          className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
        >
          مسح الأكواد المستخدمة (هذا الجهاز)
        </button>
      </div>

      <div className="space-y-2">
        {VALID_CODES.map((code: string) => {
          const used = usedCodes.includes(code);
          const link = `${origin}/activate?code=${code}`;
          return (
            <div
              key={code}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 p-3"
            >
              <code className="text-white/90">{code}</code>
              <span
                className={`text-sm ${used ? "text-amber-400" : "text-emerald-400"}`}
              >
                {used ? "مستخدم" : "متاح"}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(link)}
                  className="rounded bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
                >
                  نسخ رابط التفعيل
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(code)}
                  className="rounded bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
                >
                  نسخ الكود
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminCodesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0F14] p-6 text-white">جاري التحميل...</div>}>
      <CodesContent />
    </Suspense>
  );
}
