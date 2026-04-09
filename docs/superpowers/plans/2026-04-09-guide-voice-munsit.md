# Guide Voice (Munsit) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a voice-only guide experience at `/guide/voice` where the user speaks Arabic, Munsit STT transcribes, the existing `/api/guide/chat` RAG pipeline replies, and (Phase 2) Munsit TTS speaks the reply back.

**Architecture:** Thin server-side proxies (`/api/voice/stt`, `/api/voice/tts`) wrap Munsit's REST API so `MUNSIT_API_KEY` never reaches the browser. A React hook (`useVoiceSession`) drives a state machine over `MediaRecorder`, chaining STT → guide chat → (Phase 2) TTS. A `VoiceOrb` component reflects the 4 states. Reuses `/api/guide/chat`, `requireUser`, and the existing Supabase session history unchanged.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind, Supabase auth (`@/lib/authz`), native `MediaRecorder` + `fetch` (no new dependencies per CLAUDE.md rule 6).

**Spec:** `docs/superpowers/specs/2026-04-09-guide-voice-munsit-design.md`

**Munsit API (verified from `https://docs.munsit.com/api-reference/openapi.json`):**
- Base URL: `https://api.munsit.com/api/v1`
- Auth header: `x-api-key: <MUNSIT_API_KEY>`
- STT: `POST /audio/transcribe` — multipart/form-data `{ file, model? }`, default model `"munsit"`
- TTS: `POST /text-to-speech/{model_id}` — JSON `{ voice_id, text, stability, speed?, streaming }`, returns `audio/wav` (streaming=false) or `audio/raw` PCM16 (streaming=true)

**Verification gate (per `CLAUDE.md`):** after every task run `npx tsc --noEmit`. At each phase boundary also run `npm run build`. No unit test framework is configured in this project — verification is type-check + build + manual curl/browser QA, NOT vitest/jest.

---

## File Structure

**Phase 1 (text-only loop):**
```
src/lib/munsit.ts                        NEW — Munsit REST client (STT in P1, TTS in P2)
src/app/api/voice/stt/route.ts           NEW — authenticated STT proxy
src/app/guide/voice/useVoiceSession.ts   NEW — client hook, state machine, fetch chain
src/app/guide/voice/VoiceOrb.tsx         NEW — presentational orb (idle/listening/thinking)
src/app/guide/voice/page.tsx             NEW — Next.js page, RTL, Arabic UI
src/app/guide/page.tsx                   MODIFY — add link to /guide/voice
.env.example                             MODIFY — document MUNSIT_* env vars (if file exists)
```

**Phase 2 (add TTS + logging):**
```
src/lib/munsit.ts                        MODIFY — add TTS function
src/app/api/voice/tts/route.ts           NEW — authenticated TTS proxy, streams audio
src/app/guide/voice/useVoiceSession.ts   MODIFY — add speaking state + <audio> playback
src/app/guide/voice/VoiceOrb.tsx         MODIFY — add speaking variant
src/app/guide/voice/page.tsx             MODIFY — wire audio element + eye toggle
supabase/migrations/NNNN_voice_sessions.sql  NEW — voice_sessions table
```

Each file has one clear responsibility: `munsit.ts` knows the wire format, routes know auth + validation, the hook knows the state machine, the orb knows how states look, the page composes them.

---

# PHASE 1 — Record → STT → Chat (text reply only)

## Task 1: Munsit client (STT only) + env vars

**Files:**
- Create: `src/lib/munsit.ts`
- Modify: `.env.example` (only if the file exists in the repo)

- [ ] **Step 1: Create `src/lib/munsit.ts` with the STT client**

