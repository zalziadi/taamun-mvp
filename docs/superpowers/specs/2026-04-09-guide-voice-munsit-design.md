# Guide Voice — Munsit Voice Agent Integration

**Date:** 2026-04-09
**Status:** Approved design, ready for implementation planning
**Owner:** Ziad

## Summary

Add a dedicated voice-only guide experience at `/guide/voice` that lets users speak to the Taamun guide in Arabic. Speech is transcribed by Munsit STT, routed through the existing `/api/guide/chat` RAG pipeline, and spoken back by Munsit TTS. Purpose: honor Taamun's core of inward listening by giving users a hands-free, eyes-closed path to the guide — replacing keyboard friction with voice.

## Goals

- Let the user hold a natural Arabic voice conversation with the Taamun guide.
- Reuse the existing guide RAG pipeline (`/api/guide/chat`) unchanged.
- Keep all Munsit credentials server-side.
- Ship a focused v1: push-to-talk, batch STT, single voice, no streaming.

## Non-Goals (v1)

- Real-time streaming STT/TTS.
- Barge-in (interrupting the guide mid-speech).
- Manual dialect selection (Munsit auto-detects).
- Separate voice-session archive UI (reuses existing chat history in Supabase).
- Wake word / hotword activation.
- Continuous voice activity detection (VAD).

## User Experience

**Route:** `/guide/voice` — authenticated, RTL Arabic, full-page.

**Layout:**
- Calm background consistent with Taamun's identity.
- Centered **VoiceOrb**: a pulsing circle that reflects session state.
- Large **push-to-talk mic button** beneath the orb. Hold to speak, release to send.
- Minimal **live transcript** below the button: shows the latest user utterance and the latest guide reply. Fades out when the reply finishes.
- Eye toggle (`👁️`) to hide the transcript entirely for eyes-closed sessions.
- Back link to `/guide` (text chat).

**Orb states:**
| State | Visual | Trigger |
|---|---|---|
| `idle` | Slow breathing pulse, neutral color | Ready, nothing happening |
| `listening` | Fast reactive pulse, warm color | Mic button held down, capturing audio |
| `thinking` | Ring shimmer, cool color | STT + chat request in flight |
| `speaking` | Waveform ripple, accent color | TTS audio playing |

**Error states (user-facing Arabic):**
- Mic permission denied → instructional message + retry.
- "ما سمعتك" → empty transcription result.
- "السيرفر بطيء، جرب مرة ثانية" → API failure or timeout.
- Audio playback failure → fallback to showing the text reply.

**Why push-to-talk, not continuous VAD:** avoids hot-mic privacy concerns, simplest MVP, and fits meditation semantics (the user chooses the moment to speak).

## Architecture

### Data flow

```
[🎤 Browser / MediaRecorder]
   ↓ webm/opus blob
[POST /api/voice/stt]               ← new, authenticated
   ↓ multipart → Munsit STT
   ← { text: "…" } (Arabic)
[POST /api/guide/chat]              ← existing, unchanged
   ↓ RAG + Supabase session history
   ← { reply: "…" }
[POST /api/voice/tts]               ← new, authenticated
   ↓ Munsit TTS
   ← audio/mpeg stream
[🔊 <audio> element in the browser]
```

### New files

| Path | Purpose |
|---|---|
| `src/app/guide/voice/page.tsx` | Client page (orb, PTT button, transcript, state wiring) |
| `src/app/guide/voice/VoiceOrb.tsx` | Presentational orb component with 4 state variants |
| `src/app/guide/voice/useVoiceSession.ts` | Hook: MediaRecorder lifecycle, state machine, fetch chain |
| `src/app/api/voice/stt/route.ts` | Authenticated proxy → Munsit STT |
| `src/app/api/voice/tts/route.ts` | Authenticated proxy → Munsit TTS (streams audio back) |
| `src/lib/munsit.ts` | Small wrapper: endpoints, auth header, error normalization |

### Unchanged / reused

- `src/app/api/guide/chat/route.ts` — voice and text share one RAG brain.
- `src/lib/authz.ts` (`requireUser`) — same auth pattern as the existing guide route.
- `src/lib/rag.ts` — `completeWithContext`, embeddings, session memory.
- Supabase tables for chat history — the voice path writes through the same session.

### State machine (client hook)

```
idle
  → (mic down)   → listening
listening
  → (mic up)     → thinking   (POST /api/voice/stt)
  → (mic cancel) → idle
thinking
  → (stt ok)     → thinking   (POST /api/guide/chat)
  → (chat ok)    → thinking   (POST /api/voice/tts)
  → (tts ok)     → speaking   (play audio)
  → (any error)  → idle       (surface Arabic error toast)
speaking
  → (audio end)  → idle
```

One session = one user turn. The hook exposes `{ state, transcript, reply, error, start, stop, cancel }`.

## API Contracts

### `POST /api/voice/stt`
- **Auth:** `requireUser`
- **Body:** `multipart/form-data` with field `audio` (webm/opus, ≤ 2 MB, ≤ 60 s)
- **Response:** `{ text: string }`
- **Errors:** `401` unauthorized, `413` too large, `422` empty/unintelligible, `502` Munsit upstream failure
- **Implementation:** forwards the blob to Munsit STT with the server-side API key. No client ever sees `MUNSIT_API_KEY`.

### `POST /api/voice/tts`
- **Auth:** `requireUser`
- **Body:** `{ text: string }` (≤ 2000 chars)
- **Response:** `audio/mpeg` stream
- **Errors:** `401`, `413`, `502`
- **Implementation:** calls Munsit TTS with `MUNSIT_VOICE_ID`, streams the audio response through to the client.

### `POST /api/guide/chat` (unchanged)
- Voice path calls it with the transcribed text. No schema change.

## Security & Limits

- `MUNSIT_API_KEY` is **server-only**. Never exposed in client bundles or network responses.
- Both new routes require an authenticated Taamun user.
- Hard limits: ≤ 60 s audio, ≤ 2 MB upload, ≤ 2000 chars TTS input.
- Simple per-user rate limit: 20 voice turns per minute (shared counter for STT + TTS).
- New Supabase table `voice_sessions` for cost tracking: `user_id`, `duration_sec`, `stt_chars`, `tts_chars`, `created_at`.
- Uploaded audio blobs are not persisted — forwarded to Munsit and discarded after the response.

## Environment Variables

```
MUNSIT_API_KEY=            # server only
MUNSIT_STT_ENDPOINT=       # Munsit STT REST URL
MUNSIT_TTS_ENDPOINT=       # Munsit TTS REST URL
MUNSIT_VOICE_ID=           # default Arabic voice
```

Documented in the project's env example file during implementation.

## Testing

- **Unit:** `useVoiceSession` state machine transitions; `munsit.ts` error normalization.
- **API:** mocked Munsit responses — happy path, empty transcription, upstream 5xx, oversized payload, missing auth.
- **Manual QA:** on a physical device, run the full loop in Arabic (Saudi dialect) and verify orb state, transcript, audio playback, mic permission denial flow, and a forced network failure.
- **Cost check:** first production session logs a row in `voice_sessions` and the totals look sane.

## Open Questions

None blocking. Voice ID selection, rate-limit tuning, and `voice_sessions` schema details will be confirmed during implementation.

## Rollout

- Ship behind the normal auth gate, no feature flag.
- Link from `/guide` to `/guide/voice` with a small "🎙️ جلسة صوتية" affordance.
- Monitor `voice_sessions` for cost and usage for the first week; adjust rate limits if needed.
