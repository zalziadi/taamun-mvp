"use client";

import { useEffect, useState } from "react";
import { EMAIL_RE, hasLead, markLead, submitLead } from "@/lib/leads";

// بطاقة التقاط بريد خفيفة — تظهر مرة واحدة عند بداية الرحلة، ثم تختفي بعد التسجيل.
export function LeadForm() {
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDone(hasLead());
    setReady(true);
  }, []);

  // لا نومض البطاقة قبل قراءة الحالة، ولا نعرضها بعد التسجيل
  if (!ready || done) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !EMAIL_RE.test(email.trim())) {
      setError("اكتب اسمك وبريداً إلكترونياً صحيحاً.");
      return;
    }
    setBusy(true);
    await submitLead(name.trim(), email.trim());
    markLead(); // نحفظ محلياً دائماً حتى لا تتكرر البطاقة
    setBusy(false);
    setDone(true);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl2 border border-wafrah-200 bg-wafrah-50/60 p-5 shadow-soft"
    >
      <p className="text-sm font-semibold text-ink-900">احفظ مكانك في الرحلة</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-600">
        اترك اسمك وبريدك لنرسل لك متابعة الرحلة وما بعدها. خطوة واحدة فقط.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسمك"
          className="w-full rounded-full border border-ink-200 bg-white px-4 py-2 text-sm text-ink-900 outline-none focus:border-wafrah-400"
        />
        <input
          type="email"
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          className="w-full rounded-full border border-ink-200 bg-white px-4 py-2 text-sm text-ink-900 outline-none focus:border-wafrah-400"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-full bg-ink-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:bg-ink-300"
        >
          {busy ? "..." : "سجّل"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </form>
  );
}