```typescript
// src/lib/munsit.ts
// Server-only Munsit REST client. Never import from client components.
// Spec: docs/superpowers/specs/2026-04-09-guide-voice-munsit-design.md

const MUNSIT_BASE_URL = "https://api.munsit.com/api/v1";

export class MunsitError extends Error {
  constructor(
    message: string,
    public status: number,
    public upstreamBody?: string,
  ) {
    super(message);
    this.name = "MunsitError";
  }
}

function getApiKey(): string {
  const key = process.env.MUNSIT_API_KEY;
  if (!key) {
    throw new MunsitError("MUNSIT_API_KEY is not configured", 500);
  }
  return key;
}

export type TranscribeResult = {
  text: string;
};

/**
 * Transcribe an audio blob using Munsit STT.
 * Caller provides the raw audio (webm/opus, wav, mp3, etc.) as a Blob.
 */
export async function transcribeAudio(audio: Blob, model = "munsit"): Promise<TranscribeResult> {
  const apiKey = getApiKey();

  const form = new FormData();
  form.append("file", audio, "audio.webm");
  form.append("model", model);

  const res = await fetch(`${MUNSIT_BASE_URL}/audio/transcribe`, {
    method: "POST",
    headers: { "x-api-key": apiKey },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new MunsitError(`Munsit STT failed: ${res.status}`, res.status, body);
  }

  const json = (await res.json()) as { text?: unknown };
  const text = typeof json.text === "string" ? json.text.trim() : "";
  return { text };
}
```

- [ ] **Step 2: Document env vars**

If `.env.example` exists, append:
```
# Munsit Arabic Voice AI (server-only; never expose to the client)
MUNSIT_API_KEY=
```
If `.env.example` does not exist, skip — do NOT create it; document the var in the commit message instead.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors related to `src/lib/munsit.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/munsit.ts .env.example
git commit -m "feat(voice): add Munsit REST client (STT only)"
```

---

## Task 2: STT API route `/api/voice/stt`

**Files:**
- Create: `src/app/api/voice/stt/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/voice/stt/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { transcribeAudio, MunsitError } from "@/lib/munsit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Munsit upload requires Node runtime (FormData streaming)

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB hard cap — see spec "Security & Limits"

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  // Parse multipart
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_form" }, { status: 400 });
  }

  const file = form.get("audio");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ ok: false, error: "missing_audio" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ ok: false, error: "empty_audio" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "audio_too_large" }, { status: 413 });
  }

  try {
    const { text } = await transcribeAudio(file);
    if (!text) {
      return NextResponse.json({ ok: false, error: "empty_transcript" }, { status: 422 });
    }
    return NextResponse.json({ ok: true, text });
  } catch (err) {
    if (err instanceof MunsitError) {
      console.error("[voice/stt] Munsit error:", err.status, err.upstreamBody);
      return NextResponse.json(
        { ok: false, error: "stt_upstream_failed" },
        { status: err.status === 401 ? 502 : 502 },
      );
    }
    console.error("[voice/stt] unexpected error:", err);
    return NextResponse.json({ ok: false, error: "stt_failed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Smoke-test with curl (local dev)**

In one terminal:
```bash
npm run dev
```

In another (requires `MUNSIT_API_KEY` exported and a valid Supabase auth cookie — if you do not have one, sign in at http://localhost:3000/auth once and copy the `sb-*-auth-token` cookie from DevTools):
```bash
# Create a 1-second silent test clip
ffmpeg -f lavfi -i anullsrc=r=16000:cl=mono -t 1 -c:a libopus /tmp/silence.webm -y 2>/dev/null

curl -i -X POST http://localhost:3000/api/voice/stt \
  -H "Cookie: <paste-sb-auth-cookie-here>" \
  -F "audio=@/tmp/silence.webm"
```

Expected: either `{"ok":true,"text":"..."}` (if Munsit returns any text) or `{"ok":false,"error":"empty_transcript"}` with HTTP 422. A 401 means the auth cookie is missing or stale — sign in again. A 502 with `stt_upstream_failed` means `MUNSIT_API_KEY` is wrong.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/voice/stt/route.ts
git commit -m "feat(voice): add authenticated /api/voice/stt Munsit proxy"
```

---

## Task 3: `useVoiceSession` hook (text-reply flow)

**Files:**
- Create: `src/app/guide/voice/useVoiceSession.ts`

- [ ] **Step 1: Create the hook**

```typescript
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
    // `stop` is defined below but captured by closure — safe because React
    // recreates the callback only when deps change, and we only read `stop`
    // inside the timer after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [releaseStream]);

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

  const reset = useCallback(() => {
    cancel();
    setTranscript("");
    setReply("");
    setError(null);
  }, [cancel]);

  return { state, transcript, reply, error, sessionId, start, stop, cancel, reset };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/guide/voice/useVoiceSession.ts
git commit -m "feat(voice): add useVoiceSession hook (text-reply flow)"
```

---

## Task 4: `VoiceOrb` presentational component

