"use client";

import Link from "next/link";
export default function AdminCodesPage() {
  return (
    <div className="min-h-screen bg-[#0B0F14] p-6">
      <nav className="mb-8 flex gap-4">
        <Link href="/" className="text-white/70 hover:text-white">
          الرئيسية
        </Link>
        <Link href="/admin" className="text-white/70 hover:text-white">
          الأدمن
        </Link>
      </nav>
      <h1 className="mb-6 text-2xl font-bold text-white">الأكواد</h1>
      <div className="rounded-xl border border-white/20 bg-white/5 p-6 text-white/80">
        إدارة الأكواد انتقلت إلى واجهات الأدمن المربوطة بقاعدة البيانات.
      </div>
    </div>
  );
}
