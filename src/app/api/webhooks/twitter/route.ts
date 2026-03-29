import { NextRequest, NextResponse } from "next/server";
import {
  validateTwitterCRC,
  parseTwitterDMEvent,
  parseTwitterMentionEvent,
  sendTwitterDM,
  replyToTweet,
} from "@/lib/agents/twitter";
import { routeMessage } from "@/lib/agents/router";
import { generateAgentResponse } from "@/lib/agents/claude";
import type { IncomingMessage } from "@/lib/agents/types";

/** كلمات مفتاحية تفعّل الرد التلقائي على المنشنز */
const MENTION_TRIGGER_KEYWORDS = [
  "تمعّن", "تمعن", "تمعًن",
  "ايش تمعن", "وش تمعن",
  "كيف أشترك", "كيف اشترك",
  "الرابط", "السعر", "كم سعر",
  "أبي أشترك", "ابي اشترك",
  "28 ريال", "عيدية",
];

function shouldReplyToMention(text: string): boolean {
  const lower = text.toLowerCase();
  return MENTION_TRIGGER_KEYWORDS.some((kw) => lower.includes(kw));
}

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

// POST — Incoming DM or mention webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const forUserId = body.for_user_id as string | undefined;

    // ── 1. Try DM first ──
    const parsed = parseTwitterDMEvent(body);
    if (parsed) {
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

      const agent = routeMessage(incoming);
      const response = await generateAgentResponse(agent, "twitter", incoming.text);

      if (response.handoff) {
        const handoffResponse = await generateAgentResponse(
          response.handoff, "twitter", incoming.text
        );
        await sendTwitterDM(parsed.senderId, response.text);
        await sendTwitterDM(parsed.senderId, handoffResponse.text);
      } else {
        await sendTwitterDM(parsed.senderId, response.text);
      }

      return NextResponse.json({ ok: true, agent, type: "dm" });
    }

    // ── 2. Try Mention/Reply ──
    const mention = parseTwitterMentionEvent(body);
    if (mention) {
      if (mention.senderId === forUserId) {
        return NextResponse.json({ ok: true });
      }

      if (!shouldReplyToMention(mention.text)) {
        return NextResponse.json({ ok: true, skipped: "no_trigger_keyword" });
      }

      const incoming: IncomingMessage = {
        platform: "twitter",
        senderId: mention.senderId,
        text: mention.text,
        messageId: mention.tweetId,
        timestamp: Date.now(),
      };

      const agent = routeMessage(incoming);
      const response = await generateAgentResponse(agent, "twitter", incoming.text);

      await replyToTweet(mention.tweetId, response.text);

      return NextResponse.json({ ok: true, agent, type: "mention" });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Twitter Webhook] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