**Files:**
- Create: `src/app/guide/voice/VoiceOrb.tsx`

- [ ] **Step 1: Create the orb**

```tsx
// src/app/guide/voice/VoiceOrb.tsx
"use client";

import type { VoiceSessionState } from "./useVoiceSession";

type Props = {
  state: VoiceSessionState;
};

const VARIANTS: Record<VoiceSessionState, string> = {
  idle: "bg-slate-700/40 animate-[pulse_4s_ease-in-out_infinite]",
  listening: "bg-amber-500/50 animate-[pulse_0.9s_ease-in-out_infinite] ring-4 ring-amber-300/40",
  thinking: "bg-sky-500/40 animate-[pulse_1.4s_ease-in-out_infinite] ring-4 ring-sky-300/30",
};

const LABELS: Record<VoiceSessionState, string> = {
  idle: "اضغط مطوّلاً للحديث",
  listening: "أتحدّث أستمع…",
  thinking: "أتأمّل ردّك…",
};

export function VoiceOrb({ state }: Props) {
  return (
    <div className="flex flex-col items-center gap-6" aria-live="polite">
      <div
        className={`h-48 w-48 rounded-full transition-colors duration-500 ${VARIANTS[state]}`}
        role="img"
        aria-label={LABELS[state]}
      />
      <p className="text-lg text-slate-200">{LABELS[state]}</p>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/guide/voice/VoiceOrb.tsx
git commit -m "feat(voice): add VoiceOrb component (idle/listening/thinking)"
```

---

## Task 5: `/guide/voice` page

**Files:**
- Create: `src/app/guide/voice/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Run the build to catch any Next.js route issues**

Run: `npm run build`
Expected: build succeeds, includes `/guide/voice` in the generated route list.

- [ ] **Step 4: Commit**

```bash
git add src/app/guide/voice/page.tsx
git commit -m "feat(voice): add /guide/voice page (Phase 1 text-only loop)"
```

---

## Task 6: Link from `/guide` → `/guide/voice`

**Files:**
- Modify: `src/app/guide/page.tsx`

- [ ] **Step 1: Read the current `/guide` page**

Run: read `src/app/guide/page.tsx` fully. Identify a natural header/toolbar area where a small "🎙️ جلسة صوتية" link fits. Do NOT restructure unrelated code (CLAUDE.md rule 8).

- [ ] **Step 2: Add a single link element pointing to `/guide/voice`**

Add an `import Link from "next/link";` if it does not already exist, then insert one `<Link href="/guide/voice">🎙️ جلسة صوتية</Link>` in the existing header/toolbar. Keep the change under 10 lines.

- [ ] **Step 3: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add src/app/guide/page.tsx
git commit -m "feat(voice): link /guide to /guide/voice"
```

---

## Task 7: Phase 1 manual QA gate

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Sign in as a real Taamun user**

Open http://localhost:3000/auth, complete magic-link login. Confirm you land on `/program` or similar.

- [ ] **Step 3: Navigate to `/guide/voice` and exercise the flow**

Checklist:
- [ ] Page renders RTL Arabic, orb visible, button visible.
- [ ] Pressing the button prompts for mic permission.
- [ ] Denying permission shows the `mic_denied` Arabic error.
- [ ] Granting permission turns the orb `listening` (amber pulse).
- [ ] Releasing the button turns the orb `thinking` (sky pulse).
- [ ] After ~1–5 s the transcript box shows what you said in Arabic.
- [ ] The reply box shows the guide's Arabic text response.
- [ ] Orb returns to `idle` after the reply is rendered.
- [ ] Releasing the button without speaking shows the `no_speech` error.

- [ ] **Step 4: Force an error and confirm the UI recovers**

Temporarily set `MUNSIT_API_KEY=wrong` in `.env.local`, restart dev, press-hold-speak-release. Expected: `stt_failed` error toast, orb back to idle, no crash. Restore the real key before continuing.

- [ ] **Step 5: Phase 1 gate**

Run: `npx tsc --noEmit && npm run build`
Expected: both pass.

- [ ] **Step 6: Phase 1 wrap commit (only if any fixes landed during QA)**

```bash
git add -A
git commit -m "chore(voice): Phase 1 QA fixes"
```

Then remind the user: `✅ Phase 1 تم! ادفع التحديثات من Cursor (Terminal → git push).`

