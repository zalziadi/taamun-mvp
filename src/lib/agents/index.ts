// ─── Agent System — Public API ───

export { routeMessage, detectHandoff, stripHandoffTag } from "./router";
export { generateAgentResponse } from "./claude";
export { getAgentPrompt, AGENT_CONFIGS } from "./prompts";
export { sendTwitterDM, validateTwitterCRC, parseTwitterDMEvent } from "./twitter";
export {
  sendInstagramDM,
  verifyInstagramWebhook,
  parseInstagramMessageEvent,
} from "./instagram";
export type {
  AgentName,
  Platform,
  IncomingMessage,
  AgentResponse,
  ConversationContext,
  AgentConfig,
} from "./types";
