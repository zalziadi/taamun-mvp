import { NextRequest, NextResponse } from "next/server";
import {
  validateTwitterCRC,
  parseTwitterDMEvent,
  sendTwitterDM,
} from "@/lib/agents/twitter";
import { routeMessage } from "@/lib/agents/router";
import { generateAgentResponse } from "@/lib/agents/claude";
import type { IncomingMessage } from "@/lib/agents/types";

// GET — Twitter CRC validation
export async function GET(req: NextRequest) {
  const crcToken = req.nextUrl.searchParams.get("crc_token");
  if (!crcToken) {
    return NextResponse.json({ error: "Missing crc_token" }, { status: 400 });
  }

  try {
    const responseToken = await validateTwitterCRC(crcToken);
    return NextResponse.json({ response_token: responseToken });
  } catch (err) {
    console.error("[Twitter CRC] Error:", err);
    return NextResponse.json({ error: "CRC validation failed" }, { status: 500 });
  }
}

// POST — Incoming DM webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Ignore our own messages
    const forUserId = body.for_user_id;
    const parsed = parseTwitterDMEvent(body);
    if (!parsed) {
      return NextResponse.json({ ok: true });
    }

    // Don't reply to ourselves
    if (parsed.senderId === forUserId) {
      return NextResponse.json({ ok: true });
    }

    const incoming: IncomingMessage = {
      platform: "twitter",
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
      "twitter",
      incoming.text
    );

    // If handoff detected, generate response from the new agent
    if (response.handoff) {
      const handoffResponse = await generateAgentResponse(
        response.handoff,
        "twitter",
        incoming.text
      );
      // Send both: handoff message + new agent response
      await sendTwitterDM(parsed.senderId, response.text);
      await sendTwitterDM(parsed.senderId, handoffResponse.text);
    } else {
      await sendTwitterDM(parsed.senderId, response.text);
    }

    return NextResponse.json({ ok: true, agent });
  } catch (err) {
    console.error("[Twitter Webhook] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