---

# PHASE 2 — Add TTS audio playback

## Task 8: Extend Munsit client with TTS

**Files:**
- Modify: `src/lib/munsit.ts`

- [ ] **Step 1: Append the TTS function**

Open `src/lib/munsit.ts` and add at the bottom (keep all existing exports):

```typescript
export type TTSOptions = {
  voiceId: string;
  text: string;
  stability?: number;   // 0–1, default 0.5
  speed?: number;       // 0.7–1.2, default 1.0
  modelId?: string;     // path param, default from env
};

/**
 * Generate non-streaming Arabic speech via Munsit TTS.
 * Returns a Blob of audio/wav. Caller is responsible for playback.
 */
export async function synthesizeSpeech(opts: TTSOptions): Promise<Blob> {
  const apiKey = getApiKey();
  const modelId = opts.modelId ?? process.env.MUNSIT_TTS_MODEL_ID;
  if (!modelId) {
    throw new MunsitError("MUNSIT_TTS_MODEL_ID is not configured", 500);
  }

  const body = {
    voice_id: opts.voiceId,
    text: opts.text,
    stability: typeof opts.stability === "number" ? opts.stability : 0.5,
    speed: typeof opts.speed === "number" ? opts.speed : 1.0,
    streaming: false,
  };

  const res = await fetch(`${MUNSIT_BASE_URL}/text-to-speech/${encodeURIComponent(modelId)}`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new MunsitError(`Munsit TTS failed: ${res.status}`, res.status, errBody);
  }

  return await res.blob();
}
```

- [ ] **Step 2: Document the new env vars**

If `.env.example` exists, append:
```
MUNSIT_TTS_MODEL_ID=
MUNSIT_VOICE_ID=
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/munsit.ts .env.example
git commit -m "feat(voice): add Munsit TTS client (non-streaming WAV)"
```

---

## Task 9: TTS API route `/api/voice/tts`

**Files:**
- Create: `src/app/api/voice/tts/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/voice/tts/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { synthesizeSpeech, MunsitError } from "@/lib/munsit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_TEXT_LEN = 2000; // spec: ≤ 2000 chars

type TTSBody = { text?: unknown };

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: TTSBody;
  try {
    body = (await req.json()) as TTSBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ ok: false, error: "empty_text" }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LEN) {
    return NextResponse.json({ ok: false, error: "text_too_long" }, { status: 413 });
  }

  const voiceId = process.env.MUNSIT_VOICE_ID;
  if (!voiceId) {
    return NextResponse.json({ ok: false, error: "voice_not_configured" }, { status: 500 });
  }

  try {
    const audio = await synthesizeSpeech({ voiceId, text });
    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof MunsitError) {
      console.error("[voice/tts] Munsit error:", err.status, err.upstreamBody);
      return NextResponse.json({ ok: false, error: "tts_upstream_failed" }, { status: 502 });
    }
    console.error("[voice/tts] unexpected error:", err);
    return NextResponse.json({ ok: false, error: "tts_failed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Smoke-test with curl**

```bash
curl -i -X POST http://localhost:3000/api/voice/tts \
  -H "Cookie: <paste-sb-auth-cookie-here>" \
  -H "Content-Type: application/json" \
  -d '{"text":"السلام عليكم، كيف حالك اليوم؟"}' \
  --output /tmp/munsit-out.wav

file /tmp/munsit-out.wav
```

Expected: HTTP 200, `Content-Type: audio/wav`, `file` reports "RIFF (little-endian) data, WAVE audio". Play it with `afplay /tmp/munsit-out.wav` (macOS) to confirm Arabic speech.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/voice/tts/route.ts
git commit -m "feat(voice): add authenticated /api/voice/tts Munsit proxy"
```

---

## Task 10: Extend `useVoiceSession` with speaking state

**Files:**
- Modify: `src/app/guide/voice/useVoiceSession.ts`

- [ ] **Step 1: Widen the state union**

Change the `VoiceSessionState` union at the top of the file to include `"speaking"`:

```typescript
export type VoiceSessionState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking";
```

Add a new error variant:

```typescript
export type VoiceSessionError =
  | "mic_denied"
  | "no_speech"
  | "stt_failed"
  | "chat_failed"
  | "tts_failed"
  | "unknown";
```

