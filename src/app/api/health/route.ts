import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * Public health check — shows key availability (not values).
 */
export async function GET() {
  const keys = {
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ENTITLEMENT_SECRET: !!process.env.ENTITLEMENT_SECRET,
    ANTHROPIC_CHAT_MODEL: process.env.ANTHROPIC_CHAT_MODEL ?? "(default: claude-sonnet-4-20250514)",
  };

  // Quick Claude API ping if key exists
  let claudeStatus = "no_key";
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_CHAT_MODEL ?? "claude-sonnet-4-20250514",
          max_tokens: 5,
          messages: [{ role: "user", content: "قل: ok" }],
        }),
      });
      if (res.ok) {
        claudeStatus = "connected";
      } else {
        const text = await res.text();
        claudeStatus = `error_${res.status}: ${text.slice(0, 150)}`;
      }
    } catch (e) {
      claudeStatus = `exception: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return NextResponse.json({ ok: true, keys, claudeStatus });
}
