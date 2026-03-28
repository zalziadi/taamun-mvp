// ─── Smart Router: classifies messages → correct agent ───

import type { AgentName, IncomingMessage, ConversationContext } from "./types";
import { AGENT_CONFIGS } from "./prompts";

/**
 * Determines which agent should handle this message.
 * Priority:
 * 1. If conversation already has an agent and no explicit topic change → keep same agent
 * 2. Keyword matching with scoring
 * 3. Default → musakhar (general questions)
 */
export function routeMessage(
  message: IncomingMessage,
  context?: ConversationContext
): AgentName {
  const text = message.text.toLowerCase();

  // Score each agent
  const scores: Record<AgentName, number> = {
    musakhar: 0,
    warda: 0,
    samra: 0,
  };

  for (const [agentName, config] of Object.entries(AGENT_CONFIGS)) {
    for (const keyword of config.routingKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        scores[agentName as AgentName] += 1;
      }
    }
  }

  // Find highest scoring agent
  const maxScore = Math.max(...Object.values(scores));

  // If no keywords matched and we have context → keep current agent
  if (maxScore === 0 && context?.currentAgent) {
    return context.currentAgent;
  }

  // If no keywords matched at all → default to musakhar
  if (maxScore === 0) {
    return "musakhar";
  }

  // Return highest scoring agent
  const winner = (Object.entries(scores) as [AgentName, number][]).find(
    ([, score]) => score === maxScore
  );

  return winner ? winner[0] : "musakhar";
}

/**
 * Detects handoff tags in agent responses.
 * Pattern: [HANDOFF:agentName]
 */
export function detectHandoff(response: string): AgentName | null {
  const match = response.match(/\[HANDOFF:(warda|musakhar|samra)\]/);
  return match ? (match[1] as AgentName) : null;
}

/**
 * Strips handoff tags from the response text.
 */
export function stripHandoffTag(response: string): string {
  return response.replace(/\s*\[HANDOFF:(warda|musakhar|samra)\]/g, "").trim();
}
