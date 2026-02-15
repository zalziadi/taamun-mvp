"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { isAdminRequest } from "../../../lib/admin";
import { BASE_CODES, PLAN_820_CODES } from "../../../lib/activation";
import { getUsedCodes, clearUsedCodes } from "../../../lib/storage";
import { getAppOriginClient } from "../../../lib/appOrigin";

function copyToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text);
  }
}

function CodeRow({
  code,
  used,
  origin,
}: {
  code: string;
  used: boolean;
  origin: string;
}) {
  const link = `${origin}/activate?code=${code}`;
  const whatsappMsg = `تم تأكيدك ✅ هذا رابط التفعيل: ${link}`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
      <code className="text-white/90">{code}</code>
      <span className={`text-sm ${used ? "text-amber-400" : "text-emerald-400"}`}>
        {used ? "مستخدم" : "متاح"}
      </span>
      <div className="flex flex-wrap gap-2">
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
        <button
          type="button"
          onClick={() => copyToClipboard(whatsappMsg)}
          className="rounded bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400 hover:bg-emerald-500/30"
        >
          نسخ واتساب
        </button>
      </div>
    </div>
  );
}

function CodesContent() {
  const searchParams = useSearchParams();
  const adminKey = searchParams.get("admin") ?? "";
  const isAdmin = isAdminRequest(adminKey || undefined);
  const query = adminKey ? `?admin=${encodeURIComponent(adminKey)}` : "";
  const [refreshKey, setRefreshKey] = useState(0);

  const usedCodes = getUsedCodes();
  const origin = getAppOriginClient();

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

      <h1 className="mb-6 text-2xl font-bold text-white">الأكواد</h1>

      <div className="mb-6">
        <button
          type="button"
          onClick={handleClearUsed}
          className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20"
        >
          مسح الأكواد المستخدمة (هذا الجهاز)
        </button>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-white/90">أكواد 280 (Base)</h2>
        <div className="space-y-2">
          {BASE_CODES.map((code) => (
            <CodeRow
              key={code}
              code={code}
              used={usedCodes.includes(code)}
              origin={origin}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold text-white/90">أكواد 820 (Scan)</h2>
        <div className="space-y-2">
          {PLAN_820_CODES.map((code) => (
            <CodeRow
              key={code}
              code={code}
              used={usedCodes.includes(code)}
              origin={origin}
            />
          ))}
        </div>
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
