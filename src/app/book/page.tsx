"use client";

import { Suspense } from "react";
import { BookViewer } from "../../components/BookViewer";

function BookContent() {
  return (
    <div className="min-h-screen bg-[#0B0F14] p-6">
      <h1 className="mb-4 text-2xl font-bold text-white">مدينة المعنى بلغة القرآن</h1>
      <p className="mb-6 text-white/70">الدليل والتطبيق — اقرأ في المتصفح</p>
      <BookViewer />
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] p-6 text-white/70">
        جاري التحميل...
      </div>
    }>
      <BookContent />
    </Suspense>
  );
}
