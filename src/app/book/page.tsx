"use client";

import Link from "next/link";
import { isEntitled } from "../../lib/storage";

export default function BookPage() {
  const entitled = isEntitled();

  return (
    <div className="min-h-screen bg-[#0B0F14] p-6">
      <nav className="mb-8">
        <Link href="/" className="text-white/70 hover:text-white">
          الرئيسية
        </Link>
      </nav>

      {!entitled ? (
        <>
          <h1 className="mb-4 text-2xl font-bold text-white">الوصول للكتيّب مقفل</h1>
          <p className="mb-6 text-white/70">لازم الاشتراك أولاً</p>
          <Link
            href="/subscribe?reason=book_locked"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-[#0B0F14] transition-colors hover:bg-white/90"
          >
            الاشتراك
          </Link>
        </>
      ) : (
        <>
          <h1 className="mb-8 text-2xl font-bold text-white">الكتيّب</h1>

          <div className="max-w-lg space-y-6">
            <p className="text-white/80">
              هذا الكتيّب هو الدليل والتطبيق لبرنامج تمعّن — 28 يوماً في رحلة رمضان.
            </p>

            <a
              href="/book/City_of_Meaning_Quran_AR_EN_v0.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-[#0B0F14] transition-colors hover:bg-white/90"
            >
              تحميل الكتيّب PDF
            </a>

            <Link
              href="/subscribe"
              className="inline-block text-white/70 hover:text-white"
            >
              الاشتراك في البرنامج
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