- [ ] **Step 2: Add an audio ref next to the other refs inside the hook**

```typescript
  const audioRef = useRef<HTMLAudioElement | null>(null);
```

- [ ] **Step 3: Capture the reply text into a variable usable after the chat block**

In the existing `stop()` callback, find the chat step that currently does:
```typescript
      setReply(json.reply as string);
      if (typeof json.sessionId === "string" && json.sessionId) {
        setSessionId(json.sessionId);
      }
```
Immediately after this, declare a local that survives the try/catch:
```typescript
      const replyText = json.reply as string;
```
You may need to move the `let replyText = "";` declaration above the `try { const res = await fetch("/api/guide/chat" ...` block so it is in scope for Step 4 below. Final shape around the chat step:

```typescript
    setTranscript(userText);

    let replyText = "";
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
      replyText = json.reply as string;
      setReply(replyText);
      if (typeof json.sessionId === "string" && json.sessionId) {
        setSessionId(json.sessionId);
      }
    } catch {
      setError("chat_failed");
      setState("idle");
      return;
    }
```

- [ ] **Step 4: Replace the final `setState("idle")` with the TTS fetch + playback block**

Delete this existing line near the end of the `stop` callback:
```typescript
    // Phase 1 ends here — reply is shown as text, return to idle.
    setState("idle");
```

Replace it with:
```typescript
    // Phase 2: synthesize and play the reply
    let audioBlob: Blob;
    try {
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText }),
      });
      if (!res.ok) {
        setError("tts_failed");
        setState("idle");
        return;
      }
      audioBlob = await res.blob();
    } catch {
      setError("tts_failed");
      setState("idle");
      return;
    }

    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);
    audioRef.current = audio;
    setState("speaking");
    audio.onended = () => {
      URL.revokeObjectURL(url);
      audioRef.current = null;
      setState("idle");
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      audioRef.current = null;
      setError("tts_failed");
      setState("idle");
    };
    void audio.play().catch(() => {
      URL.revokeObjectURL(url);
      audioRef.current = null;
      setError("tts_failed");
      setState("idle");
    });
```

- [ ] **Step 4: Make `cancel()` also stop audio playback**

Update the `cancel` callback body to:
```typescript
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    try {
      recorderRef.current?.stop();
    } catch {
      /* noop */
    }
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch { /* noop */ }
      audioRef.current = null;
    }
    releaseStream();
    setState("idle");
  }, [releaseStream]);
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/guide/voice/useVoiceSession.ts
git commit -m "feat(voice): extend useVoiceSession with TTS speaking state"
```

---

## Task 11: Add `speaking` variant to `VoiceOrb`

**Files:**
- Modify: `src/app/guide/voice/VoiceOrb.tsx`

- [ ] **Step 1: Add the new entries to `VARIANTS` and `LABELS`**

In `src/app/guide/voice/VoiceOrb.tsx`, update the two records to include `speaking`:

```tsx
const VARIANTS: Record<VoiceSessionState, string> = {
  idle: "bg-slate-700/40 animate-[pulse_4s_ease-in-out_infinite]",
  listening: "bg-amber-500/50 animate-[pulse_0.9s_ease-in-out_infinite] ring-4 ring-amber-300/40",
  thinking: "bg-sky-500/40 animate-[pulse_1.4s_ease-in-out_infinite] ring-4 ring-sky-300/30",
  speaking: "bg-emerald-500/50 animate-[pulse_1.1s_ease-in-out_infinite] ring-4 ring-emerald-300/40",
};

const LABELS: Record<VoiceSessionState, string> = {
  idle: "اضغط مطوّلاً للحديث",
  listening: "أتحدّث أستمع…",
  thinking: "أتأمّل ردّك…",
  speaking: "أصغِ للمرشد…",
};
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. TypeScript's `Record<VoiceSessionState, string>` should now require the `speaking` key — this is why we widen the orb's variants at the same time.

- [ ] **Step 3: Commit**

```bash
git add src/app/guide/voice/VoiceOrb.tsx
git commit -m "feat(voice): add speaking variant to VoiceOrb"
```

---

## Task 12: Transcript eye toggle on the page

**Files:**
- Modify: `src/app/guide/voice/page.tsx`

- [ ] **Step 1: Add local state + toggle button**

In `src/app/guide/voice/page.tsx`, import `useState` from React, then inside the component add:

```tsx
  const [showTranscript, setShowTranscript] = useState(true);
