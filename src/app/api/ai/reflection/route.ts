/**
 * POST /api/ai/reflection
 *
 * Phase 4 · Task 1 — AI Reflection Engine (public endpoint).
 * Phase 4 · Task 2 — refactored to use shared lib so /api/reflections
 * POST can invoke the same analyzer without duplicating the prompt.
 *
 * This route exists as a stand-alone endpoint for:
 *   - Direct client calls (if a future hook wants synchronous AI)
 *   - Debug/testing tools
 *   - Any future caller that wants AI without the save path
 *
 * The actual AI logic lives in src/lib/ai/analyzeReflection.ts.
 * This file is now a thin HTTP adapter: parse body, auth, call lib,
 * format response.
 *
 * Auth: requireUser (consistent with /api/reflections).
 */

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/authz";
import { analyzeReflection } from "@/lib/ai/analyzeReflection";

export const dynamic = "force-dynamic";

type RequestBody = {
  text?: unknown;
  day?: unknown;
};

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const day = Number(body.day);

  if (!text) {
    return NextResponse.json({ ok: false, error: "text_missing" }, { status: 400 });
  }
  if (text.length < 3) {
    return NextResponse.json({ ok: false, error: "text_too_short" }, { status: 400 });
  }
  if (!Number.isInteger(day) || day < 1 || day > 28) {
    return NextResponse.json({ ok: false, error: "invalid_day" }, { status: 400 });
  }

  try {
    const analysis = await analyzeReflection(text, day);
    return NextResponse.json({ ok: true, analysis });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    // Map known lib errors to sensible HTTP codes
    if (msg === "ai_not_configured") {
      return NextResponse.json(
        { ok: false, error: "ai_not_configured" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "ai_request_failed",
        detail: msg.slice(0, 200),
      },
      { status: 502 }
    );
  }
}
