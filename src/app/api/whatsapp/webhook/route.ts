// ─── WhatsApp Business API Webhook Handler ───
// Receives incoming messages, routes through agent intelligence, responds.
// Uses the same agent system (Warda/Musakhar/Samra) as Twitter/Instagram.
//
// Setup required:
// 1. WHATSAPP_VERIFY_TOKEN — for webhook verification (GET)
// 2. WHATSAPP_ACCESS_TOKEN — for sending replies (Meta Cloud API)
// 3. WHATSAPP_PHONE_NUMBER_ID — your business phone number ID
// 4. Configure webhook URL in Meta Developer Console
//
// Guardrails (see src/lib/agents/guardrails.ts):
//   - WARDA_DRY_RUN=1            -> log replies, do not send
//   - WARDA_RECIPIENT_MODE       -> "allowlist" | "denylist" | "open"
//   - WARDA_ALLOWLIST            -> comma-separated E.164 numbers
//   - WHATSAPP_BUSINESS_NUMBER   -> our own number, never message it
//   - WARDA_OPERATOR_NUMBER      -> operator's personal line, never message it

import { NextRequest, NextResponse } from "next/server";
import { routeMessage } from "@/lib/agents/router";
import { generateAgentResponse } from "@/lib/agents/claude";
import { checkOutbound, checkRecipient, isDryRun } from "@/lib/agents/guardrails";
import type { IncomingMessage, AgentName } from "@/lib/agents/types";

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

    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages?.length) {
      return NextResponse.json({ ok: true });
    }

    const message = value.messages[0];
    const contact = value.contacts?.[0];

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

    // Recipient gate (BEFORE we spend an API call). The reply target is the
    // same number that wrote in, so we check that against the allowlist.
    const recipientCheck = checkRecipient(message.from);
    if (!recipientCheck.allowed) {
      console.warn(
        `[WhatsApp] Refusing to engage with ${message.from}: ${recipientCheck.reason}`
      );
      return NextResponse.json({ ok: true, skipped: recipientCheck.reason });
    }

    // Route + generate
    const agentName: AgentName = routeMessage(incomingMessage);

    const agentResponse = await generateAgentResponse(
      agentName,
      "whatsapp",
      incomingMessage.text
    );

    let finalText = agentResponse.text;
    let finalAgent: AgentName = agentName;
    if (agentResponse.handoff) {
      const handoffResponse = await generateAgentResponse(
        agentResponse.handoff,
        "whatsapp",
        incomingMessage.text
      );
      finalText = handoffResponse.text;
      finalAgent = agentResponse.handoff;
    }

    // Outbound content gate.
    const outbound = checkOutbound(finalText, finalAgent);
    if (outbound.blocked) {
      console.error(
        `[WhatsApp] Outbound BLOCKED for ${message.from} (agent=${finalAgent}): ${outbound.reason}`
      );
      return NextResponse.json({
        ok: true,
        blocked: true,
        reason: outbound.reason,
      });
    }
    if (outbound.scrubbed) {
      console.warn(
        `[WhatsApp] Outbound scrubbed for ${message.from} (agent=${finalAgent})`
      );
    }

    // Send (or log if dry-run).
    if (isDryRun()) {
      console.log(
        `[WhatsApp][DRY-RUN] would send to ${message.from} (agent=${finalAgent}): ${outbound.safeText}`
      );
    } else {
      await sendWhatsAppReply(message.from, outbound.safeText);
    }

    return NextResponse.json({
      ok: true,
      agent: finalAgent,
      scrubbed: outbound.scrubbed,
      dryRun: isDryRun(),
    });
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
