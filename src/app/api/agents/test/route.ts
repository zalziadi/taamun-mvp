import { NextRequest, NextResponse } from "next/server";
import { routeMessage } from "@/lib/agents/router";
import { generateAgentResponse } from "@/lib/agents/claude";
import type { AgentName, IncomingMessage, Platform } from "@/lib/agents/types";

/**
 * POST /api/agents/test
 *
 * Test endpoint to verify agents work without social media.
 *
 * Body: {
 *   message: string,           // the user message
 *   platform?: "twitter" | "instagram",  // default: "instagram"
 *   agent?: "warda" | "musakhar" | "samra"  // force agent (optional)
 * }
 *
 * Protected by ADMIN_KEY header.
 */
export async function POST(req: NextRequest) {
  // Auth check
  const adminKey = req.headers.get("x-admin-key");
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { message, platform = "instagram", agent: forceAgent } = body as {
      message?: string;
      platform?: Platform;
      agent?: AgentName;
    };

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    // Build incoming message
    const incoming: IncomingMessage = {
      platform,
      senderId: "test-user",
      text: message,
      messageId: `test-${Date.now()}`,
      timestamp: Date.now(),
    };

    // Route or use forced agent
    const selectedAgent = forceAgent ?? routeMessage(incoming);

    // Generate response
    const response = await generateAgentResponse(
      selectedAgent,
      platform,
      message
    );

    return NextResponse.json({
      ok: true,
      routed_to: selectedAgent,
      agent_name_ar:
        selectedAgent === "warda"
          ? "وردة"
          : selectedAgent === "musakhar"
            ? "مسخر"
            : "سمرا",
      platform,
      response: response.text,
      handoff: response.handoff ?? null,
    });
  } catch (err) {
    console.error("[Agent Test] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/agents/test
 * Quick health check — no auth needed.
 */
export async function GET() {
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  const hasTwitter = !!process.env.TWITTER_BEARER_TOKEN;
  const hasInstagram = !!process.env.INSTAGRAM_PAGE_TOKEN;

  return NextResponse.json({
    status: "ok",
    agents: ["musakhar", "warda", "samra"],
    keys: {
      anthropic: hasAnthropicKey ? "configured" : "MISSING",
      twitter: hasTwitter ? "configured" : "MISSING",
      instagram: hasInstagram ? "configured" : "MISSING",
    },
  });
}
