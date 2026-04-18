"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * VoiceTasbeeh — hands-free dhikr counter.
 *
 * Uses the browser's Web Speech API (SpeechRecognition) in continuous mode.
 * Listens for the configured phrase (e.g. "سبحان الله") and increments the
 * counter on each match.
 *
 * Free, on-device (no server roundtrip), works offline once downloaded.
 * Fallback: tap-to-count if Web Speech unavailable.
 */

const SUPPORTED_PHRASES: Array<{ phrase: string; variants: string[]; target: number }> = [
  {
    phrase: "سبحان الله",
    variants: ["سبحان الله", "سبحان اللّه"],
    target: 33,
  },
  {
    phrase: "الحمد لله",
    variants: ["الحمد لله", "الحمد للّه"],
    target: 33,
  },
  {
    phrase: "الله أكبر",
    variants: ["الله أكبر", "اللّه أكبر"],
    target: 34,
  },
];

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

function getRecognitionConstructor(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceTasbeeh() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastMatchRef = useRef<number>(0);

  const currentPhrase = SUPPORTED_PHRASES[phraseIndex];

  useEffect(() => {
    setSupported(getRecognitionConstructor() !== null);
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const start = useCallback(() => {
    const Ctor = getRecognitionConstructor();
    if (!Ctor) {
      setErrorMsg("متصفحك لا يدعم التعرف الصوتي — استخدم الضغط اليدوي");
      return;
    }

    setErrorMsg(null);
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "ar-SA";

    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result.isFinal) continue;
        const transcript = result[0].transcript.trim();
        const matched = currentPhrase.variants.some((v) =>
          transcript.includes(v)
        );
        if (matched) {
          // Debounce: one count per 500ms to avoid echoes
          const now = Date.now();
          if (now - lastMatchRef.current < 500) continue;
          lastMatchRef.current = now;
          setCount((c) => c + 1);
        }
      }
    };

    rec.onerror = () => {
      // Silent — SR surface errors can be noisy (no-speech, audio-capture). Let auto-restart handle it.
    };

    rec.onend = () => {
      // Chrome auto-ends after silence — restart if still "listening"
      if (recognitionRef.current === rec) {
        try {
          rec.start();
        } catch {
          // Already started / permission issue — give up quietly
          setListening(false);
          recognitionRef.current = null;
        }
      }
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setListening(true);
    } catch {
      setErrorMsg("تعذّر بدء الاستماع — تأكد من إذن الميكروفون");
    }
  }, [currentPhrase.variants]);

  function manualIncrement() {
    setCount((c) => c + 1);
  }

  function reset() {
    setCount(0);
  }

  function cyclePhrase() {
    setPhraseIndex((i) => (i + 1) % SUPPORTED_PHRASES.length);
    setCount(0);
  }

  const progress = Math.min(
    100,
    Math.round((count / currentPhrase.target) * 100)
  );
  const reached = count >= currentPhrase.target;

  return (
    <div className="border-t border-[#c9b88a]/15 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#e8e1d9]">المسبحة الصوتية</h3>
        <button
          type="button"
          onClick={cyclePhrase}
          className="text-[10px] text-[#8c7851] hover:text-[#c9b88a]"
          aria-label="غيّر الذكر"
        >
          تبديل الذكر ↻
        </button>
      </div>

      <div className="text-center space-y-3">
        <p className="font-[var(--font-amiri)] text-xl text-[#e8e1d9]">
          {currentPhrase.phrase}
        </p>
        <p className="font-[var(--font-amiri)] text-5xl font-bold text-[#c9b88a]">
          {count}
          <span className="text-sm text-white/30 mr-2">/ {currentPhrase.target}</span>
        </p>
        <div className="h-1 w-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-[#c9b88a] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {reached && (
          <p className="text-[11px] text-emerald-400">
            ✓ أتممت {currentPhrase.target} — بارك الله فيك
          </p>
        )}
      </div>

      <div className="flex gap-2">
        {supported && (
          <button
            type="button"
            onClick={listening ? stop : start}
            className={`flex-1 border py-2.5 text-xs font-semibold ${
              listening
                ? "border-red-400/40 text-red-300 hover:bg-red-500/10"
                : "border-[#c9b88a]/40 text-[#c9b88a] hover:bg-[#c9b88a]/10"
            }`}
            aria-label={listening ? "أوقف الاستماع" : "ابدأ الاستماع"}
          >
            {listening ? "● يستمع..." : "🎙️ ابدأ الاستماع"}
          </button>
        )}
        <button
          type="button"
          onClick={manualIncrement}
          className="flex-1 border border-white/10 py-2.5 text-xs text-white/60 hover:bg-white/5"
          aria-label="عدّ يدوياً"
        >
          +1 يدوياً
        </button>
        <button
          type="button"
          onClick={reset}
          className="border border-white/10 px-3 py-2.5 text-xs text-white/40 hover:text-white/70"
          aria-label="إعادة التعيين"
        >
          ↺
        </button>
      </div>

      {errorMsg && (
        <p className="text-[11px] text-amber-400 italic">{errorMsg}</p>
      )}

      {!supported && (
        <p className="text-[10px] text-white/30 italic">
          التعرف الصوتي غير متاح — استخدم الضغط اليدوي.
        </p>
      )}
    </div>
  );
}
