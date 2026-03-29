import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID ?? "";
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "";
const VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID ?? "";

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = (await req.json()) as { phone?: string; code?: string };
    if (!phone || !code || code.length !== 6) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    if (!TWILIO_SID || !TWILIO_TOKEN || !VERIFY_SID) {
      console.error("[phone/verify] Missing Twilio env vars");
      return NextResponse.json({ error: "server_config" }, { status: 500 });
    }

    // Step 1: Verify OTP with Twilio Verify
    const url = `https://verify.twilio.com/v2/Services/${VERIFY_SID}/VerificationChecks`;
    const body = new URLSearchParams({ To: phone, Code: code });
    const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");

    const twilioRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const twilioData = (await twilioRes.json().catch(() => ({}))) as Record<string, unknown>;

    if (!twilioRes.ok || twilioData.status !== "approved") {
      console.error("[phone/verify] Twilio rejected:", twilioData);
      if (String(twilioData.status) === "pending") {
        return NextResponse.json({ error: "wrong_code" }, { status: 400 });
      }
      if (String(twilioData.code) === "60202") {
        return NextResponse.json({ error: "max_attempts" }, { status: 429 });
      }
      return NextResponse.json({ error: "verification_failed" }, { status: 400 });
    }

    // Step 2: Find or create Supabase user
    const admin = getSupabaseAdmin();
    const derivedEmail = `phone_${phone.replace(/\+/g, "")}@taamun.phone`;

    // Try to create user — if already exists, Supabase returns an error
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      phone,
      phone_confirm: true,
      email: derivedEmail,
      email_confirm: true,
    });

    let userEmail = derivedEmail;

    if (createErr) {
      // User likely already exists — look up by derived email or phone
      const msg = createErr.message?.toLowerCase() ?? "";
      if (msg.includes("already") || msg.includes("exists") || msg.includes("duplicate")) {
        // Find by iterating (Supabase admin doesn't have getUserByPhone)
        let found = false;
        let page = 1;
        while (!found) {
          const { data: { users: batch } } = await admin.auth.admin.listUsers({ page, perPage: 50 });
          if (!batch || batch.length === 0) break;
          const match = batch.find((u) => u.phone === phone || u.email === derivedEmail);
          if (match) {
            userEmail = match.email ?? derivedEmail;
            found = true;
            break;
          }
          if (batch.length < 50) break;
          page++;
        }
        if (!found) {
          console.error("[phone/verify] User exists but not found:", phone);
          return NextResponse.json({ error: "user_not_found" }, { status: 500 });
        }
      } else {
        console.error("[phone/verify] Create user error:", createErr);
        return NextResponse.json({ error: "user_create_failed" }, { status: 500 });
      }
    }

    // Step 3: Generate magic link to create a session
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: userEmail,
    });

    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error("[phone/verify] Generate link error:", linkErr);
      return NextResponse.json({ error: "session_failed" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      hashed_token: linkData.properties.hashed_token,
    });
  } catch (e) {
    console.error("[phone/verify] Unexpected error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
