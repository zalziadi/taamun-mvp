"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { isAdminRequest } from "../../lib/admin";

function AdminContent() {
  const searchParams = useSearchParams();
  const isAdmin = isAdminRequest(searchParams);
  const adminKey = searchParams.get("admin") ?? "";
  const query = adminKey ? `?admin=${encodeURIComponent(adminKey)}` : "";

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0B0F14] p-6">
        <nav className="mb-8">
          <Link href="/" className="text-white/70 hover:text-white">
            الرئيسية
          </Link>
        </nav>
        <h1 className="mb-8 text-2xl font-bold text-white">لوحة الأدمن</h1>
        <div className="max-w-md rounded-xl border border-amber-500/40 bg-amber-500/10 p-6">
          <p className="font-medium text-amber-400">غير مسموح</p>
          <p className="mt-1 text-sm text-white/80">يجب استخدام المفتاح الصحيح للوصول.</p>
          <Link
            href="/subscribe"
            className="mt-4 inline-block text-white/70 hover:text-white"
          >
            الاشتراك
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] p-6">
      <nav className="mb-8">
        <Link href="/" className="text-white/70 hover:text-white">
          الرئيسية
        </Link>
      </nav>
      <h1 className="mb-8 text-2xl font-bold text-white">لوحة الأدمن</h1>
      <div className="max-w-md space-y-4">
        <Link
          href={`/admin/codes${query}`}
          className="block rounded-xl border border-white/20 bg-white/5 px-6 py-4 text-white transition-colors hover:bg-white/10"
        >
          الأكواد (28)
        </Link>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B0F14] p-6 text-white">جاري التحميل...</div>}>
      <AdminContent />
    </Suspense>
  );
}
