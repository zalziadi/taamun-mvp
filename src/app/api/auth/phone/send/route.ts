import { NextRequest, NextResponse } from "next/server";

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID ?? "";
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "";
const VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID ?? "";

export async function POST(req: NextRequest) {
  try {
    const { phone } = (await req.json()) as { phone?: string };
    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
    }

    if (!TWILIO_SID || !TWILIO_TOKEN || !VERIFY_SID) {
      console.error("[phone/send] Missing Twilio env vars");
      return NextResponse.json({ error: "server_config" }, { status: 500 });
    }

    const url = `https://verify.twilio.com/v2/Services/${VERIFY_SID}/Verifications`;
    const body = new URLSearchParams({ To: phone, Channel: "sms" });
    const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("[phone/send] Twilio error:", res.status, data);
      const msg = (data as Record<string, unknown>).message as string | undefined;
      if (msg?.toLowerCase().includes("invalid parameter")) {
        return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
      }
      return NextResponse.json({ error: "send_failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[phone/send] Unexpected error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
