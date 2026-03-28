import { NextRequest, NextResponse } from "next/server";
import {
  verifyInstagramWebhook,
  parseInstagramMessageEvent,
  sendInstagramDM,
} from "@/lib/agents/instagram";
import { routeMessage } from "@/lib/agents/router";
import { generateAgentResponse } from "@/lib/agents/claude";
import type { IncomingMessage } from "@/lib/agents/types";

// GET — Instagram webhook verification
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode") ?? "";
  const token = req.nextUrl.searchParams.get("hub.verify_token") ?? "";
  const challenge = req.nextUrl.searchParams.get("hub.challenge") ?? "";

  const result = verifyInstagramWebhook(mode, token, challenge);
  if (result) {
    return new NextResponse(result, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// POST — Incoming message webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = parseInstagramMessageEvent(body);
    if (!parsed) {
      return NextResponse.json({ ok: true });
    }

    // Don't reply to our own page messages
    const pageId = process.env.INSTAGRAM_PAGE_ID;
    if (parsed.senderId === pageId) {
      return NextResponse.json({ ok: true });
    }

    const incoming: IncomingMessage = {
      platform: "instagram",
      senderId: parsed.senderId,
      text: parsed.text,
      messageId: parsed.messageId,
      timestamp: Date.now(),
    };

    // Route to correct agent
    const agent = routeMessage(incoming);

    // Generate response
    const response = await generateAgentResponse(
      agent,
      "instagram",
      incoming.text
    );

    // If handoff detected, generate response from the new agent
    if (response.handoff) {
      const handoffResponse = await generateAgentResponse(
        response.handoff,
        "instagram",
        incoming.text
      );
      await sendInstagramDM(parsed.senderId, response.text);
      await sendInstagramDM(parsed.senderId, handoffResponse.text);
    } else {
      await sendInstagramDM(parsed.senderId, response.text);
    }

    return NextResponse.json({ ok: true, agent });
  } catch (err) {
    console.error("[Instagram Webhook] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
