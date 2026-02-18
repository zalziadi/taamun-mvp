"use client";

import { useState, useCallback } from "react";
import { APP_CODE_PREFIX, APP_NAME } from "@/lib/appConfig";

const DAY1_GATE_KEY = `${APP_CODE_PREFIX}_DAY1_GATE_V1`;

export interface Day1GateData {
  observed: string;
  insight: string;
  contemplation: string;
  savedAtIso: string;
}

function loadDay1Gate(): Day1GateData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DAY1_GATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    if (
      typeof o.observed !== "string" ||
      typeof o.insight !== "string" ||
      typeof o.contemplation !== "string" ||
      typeof o.savedAtIso !== "string"
    ) {
      return null;
    }
    return {
      observed: o.observed,
      insight: o.insight,
      contemplation: o.contemplation,
      savedAtIso: o.savedAtIso,
    };
  } catch {
    return null;
  }
}

function saveDay1Gate(data: Omit<Day1GateData, "savedAtIso">): void {
  if (typeof window === "undefined") return;
  try {
    const full: Day1GateData = {
      ...data,
      savedAtIso: new Date().toISOString(),
    };
    window.localStorage.setItem(DAY1_GATE_KEY, JSON.stringify(full));
  } catch {
    // ignore
  }
}

const PROMPTS = {
  observed: "ماذا يحدث داخلي الآن؟ (فكرة/شعور/جسد)",
  insight: "ما الفكرة التي صدّقتها اليوم ثم اكتشفت أنها ليست حقيقة؟",
  contemplation: "ما خطوة واحدة صغيرة تثبت هذا الوعي اليوم؟",
};

const MODAL_BULLETS = [
  "الظل: ما يخفيه المرء عن نفسه",
  "الهدية: ما يظهر عندما نرى بوضوح",
  "أفضل احتمال: ما يمكن أن يصبح",
  "المراقبة: رؤية الواقع بدون تبرير",
  "الإدراك: إدراك المعنى الأعلى",
  `${APP_NAME}: ترسيخ الوعي في السلوك`,
];

export function Day1Gate() {
  const [saved, setSaved] = useState<Day1GateData | null>(() => loadDay1Gate());
  const [edit, setEdit] = useState(false);
  const [observed, setObserved] = useState(saved?.observed ?? "");
  const [insight, setInsight] = useState(saved?.insight ?? "");
  const [contemplation, setContemplation] = useState(saved?.contemplation ?? "");
  const [modalOpen, setModalOpen] = useState(false);

  const handleSave = useCallback(() => {
    saveDay1Gate({ observed, insight, contemplation });
    setSaved(loadDay1Gate());
    setEdit(false);
  }, [observed, insight, contemplation]);

  const handleEdit = useCallback(() => {
    setObserved(saved?.observed ?? "");
    setInsight(saved?.insight ?? "");
    setContemplation(saved?.contemplation ?? "");
    setEdit(true);
  }, [saved]);

  if (saved && !edit) {
    return (
      <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">اليوم 1: الآية مرآة</h2>
        <p className="text-emerald-400 font-medium">تم الحفظ ✅</p>
        <button
          type="button"
          onClick={handleEdit}
          className="mt-3 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
        >
          تعديل
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-white/15 bg-white/5 p-6">
      <h2 className="mb-4 text-xl font-bold text-white">اليوم 1: الآية مرآة</h2>
      <p className="mb-3 leading-relaxed text-white/85 text-[15px]">
        الآية مرآة: السؤال ليس ماذا تقول، بل ماذا يحدث داخلك وأنت تقرأ.
        {`نمرّ من مراقبةٍ — نرى ما هو — إلى إدراكٍ — ندرك ما لم نره — إلى مرحلة ${APP_NAME} — نثبت الوعي خطوةً صغيرة.`}
      </p>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="mb-6 text-sm text-white/60 underline hover:text-white/80"
      >
        ما هذا؟
      </button>

      <div className="space-y-4">
        <div>
          <label htmlFor="day1-observed" className="mb-1 block text-sm font-medium text-white/90">
            مراقبة
          </label>
          <textarea
            id="day1-observed"
            value={observed}
            onChange={(e) => setObserved(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white placeholder:text-white/40"
            placeholder={PROMPTS.observed}
          />
        </div>
        <div>
          <label htmlFor="day1-insight" className="mb-1 block text-sm font-medium text-white/90">
            إدراك
          </label>
          <textarea
            id="day1-insight"
            value={insight}
            onChange={(e) => setInsight(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white placeholder:text-white/40"
            placeholder={PROMPTS.insight}
          />
        </div>
        <div>
          <label htmlFor="day1-contemplation" className="mb-1 block text-sm font-medium text-white/90">
            {APP_NAME}
          </label>
          <textarea
            id="day1-contemplation"
            value={contemplation}
            onChange={(e) => setContemplation(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-white/20 bg-white/5 p-3 text-white placeholder:text-white/40"
            placeholder={PROMPTS.contemplation}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="mt-6 rounded-lg bg-white px-6 py-3 font-medium text-[#0B0F14] hover:bg-white/90"
      >
        حفظ
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setModalOpen(false)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Escape" && setModalOpen(false)}
          aria-label="إغلاق"
        >
          <div
            className="max-w-sm rounded-xl border border-white/20 bg-[#0B0F14] p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="ما هذا؟"
          >
            <p className="mb-4 font-medium text-white">{`إطار ${APP_NAME}`}</p>
            <ul className="mb-4 list-inside list-disc space-y-1 text-sm text-white/85">
              {MODAL_BULLETS.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
