// src/app/guide/voice/page.tsx
"use client";

import Link from "next/link";
import { VoiceOrb } from "./VoiceOrb";
import { useVoiceSession, type VoiceSessionError } from "./useVoiceSession";

const ERROR_MESSAGES: Record<VoiceSessionError, string> = {
  mic_denied: "الرجاء السماح بالوصول للميكروفون من إعدادات المتصفح.",
  no_speech: "ما سمعت شيئًا. جرّب مرة ثانية.",
  stt_failed: "تعذّر تحويل الصوت إلى نص. حاول مجددًا.",
  chat_failed: "المرشد لا يستجيب الآن. حاول بعد لحظة.",
  unknown: "حدث خطأ غير متوقع.",
};

export default function GuideVoicePage() {
  const { state, transcript, reply, error, start, stop, cancel } = useVoiceSession();

  // Push-to-talk: pointer down → start, pointer up/leave → stop
  const handlePointerDown = () => {
    if (state === "idle") void start();
  };
  const handlePointerUp = () => {
    if (state === "listening") void stop();
  };
  const handlePointerLeave = () => {
    if (state === "listening") cancel();
  };

  return (
    <main
      dir="rtl"
      lang="ar"
      className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 px-6 py-12 flex flex-col items-center"
    >
      <header className="w-full max-w-xl flex items-center justify-between mb-10">
        <Link href="/guide" className="text-sm text-slate-400 hover:text-slate-200">
          ← عودة للمرشد
        </Link>
        <h1 className="text-xl font-semibold">جلسة صوتية</h1>
        <span className="w-[72px]" aria-hidden />
      </header>

      <VoiceOrb state={state} />

      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className="mt-10 rounded-full bg-amber-500/90 px-10 py-5 text-lg font-semibold text-slate-950 shadow-lg select-none active:scale-95 transition"
        disabled={state === "thinking"}
      >
        {state === "listening" ? "أفلت للإرسال" : "اضغط مطوّلاً للحديث"}
      </button>

      {error && (
        <p role="alert" className="mt-6 max-w-md text-center text-red-300">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <section className="mt-12 w-full max-w-xl space-y-6">
        {transcript && (
          <div className="rounded-xl bg-slate-800/60 p-4">
            <p className="text-xs text-slate-400 mb-1">أنت قلت</p>
            <p className="text-base text-slate-100">{transcript}</p>
          </div>
        )}
        {reply && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
            <p className="text-xs text-amber-300 mb-1">المرشد</p>
            <p className="text-base text-slate-100 whitespace-pre-wrap">{reply}</p>
          </div>
        )}
      </section>
    </main>
  );
}
