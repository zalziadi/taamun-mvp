// src/app/guide/voice/useVoiceSession.ts
"use client";

import { useCallback, useRef, useState } from "react";

export type VoiceSessionState =
  | "idle"        // ready, nothing happening
  | "listening"   // mic held down, capturing audio
  | "thinking";   // STT + chat in flight
// Phase 2 will add: "speaking" (TTS audio playing)

export type VoiceSessionError =
  | "mic_denied"
  | "no_speech"
  | "stt_failed"
  | "chat_failed"
  | "unknown";

export type UseVoiceSessionReturn = {
  state: VoiceSessionState;
  transcript: string;   // last user utterance
  reply: string;        // last guide reply (text)
  error: VoiceSessionError | null;
  sessionId: string | null;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  cancel: () => void;
  reset: () => void;
};

const MAX_RECORDING_MS = 60_000; // spec: ≤ 60 s

export function useVoiceSession(): UseVoiceSessionReturn {
  const [state, setState] = useState<VoiceSessionState>("idle");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState<VoiceSessionError | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") {
      return;
    }

    // Wait for the final dataavailable event before building the blob
    const blob: Blob = await new Promise((resolve) => {
      recorder.onstop = () => {
        const b = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        resolve(b);
      };
      recorder.stop();
    });

    releaseStream();

    if (cancelledRef.current) {
      setState("idle");
      return;
    }

    if (blob.size === 0) {
      setError("no_speech");
      setState("idle");
      return;
    }

    setState("thinking");

    // Step 1: STT
    let userText = "";
    try {
      const form = new FormData();
      form.append("audio", blob, "audio.webm");
      const res = await fetch("/api/voice/stt", { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok || typeof json.text !== "string") {
        setError(json?.error === "empty_transcript" ? "no_speech" : "stt_failed");
        setState("idle");
        return;
      }
      userText = json.text as string;
    } catch {
      setError("stt_failed");
      setState("idle");
      return;
    }

    setTranscript(userText);

    // Step 2: Guide chat
    try {
      const res = await fetch("/api/guide/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, sessionId: sessionId ?? undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok || typeof json.reply !== "string") {
        setError("chat_failed");
        setState("idle");
        return;
      }
      setReply(json.reply as string);
      if (typeof json.sessionId === "string" && json.sessionId) {
        setSessionId(json.sessionId);
      }
    } catch {
      setError("chat_failed");
      setState("idle");
      return;
    }

    // Phase 1 ends here — reply is shown as text, return to idle.
    setState("idle");
  }, [releaseStream, sessionId]);

  const start = useCallback(async () => {
    setError(null);
    cancelledRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      setState("listening");
      // Auto-stop after MAX_RECORDING_MS
      maxTimerRef.current = setTimeout(() => {
        if (recorderRef.current?.state === "recording") {
          void stop();
        }
      }, MAX_RECORDING_MS);
    } catch {
      setError("mic_denied");
      setState("idle");
      releaseStream();
    }
  }, [releaseStream, stop]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    try {
      recorderRef.current?.stop();
    } catch {
      /* noop */
    }
    releaseStream();
    setState("idle");
  }, [releaseStream]);

  const reset = useCallback(() => {
    cancel();
    setTranscript("");
    setReply("");
    setError(null);
  }, [cancel]);

  return { state, transcript, reply, error, sessionId, start, stop, cancel, reset };
}
