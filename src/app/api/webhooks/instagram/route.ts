import { NextRequest, NextResponse } from "next/server";
import {
  verifyInstagramWebhook,
  parseInstagramMessageEvent,
  parseInstagramCommentEvent,
  sendInstagramDM,
  replyToInstagramComment,
} from "@/lib/agents/instagram";
import { routeMessage } from "@/lib/agents/router";
import { generateAgentResponse } from "@/lib/agents/claude";
import type { IncomingMessage } from "@/lib/agents/types";

/** كلمات مفتاحية تفعّل الرد التلقائي على التعليقات */
const COMMENT_TRIGGER_KEYWORDS = [
  "تمعّن", "تمعن", "تمعًن",
  "ايش تمعن", "وش تمعن",
  "كيف أشترك", "كيف اشترك",
  "الرابط", "اللنك", "السعر", "كم سعر",
  "أبي أشترك", "ابي اشترك",
  "28 ريال", "عيدية",
];

function shouldReplyToComment(text: string): boolean {
  const lower = text.toLowerCase();
  return COMMENT_TRIGGER_KEYWORDS.some((kw) => lower.includes(kw));
}

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

// POST — Incoming message or comment webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── 1. Try DM first ──
    const parsed = parseInstagramMessageEvent(body);
    if (parsed) {
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

      const agent = routeMessage(incoming);
      const response = await generateAgentResponse(agent, "instagram", incoming.text);

      if (response.handoff) {
        const handoffResponse = await generateAgentResponse(
          response.handoff, "instagram", incoming.text
        );
        await sendInstagramDM(parsed.senderId, response.text);
        await sendInstagramDM(parsed.senderId, handoffResponse.text);
      } else {
        await sendInstagramDM(parsed.senderId, response.text);
      }

      return NextResponse.json({ ok: true, agent, type: "dm" });
    }

    // ── 2. Try Comment ──
    const comment = parseInstagramCommentEvent(body);
    if (comment) {
      const pageId = process.env.INSTAGRAM_PAGE_ID;
      if (comment.senderId === pageId) {
        return NextResponse.json({ ok: true });
      }

      if (!shouldReplyToComment(comment.text)) {
        return NextResponse.json({ ok: true, skipped: "no_trigger_keyword" });
      }

      const incoming: IncomingMessage = {
        platform: "instagram",
        senderId: comment.senderId,
        text: comment.text,
        messageId: comment.commentId,
        timestamp: Date.now(),
      };

      const agent = routeMessage(incoming);
      const response = await generateAgentResponse(agent, "instagram", incoming.text);

      await replyToInstagramComment(comment.commentId, response.text);

      return NextResponse.json({ ok: true, agent, type: "comment" });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Instagram Webhook] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