```

Replace the `<section className="mt-12 ...">` block with:

```tsx
      <div className="mt-10">
        <button
          type="button"
          onClick={() => setShowTranscript((v) => !v)}
          className="text-sm text-slate-400 hover:text-slate-200"
          aria-pressed={!showTranscript}
        >
          {showTranscript ? "👁️ إخفاء النص" : "👁️‍🗨️ إظهار النص"}
        </button>
      </div>

      {showTranscript && (
        <section className="mt-6 w-full max-w-xl space-y-6">
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
      )}
```

Also extend `ERROR_MESSAGES` to cover the new `tts_failed` key:

```tsx
const ERROR_MESSAGES: Record<VoiceSessionError, string> = {
  mic_denied: "الرجاء السماح بالوصول للميكروفون من إعدادات المتصفح.",
  no_speech: "ما سمعت شيئًا. جرّب مرة ثانية.",
  stt_failed: "تعذّر تحويل الصوت إلى نص. حاول مجددًا.",
  chat_failed: "المرشد لا يستجيب الآن. حاول بعد لحظة.",
  tts_failed: "تعذّر تشغيل الصوت، الرد موجود كنص فوق.",
  unknown: "حدث خطأ غير متوقع.",
};
```

- [ ] **Step 2: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add src/app/guide/voice/page.tsx
git commit -m "feat(voice): add eye toggle and tts_failed error message"
```

---

## Task 13: `voice_sessions` logging table

**Files:**
- Create: `supabase/migrations/NNNN_voice_sessions.sql` (use the next timestamp in this repo's migration naming convention — check `supabase/migrations/` first)
- Modify: `src/app/api/voice/stt/route.ts`
- Modify: `src/app/api/voice/tts/route.ts`

- [ ] **Step 1: Check existing migration directory naming**

Run: `ls supabase/migrations/ 2>/dev/null || echo "no migrations dir"`
If no migrations directory exists, SKIP this entire task and instead create the table manually in Supabase SQL editor — document this in the commit message. Otherwise continue with whatever numeric/timestamp prefix convention the directory uses.

- [ ] **Step 2: Create the migration**

```sql
-- supabase/migrations/<NEXT>_voice_sessions.sql
create table if not exists public.voice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('stt', 'tts')),
  duration_sec numeric,
  chars integer,
  created_at timestamptz not null default now()
);

create index if not exists voice_sessions_user_id_created_at
  on public.voice_sessions (user_id, created_at desc);

alter table public.voice_sessions enable row level security;

create policy "own rows"
  on public.voice_sessions
  for select
  using (auth.uid() = user_id);
```

- [ ] **Step 3: Log STT usage from the route**

In `src/app/api/voice/stt/route.ts`, after the successful `transcribeAudio` call and before the 200 response, add (reusing the admin client pattern from `/api/guide/chat`):

```typescript
    // Best-effort usage log — never blocks the response
    try {
      const { getSupabaseAdmin } = await import("@/lib/supabaseAdmin");
      const admin = getSupabaseAdmin();
      void admin.from("voice_sessions").insert({
        user_id: auth.user.id,
        kind: "stt",
        chars: text.length,
      });
    } catch { /* noop */ }
```

- [ ] **Step 4: Log TTS usage from the route**

In `src/app/api/voice/tts/route.ts`, after `synthesizeSpeech` returns and before building the `Response`, add:

```typescript
    try {
      const { getSupabaseAdmin } = await import("@/lib/supabaseAdmin");
      const admin = getSupabaseAdmin();
      void admin.from("voice_sessions").insert({
        user_id: auth.user.id,
        kind: "tts",
        chars: text.length,
      });
    } catch { /* noop */ }
```

- [ ] **Step 5: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 6: Apply the migration**

Either run it via the Supabase CLI (`supabase db push`) or paste the SQL into the Supabase dashboard SQL editor for the Taamun project. Confirm the table exists.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations src/app/api/voice/stt/route.ts src/app/api/voice/tts/route.ts
git commit -m "feat(voice): log voice_sessions for STT and TTS usage"
```

---

## Task 13.5: Simple per-user rate limit (20 turns/min)

**Files:**
- Create: `src/lib/voiceRateLimit.ts`
- Modify: `src/app/api/voice/stt/route.ts`
- Modify: `src/app/api/voice/tts/route.ts`

- [ ] **Step 1: Create an in-memory token-bucket helper**

```typescript
// src/lib/voiceRateLimit.ts
// Process-local rate limit: 20 events per user per rolling 60 s window.
// Acceptable for MVP single-instance deploys. Replace with Redis/Supabase if we
// ever run multi-instance.

const WINDOW_MS = 60_000;
const LIMIT = 20;

const buckets = new Map<string, number[]>();

export function checkVoiceRateLimit(userId: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const arr = (buckets.get(userId) ?? []).filter((t) => t > cutoff);
  if (arr.length >= LIMIT) {
    const oldest = arr[0];
    const retryAfterSec = Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
    buckets.set(userId, arr);
    return { ok: false, retryAfterSec };
  }
  arr.push(now);
  buckets.set(userId, arr);
  return { ok: true };
}
```

- [ ] **Step 2: Enforce the limit in the STT route**

At the top of `POST` in `src/app/api/voice/stt/route.ts`, immediately after the `requireUser` check, add:

```typescript
  const { checkVoiceRateLimit } = await import("@/lib/voiceRateLimit");
  const rl = checkVoiceRateLimit(auth.user.id);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }
