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
