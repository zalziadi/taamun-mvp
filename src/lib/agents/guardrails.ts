// ─── Outbound + recipient guardrails for the Warda customer-service pipeline ───
//
// Why this file exists:
// At the end of the pipeline Warda once leaked internal "strategic advisor"
// (mustashar) language to customers ("توصيتي", "تحليلي", "الخيارات المتاحة",
// raw "[HANDOFF:samra]" tags, SOUL/role markers). Two failures combined:
//   1. The OpenClaw binding routed Ziyad's public WhatsApp number to
//      `mustashar`, but customers also message that number — so customer
//      threads were getting advisor replies.
//   2. Nothing scrubbed internal-only phrases out of outgoing messages, and
//      nothing checked who the bot was about to message.
// This module is the last line of defence before any text leaves the system.

import type { AgentName } from "./types";

/** Phrases that must never appear in a customer-facing message. */
// NOTE: Arabic letters are not part of \w, so \b doesn't apply to Arabic
// words. We match the bare token instead — false-positive risk is acceptable
// because every phrase below is advisor-only vocabulary that Warda has no
// reason to use.
const INTERNAL_PHRASES: RegExp[] = [
  // Strategic-advisor (mustashar) vocabulary
  /توصيتي/g,
  /تحليلي/g,
  /الخيارات\s+المتاحة/g,
  /المشكلة\s+الحقيقية/g,
  /الخطوة\s+التالية/g,
  // Raw routing / handoff tags
  /\[HANDOFF:[a-z]+\]/gi,
  /\[ROUTE:[a-z]+\]/gi,
  // System / role markers
  /\bSYSTEM\s*:/gi,
  /\bSOUL\.md\b/gi,
  /\b(assistant|system|user)\s*:\s*/gi,
];

/** Block (don't even try to scrub) if any of these tokens appear. */
const HARD_BLOCK_TOKENS: RegExp[] = [
  /ANTHROPIC_API_KEY/i,
  /WHATSAPP_TOKEN/i,
  /SERVICE_ROLE/i,
  /sk-ant-/i,
  /Bearer\s+[A-Za-z0-9_\-]{20,}/,
];

export interface OutboundCheckResult {
  /** Safe text to send. Equal to input if nothing tripped. */
  safeText: string;
  /** True if the message must NOT be sent. */
  blocked: boolean;
  /** Human-readable reason (for logs / Telegram alerts). */
  reason?: string;
  /** True if scrubbing happened but the message can still be sent. */
  scrubbed: boolean;
}

/**
 * Sanitize an outbound agent reply before it goes to a customer channel.
 *
 * - Hard-blocks if a secret or credential pattern leaks.
 * - Scrubs known internal phrases and routing tags.
 * - Returns `blocked: true` if, after scrubbing, the remainder is empty or
 *   clearly meta ("…").
 */
export function checkOutbound(text: string, agent: AgentName): OutboundCheckResult {
  if (!text || typeof text !== "string") {
    return { safeText: "", blocked: true, reason: "empty_response", scrubbed: false };
  }

  for (const re of HARD_BLOCK_TOKENS) {
    if (re.test(text)) {
      return {
        safeText: "",
        blocked: true,
        reason: `secret_leak:${re.source}`,
        scrubbed: false,
      };
    }
  }

  // Detect advisor-format BEFORE scrubbing — scrubbing erases the very
  // tokens that prove the reply was advisor-style ("المشكلة الحقيقية",
  // "الخيارات المتاحة", "توصيتي").
  const isAdvisorFormat = /^\s*1[.)\-]\s+.+\r?\n\s*2[.)\-]/m.test(text);

  let scrubbed = text;
  let didScrub = false;
  for (const re of INTERNAL_PHRASES) {
    const next = scrubbed.replace(re, "");
    if (next !== scrubbed) {
      didScrub = true;
      scrubbed = next;
    }
  }

  scrubbed = scrubbed.replace(/\s{2,}/g, " ").trim();

  // Warda specifically is forbidden from speaking like the strategic advisor.
  if (agent === "warda" && isAdvisorFormat) {
    return {
      safeText: "",
      blocked: true,
      reason: "advisor_format_in_warda_reply",
      scrubbed: didScrub,
    };
  }

  if (scrubbed.length < 2) {
    return {
      safeText: "",
      blocked: true,
      reason: "empty_after_scrub",
      scrubbed: didScrub,
    };
  }

  return { safeText: scrubbed, blocked: false, scrubbed: didScrub };
}

/**
 * Decide whether the bot is allowed to message this recipient.
 *
 * Modes (via env `WARDA_RECIPIENT_MODE`):
 *   - "allowlist" (default in production): only numbers in WARDA_ALLOWLIST
 *     (comma-separated E.164) get replies.
 *   - "denylist": reply to everyone EXCEPT numbers in WARDA_DENYLIST.
 *   - "open": reply to everyone (legacy behaviour — not recommended).
 *
 * In every mode, the bot's own number (`WHATSAPP_BUSINESS_NUMBER`) is
 * always blocked so the bot can never reply to itself / to its operator's
 * personal line.
 */
export interface RecipientCheckResult {
  allowed: boolean;
  reason?: string;
}

function normalise(num: string): string {
  return (num || "").replace(/[^\d+]/g, "");
}

function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => normalise(s))
    .filter(Boolean);
}

export function checkRecipient(to: string, env: NodeJS.ProcessEnv = process.env): RecipientCheckResult {
  const target = normalise(to);
  if (!target) return { allowed: false, reason: "empty_recipient" };

  const businessNumber = normalise(env.WHATSAPP_BUSINESS_NUMBER || "");
  if (businessNumber && target === businessNumber) {
    return { allowed: false, reason: "self_send_blocked" };
  }

  const operatorNumber = normalise(env.WARDA_OPERATOR_NUMBER || "");
  if (operatorNumber && target === operatorNumber) {
    return { allowed: false, reason: "operator_send_blocked" };
  }

  const mode = (env.WARDA_RECIPIENT_MODE || "allowlist").toLowerCase();

  if (mode === "open") {
    return { allowed: true };
  }

  if (mode === "denylist") {
    const denied = parseList(env.WARDA_DENYLIST);
    if (denied.includes(target)) {
      return { allowed: false, reason: "denylist_hit" };
    }
    return { allowed: true };
  }

  // default: allowlist
  const allowed = parseList(env.WARDA_ALLOWLIST);
  if (allowed.length === 0) {
    return { allowed: false, reason: "allowlist_empty" };
  }
  if (!allowed.includes(target)) {
    return { allowed: false, reason: "not_on_allowlist" };
  }
  return { allowed: true };
}

/** True when the pipeline is in dry-run mode (no real sends). */
export function isDryRun(env: NodeJS.ProcessEnv = process.env): boolean {
  const v = (env.WARDA_DRY_RUN || "").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
