// ─── Agent System Types ───

export type AgentName = "warda" | "musakhar" | "samra";

export type Platform = "twitter" | "instagram";

export interface IncomingMessage {
  platform: Platform;
  senderId: string;
  senderName?: string;
  text: string;
  messageId: string;
  timestamp: number;
}

export interface AgentResponse {
  agent: AgentName;
  text: string;
  confidence: number;
  handoff?: AgentName; // if the agent wants to transfer
}

export interface ConversationContext {
  senderId: string;
  platform: Platform;
  history: Array<{ role: "user" | "agent"; text: string; agent?: AgentName }>;
  currentAgent?: AgentName;
}

export interface AgentConfig {
  name: AgentName;
  nameAr: string;
  systemPrompt: string;
  routingKeywords: string[];
}
