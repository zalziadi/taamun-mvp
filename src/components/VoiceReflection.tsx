"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RecordingState = "idle" | "requesting" | "recording" | "processing" | "done" | "error";

interface VoiceReflectionProps {
  day: number;
  onSaved?: (transcript: string) => void;
}

/**
 * VoiceReflection — record a reflection by voice.
 * Flow:
 *   1. Request microphone permission (MediaRecorder)
 *   2. Record up to 90 seconds
 *   3. POST audio blob to /api/voice/stt → receive Arabic transcript
 *   4. POST transcript to /api/reflections (upserts by user_id + day)
 *   5. Surface transcript for user to review/edit
 *
 * Respects the 2 MB hard cap enforced by the STT route.
 */
export function VoiceReflection({ day, onSaved }: VoiceReflectionProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const MAX_SECONDS = 90;

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  async function startRecording() {
    setErrorMsg(null);
    setTranscript("");
    setSeconds(0);
    setState("requesting");

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setErrorMsg("متصفحك لا يدعم التسجيل الصوتي");
      setState("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Prefer webm/opus — widely supported and compact
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";

      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      rec.onstop = async () => {
        setState("processing");
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        chunksRef.current = [];

        // Upload
        try {
          const form = new FormData();
          form.append("audio", blob, "reflection.webm");
          const sttRes = await fetch("/api/voice/stt", {
            method: "POST",
            body: form,
          });
          const sttData = (await sttRes.json()) as { ok?: boolean; text?: string; error?: string };

          if (!sttRes.ok || !sttData.ok || !sttData.text) {
            setErrorMsg(
              sttData.error === "audio_too_large"
                ? "التسجيل كبير جداً — حاول تسجيل أقصر"
                : "تعذّر تحويل الصوت — حاول مجدداً"
            );
            setState("error");
            return;
          }

          const text = sttData.text.trim();
          setTranscript(text);

          // Save as reflection
          const saveRes = await fetch("/api/reflections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ day, note: text }),
          });

          if (saveRes.ok) {
            setState("done");
            onSaved?.(text);
          } else {
            setErrorMsg("تم التحويل لكن تعذّر الحفظ");
            setState("error");
          }
        } catch {
          setErrorMsg("حدث خطأ أثناء المعالجة");
          setState("error");
        } finally {
          cleanup();
        }
      };

      rec.start();
      setState("recording");

      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          if (next >= MAX_SECONDS) {
            rec.stop();
          }
          return next;
        });
      }, 1000);
    } catch {
      setErrorMsg("تعذّر الوصول للميكروفون — تأكد من الإذن");
      setState("error");
      cleanup();
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
  }

  const formatSeconds = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3 border-t border-white/5 pt-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/60">تأمّل بصوتك</p>
        {state === "recording" && (
          <span className="text-[11px] text-red-400">
            ● {formatSeconds(seconds)} / {formatSeconds(MAX_SECONDS)}
          </span>
        )}
      </div>

      {state === "idle" || state === "error" ? (
        <button
          type="button"
          onClick={startRecording}
          className="w-full border border-[#c9b88a]/40 py-3 text-xs font-semibold text-[#c9b88a] hover:bg-[#c9b88a]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          aria-label="ابدأ تسجيل التأمل الصوتي"
        >
          🎙️ ابدأ التسجيل
        </button>
      ) : state === "requesting" ? (
        <p className="text-[11px] text-white/50">جارٍ طلب الإذن...</p>
      ) : state === "recording" ? (
        <button
          type="button"
          onClick={stopRecording}
          className="w-full border border-red-400/40 py-3 text-xs font-semibold text-red-300 hover:bg-red-500/10"
          aria-label="أنهِ التسجيل"
        >
          ■ أنهِ التسجيل
        </button>
      ) : state === "processing" ? (
        <p className="text-[11px] text-white/50">جارٍ تحويل الصوت...</p>
      ) : state === "done" ? (
        <div className="space-y-2">
          <p className="text-[11px] text-emerald-400">✓ تم حفظ تأمّلك</p>
          {transcript && (
            <blockquote className="text-xs leading-relaxed text-white/70 italic">
              &ldquo;{transcript}&rdquo;
            </blockquote>
          )}
        </div>
      ) : null}

      {errorMsg && (
        <p className="text-[11px] text-amber-400 italic">{errorMsg}</p>
      )}
    </div>
  );
}
