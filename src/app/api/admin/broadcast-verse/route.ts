import { NextResponse } from "next/server";
import { getTodayVerse } from "@/lib/daily-verse-post28";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/broadcast-verse
 *
 * Posts today's verse to a list of phone numbers via WhatsApp Business API.
 * Used by the founder to broadcast the daily verse to the community group
 * (Meta's WhatsApp Business API sends to individuals, not groups — this
 * targets a configured list of admin/moderator numbers who then relay to
 * the actual group, or we use this for direct 1:1 broadcast to subscribers).
 *
 * Protected by ADMIN_MIGRATION_KEY / SUPABASE_SERVICE_ROLE_KEY.
 *
 * Body: {
 *   key: string,
 *   recipients: string[] (phone numbers in E.164, e.g. ['966500000000']),
 *   customMessage?: string (optional override for the verse)
 * }
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    key?: string;
    recipients?: string[];
    customMessage?: string;
  };

  const expectedKey = process.env.ADMIN_MIGRATION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!body.key || body.key !== expectedKey) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) {
    return NextResponse.json(
      { error: "wa_not_configured", hint: "Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID" },
      { status: 500 }
    );
  }

  const recipients = Array.isArray(body.recipients) ? body.recipients.filter((r) => typeof r === "string" && r.length > 0) : [];
  if (recipients.length === 0) {
    return NextResponse.json({ error: "no_recipients" }, { status: 400 });
  }

  // Compose the broadcast text
  let text: string;
  if (body.customMessage) {
    text = body.customMessage;
  } else {
    const today = getTodayVerse();
    text = `🌅 آية اليوم — تمعّن\n\n${today.verse}\n\n— ${today.ref}\n\n${today.prompt}\n\nhttps://taamun-mvp.vercel.app`;
  }

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
  const results = {
    total: recipients.length,
    sent: 0,
    failed: [] as { to: string; error: string }[],
  };

  for (const to of recipients) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { body: text },
        }),
      });

      if (res.ok) {
        results.sent++;
      } else {
        const errText = await res.text();
        results.failed.push({ to, error: `${res.status}: ${errText.slice(0, 200)}` });
      }
    } catch (err) {
      results.failed.push({ to, error: (err as Error).message });
    }
  }

  return NextResponse.json({
    ok: results.failed.length === 0,
    ...results,
  });
}
