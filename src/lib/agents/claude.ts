// ─── Claude API Integration for Agent Responses ───

import type { AgentName, Platform, AgentResponse } from "./types";
import { getAgentPrompt } from "./prompts";
import { detectHandoff, stripHandoffTag } from "./router";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Generates an agent response using Claude API.
 */
export async function generateAgentResponse(
  agent: AgentName,
  platform: Platform,
  userMessage: string,
  conversationHistory: ClaudeMessage[] = []
): Promise<AgentResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const systemPrompt = getAgentPrompt(agent, platform);

  const messages: ClaudeMessage[] = [
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error: ${res.status} - ${err}`);
  }

  const data = await res.json();
  const rawText =
    data.content?.[0]?.type === "text" ? data.content[0].text : "";

  // Check for handoff
  const handoff = detectHandoff(rawText);
  const cleanText = stripHandoffTag(rawText);

  return {
    agent,
    text: cleanText,
    confidence: 1.0,
    handoff: handoff ?? undefined,
  };
}
