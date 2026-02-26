"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { BookViewer } from "../../components/BookViewer";
import { track } from "../../lib/analytics";

function BookContent() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [entitled, setEntitled] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/entitlement", { cache: "no-store" })
      .then(async (res) => {
        if (!active) return;
        if (!res.ok) {
          setEntitled(false);
          return;
        }
        const data = (await res.json()) as { active?: boolean };
        setEntitled(Boolean(data.active));
      })
      .catch(() => {
        if (!active) return;
        setEntitled(false);
      })
      .finally(() => {
        if (!active) return;
        setChecking(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (entitled) track("book_opened", {});
  }, [entitled]);

  useEffect(() => {
    if (checking) return;
    if (!entitled) {
      router.replace("/subscribe?reason=book");
      return;
    }
  }, [checking, entitled, router]);

  if (checking) {
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
