"use client";

import { useState } from "react";

type IngestResponse = {
  ok?: boolean;
  chunks?: number;
  error?: string;
};

export function AdminRagIngestCard() {
  const [loading, setLoading] = useState(false);
  const [reset, setReset] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function runIngest() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/guide/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset }),
      });
      const data = (await res.json()) as IngestResponse;
      if (!res.ok || data.ok === false) {
        setMessage("فشلت الفهرسة. تأكد من صلاحية الأدمن وإعداد OPENAI_API_KEY.");
        return;
      }
      setMessage(`تمت الفهرسة بنجاح. عدد المقاطع: ${data.chunks ?? 0}`);
    } catch {
      setMessage("تعذر الاتصال أثناء الفهرسة.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/20 bg-white/5 p-5 space-y-4">
      <h2 className="text-base font-semibold text-white">فهرسة الكتاب للمرشد الذكي (RAG)</h2>
      <p className="text-sm text-white/70">
        هذا الإجراء يقسم محتوى الكتاب إلى مقاطع، يولد embeddings، ثم يحفظها في Supabase vector.
      </p>

      <label className="flex items-center gap-2 text-sm text-white/80">
        <input
          type="checkbox"
          checked={reset}
          onChange={(e) => setReset(e.target.checked)}
          className="h-4 w-4 rounded border-white/30 bg-transparent"
        />
        مسح الفهرس الحالي قبل إعادة البناء
      </label>

      <button
        type="button"
        onClick={runIngest}
        disabled={loading}
        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-[#15130f] disabled:opacity-60"
      >
        {loading ? "جارٍ الفهرسة..." : "ابدأ الفهرسة"}
      </button>

      {message ? <p className="text-sm text-white/80">{message}</p> : null}
    </div>
  );
}