```

- [ ] **Step 3: Enforce the limit in the TTS route**

Apply the identical block at the top of `POST` in `src/app/api/voice/tts/route.ts`, immediately after the `requireUser` check.

- [ ] **Step 4: Surface the error in the hook**

In `src/app/guide/voice/useVoiceSession.ts`, widen `VoiceSessionError` to include `"rate_limited"` and set it in the STT branch when the response body says `error === "rate_limited"`:

```typescript
      if (!res.ok || !json?.ok || typeof json.text !== "string") {
        if (json?.error === "rate_limited") {
          setError("rate_limited");
        } else {
          setError(json?.error === "empty_transcript" ? "no_speech" : "stt_failed");
        }
        setState("idle");
        return;
      }
```

Then add the message to `ERROR_MESSAGES` in `src/app/guide/voice/page.tsx`:
```tsx
  rate_limited: "تجاوزت الحد المسموح. انتظر قليلاً ثم جرّب مرة ثانية.",
```

- [ ] **Step 5: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add src/lib/voiceRateLimit.ts src/app/api/voice/stt/route.ts src/app/api/voice/tts/route.ts src/app/guide/voice/useVoiceSession.ts src/app/guide/voice/page.tsx
git commit -m "feat(voice): per-user rate limit 20/min on voice routes"
```

---

## Task 14: Phase 2 manual QA gate

- [ ] **Step 1: Full device QA**

Run `npm run dev`, open `/guide/voice` on the dev machine, and verify:
- [ ] Press-hold-speak-release → orb cycles `idle → listening → thinking → speaking → idle`.
- [ ] Audio of the guide's reply plays in Arabic through the speakers.
- [ ] Transcript and reply boxes render under the orb.
- [ ] 👁️ toggle hides/shows the transcript block.
- [ ] Releasing mid-recording (pointer-leave) cancels cleanly — no ghost audio, no crash.
- [ ] Forced TTS failure (temporarily break `MUNSIT_TTS_MODEL_ID`) shows the `tts_failed` message AND the text reply is still visible.
- [ ] Second turn in the same page reuses `sessionId` (observable in `/api/guide/chat` logs).

- [ ] **Step 2: Supabase check**

Run the following query in the Supabase dashboard for the Taamun project:
```sql
select kind, chars, created_at
from voice_sessions
where user_id = auth.uid()
order by created_at desc
limit 10;
```
Expected: one `stt` row and one `tts` row per voice turn.

- [ ] **Step 3: Final release gate**

Run: `npm run guard:release`
Expected: brand + runtime + metadata + tsc + build all pass. If any of the guards fail on files this feature did not touch, surface the failure to the user and stop — do not "fix" unrelated code (CLAUDE.md rule 8).

- [ ] **Step 4: Final wrap commit (only if QA fixes landed)**

```bash
git add -A
git commit -m "chore(voice): Phase 2 QA fixes"
```

Then remind the user: `✅ /guide/voice مع TTS شغّال. ادفع التحديثات من Cursor (Terminal → git push).`
