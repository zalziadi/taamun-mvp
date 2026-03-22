import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/authz";
import { sendSlackMessage } from "@/lib/slack";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let text = "✅ اختبار ربط Slack من تمَعّن (taamun-mvp)";
  try {
    const body = await req.json();
    if (typeof body?.text === "string" && body.text.trim()) {
      text = body.text.trim();
    }
  } catch {
    /* default */
  }

  const result = await sendSlackMessage({ text, username: "Taamun" });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? "send_failed" }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
