"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { isEntitled } from "../../lib/storage";
import { BookViewer } from "../../components/BookViewer";
import { track } from "../../lib/analytics";

function BookContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const entitled = isEntitled();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && entitled) track("book_opened", {});
  }, [mounted, entitled]);

  useEffect(() => {
    if (!mounted) return;
    if (!entitled) {
      router.replace("/subscribe?reason=book");
      return;
    }
  }, [mounted, entitled, router]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] p-6">
        <p className="text-white/70">جاري التحميل...</p>
      </div>
    );
  }

  if (!entitled) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] p-6">
      <nav className="mb-8 flex flex-wrap gap-4">
        <Link href="/" className="text-white/70 hover:text-white">
          الرئيسية
        </Link>
        <Link href="/day" className="text-white/70 hover:text-white">
          اليوم
        </Link>
        <Link href="/progress" className="text-white/70 hover:text-white">
          التقدم
        </Link>
      </nav>

      <h1 className="mb-6 text-2xl font-bold text-white">مدينة المعنى بلغة القرآن</h1>
      <p className="mb-6 text-white/70">
        الدليل والتطبيق — اقرأ في المتصفح
      </p>

      <BookViewer />
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#0B0F14] p-6 text-white/70">جاري التحميل...</div>}>
      <BookContent />
    </Suspense>
  );
}
