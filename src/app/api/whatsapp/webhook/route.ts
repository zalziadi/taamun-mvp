// ─── WhatsApp Business API Webhook Handler ───
// Receives incoming messages, routes through agent intelligence, responds.
// Uses the same agent system (Warda/Musakhar/Samra) as Twitter/Instagram.
//
// Setup required:
// 1. WHATSAPP_VERIFY_TOKEN — for webhook verification (GET)
// 2. WHATSAPP_ACCESS_TOKEN — for sending replies (Meta Cloud API)
// 3. WHATSAPP_PHONE_NUMBER_ID — your business phone number ID
// 4. Configure webhook URL in Meta Developer Console

import { NextRequest, NextResponse } from "next/server";
import { routeMessage, detectHandoff, stripHandoffTag } from "@/lib/agents/router";
import { generateAgentResponse } from "@/lib/agents/claude";
import type { IncomingMessage } from "@/lib/agents/types";

/* ── GET: Webhook Verification (Meta handshake) ── */

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken && challenge) {
    console.log("[WhatsApp] Webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/* ── POST: Incoming Messages ── */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Meta Cloud API sends a specific structure
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Only process messages (not status updates)
    if (!value?.messages?.length) {
      return NextResponse.json({ ok: true });
    }

    const message = value.messages[0];
    const contact = value.contacts?.[0];

    // Only handle text messages for now
    if (message.type !== "text") {
      return NextResponse.json({ ok: true });
    }

    const incomingMessage: IncomingMessage = {
      platform: "whatsapp",
      senderId: message.from,
      senderName: contact?.profile?.name ?? undefined,
      text: message.text.body,
      messageId: message.id,
      timestamp: parseInt(message.timestamp, 10) * 1000,
    };

    // Route to correct agent
    const agentName = routeMessage(incomingMessage);

    // Generate response
    const agentResponse = await generateAgentResponse(
      agentName,
      "whatsapp",
      incomingMessage.text
    );

    // If handoff detected, generate response from new agent
    let finalText = agentResponse.text;
    if (agentResponse.handoff) {
      const handoffResponse = await generateAgentResponse(
        agentResponse.handoff,
        "whatsapp",
        incomingMessage.text
      );
      finalText = handoffResponse.text;
    }

    // Send reply via WhatsApp Cloud API
    await sendWhatsAppReply(message.from, finalText);

    return NextResponse.json({ ok: true, agent: agentName });
  } catch (error) {
    console.error("[WhatsApp] Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/* ── Send reply via Meta Cloud API ── */

async function sendWhatsAppReply(to: string, text: string): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.warn("[WhatsApp] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID — reply skipped");
    return;
  }

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

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

  if (!res.ok) {
    const err = await res.text();
    console.error("[WhatsApp] Send failed:", res.status, err);
  }
}
