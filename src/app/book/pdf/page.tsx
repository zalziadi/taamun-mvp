"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { AppShell } from "../../../components/AppShell";
import { RequireAuth } from "../../../components/RequireAuth";
import { RequireEntitlement } from "../../../components/RequireEntitlement";

const PDF_PATH = "/book/city-of-meaning-quran.pdf";
const DEFAULT_PAGE = 3;

function PdfViewerContent() {
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const page = Math.max(1, parseInt(String(pageParam), 10) || DEFAULT_PAGE);
  const prevPage = Math.max(1, page - 1);
  const nextPage = page + 1;

  const iframeSrc = `${PDF_PATH}#page=${page}&view=FitH`;

  return (
    <AppShell title="المرجع">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`/book/pdf?page=${prevPage}`}
            className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-white transition-colors hover:bg-white/10 disabled:opacity-40"
          >
            السابق
          </Link>
          <span className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-white/80">
            صفحة {page}
          </span>
          <Link
            href={`/book/pdf?page=${nextPage}`}
            className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-white transition-colors hover:bg-white/10"
          >
            التالي
          </Link>
          <Link
            href="/book"
            className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-white transition-colors hover:bg-white/10"
          >
            رجوع للمرجع
          </Link>
          <Link
            href="/day"
            className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-white transition-colors hover:bg-white/10"
          >
            رجوع لليوم
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
          <iframe
            src={iframeSrc}
            title="مدينة المعنى بلغة القرآن"
            className="h-[70vh] w-full"
          />
        </div>
      </div>
    </AppShell>
  );
}

export default function PdfPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center p-6 text-white/70">جاري التحميل...</div>}>
      <PdfWrapper />
    </Suspense>
  );
}

function PdfWrapper() {
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const page = Math.max(1, parseInt(String(pageParam), 10) || DEFAULT_PAGE);
  const next = `/book/pdf?page=${page}`;

  return (
    <RequireAuth next={next}>
      <RequireEntitlement subscribeReason="reference_locked">
        <PdfViewerContent />
      </RequireEntitlement>
    </RequireAuth>
  );
}
