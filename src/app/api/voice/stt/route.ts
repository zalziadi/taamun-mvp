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
        { status: 502 },
      );
    }
    console.error("[voice/stt] unexpected error:", err);
    return NextResponse.json({ ok: false, error: "stt_failed" }, { status: 500 });
  }
}
