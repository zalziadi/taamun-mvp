"use client";

import { useState, useEffect, useCallback } from "react";
import { APP_NAME } from "@/lib/appConfig";

const PDF_PATH = "/book/city-of-meaning-quran.pdf";

/** Simple in-app PDF viewer. Uses iframe with toolbar hidden. No extra deps. */
export function BookViewer() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const dateStr = new Date().toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const maskedId =
    typeof window !== "undefined"
      ? `#${(Date.now() % 10000).toString(16).padStart(4, "0")}`
      : "";

  useEffect(() => {
    setLoaded(true);
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-center space-y-3">
        <p className="text-amber-400">{error}</p>
        <button
          type="button"
          onClick={() => { setError(null); setLoaded(false); }}
          className="rounded-xl bg-amber-500/20 px-5 py-3.5 text-sm font-medium text-amber-300 hover:bg-amber-500/30 transition-colors"
        >
          حاول مجدداً
        </button>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/30">
      <div
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-30"
        aria-hidden
      >
        <p className="rotate-[-25deg] text-sm text-white/60 select-none">
          {APP_NAME} {maskedId} · {dateStr}
        </p>
      </div>
      <iframe
        src={`${PDF_PATH}#toolbar=0&navpanes=0`}
        title="الكتيّب"
        className="h-[50vh] w-full sm:h-[70vh]"
        onLoad={() => setLoaded(true)}
        onError={() => setError("تعذّر تحميل الكتيّب")}
      />
    </div>
  );
}
