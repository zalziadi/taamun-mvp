// ─── Outbound + recipient guardrails for the standalone Warda bot ───
// Mirrors src/lib/agents/guardrails.ts. Pure JS so server.js can `import` it.
//
// The standalone server has the same leak surface as the Next.js webhook:
// without these checks, an advisor-style reply ("توصيتي…") can be sent to a
// customer, and the bot will reply to any number that messages it.

// NOTE: Arabic letters are not part of \w, so \b doesn't work for Arabic
// words. We match the bare token instead — false-positive risk is acceptable
// because every phrase below is advisor-only vocabulary that Warda has no
// reason to use.
const INTERNAL_PHRASES = [
  /توصيتي/g,
  /تحليلي/g,
  /الخيارات\s+المتاحة/g,
  /المشكلة\s+الحقيقية/g,
  /الخطوة\s+التالية/g,
  /\[HANDOFF:[a-z]+\]/gi,
  /\[ROUTE:[a-z]+\]/gi,
  /\bSYSTEM\s*:/gi,
  /\bSOUL\.md\b/gi,
  /\b(assistant|system|user)\s*:\s*/gi,
];

const HARD_BLOCK_TOKENS = [
  /ANTHROPIC_API_KEY/i,
  /WHATSAPP_TOKEN/i,
  /SERVICE_ROLE/i,
  /sk-ant-/i,
  /Bearer\s+[A-Za-z0-9_\-]{20,}/,
];

export function checkOutbound(text, agent = 'warda') {
  if (!text || typeof text !== 'string') {
    return { safeText: '', blocked: true, reason: 'empty_response', scrubbed: false };
  }

  for (const re of HARD_BLOCK_TOKENS) {
    if (re.test(text)) {
      return { safeText: '', blocked: true, reason: `secret_leak`, scrubbed: false };
    }
  }

  // Detect advisor-format BEFORE scrubbing — scrubbing can erase the very
  // tokens that prove the reply was advisor-style.
  const isAdvisorFormat = /^\s*1[.)\-]\s+.+\r?\n\s*2[.)\-]/m.test(text);

  let scrubbed = text;
  let didScrub = false;
  for (const re of INTERNAL_PHRASES) {
    const next = scrubbed.replace(re, '');
    if (next !== scrubbed) {
      didScrub = true;
      scrubbed = next;
    }
  }
  scrubbed = scrubbed.replace(/\s{2,}/g, ' ').trim();

  if (agent === 'warda' && isAdvisorFormat) {
    return { safeText: '', blocked: true, reason: 'advisor_format_in_warda_reply', scrubbed: didScrub };
  }

  if (scrubbed.length < 2) {
    return { safeText: '', blocked: true, reason: 'empty_after_scrub', scrubbed: didScrub };
  }

  return { safeText: scrubbed, blocked: false, scrubbed: didScrub };
}

function normalise(num) {
  return (num || '').replace(/[^\d+]/g, '');
}

function parseList(raw) {
  if (!raw) return [];
  return raw.split(',').map((s) => normalise(s)).filter(Boolean);
}

export function checkRecipient(to, env = process.env) {
  const target = normalise(to);
  if (!target) return { allowed: false, reason: 'empty_recipient' };

  const businessNumber = normalise(env.WHATSAPP_BUSINESS_NUMBER || '');
  if (businessNumber && target === businessNumber) {
    return { allowed: false, reason: 'self_send_blocked' };
  }
  const operatorNumber = normalise(env.WARDA_OPERATOR_NUMBER || '');
  if (operatorNumber && target === operatorNumber) {
    return { allowed: false, reason: 'operator_send_blocked' };
  }

  const mode = (env.WARDA_RECIPIENT_MODE || 'allowlist').toLowerCase();

  if (mode === 'open') return { allowed: true };

  if (mode === 'denylist') {
    const denied = parseList(env.WARDA_DENYLIST);
    return denied.includes(target)
      ? { allowed: false, reason: 'denylist_hit' }
      : { allowed: true };
  }

  const allowed = parseList(env.WARDA_ALLOWLIST);
  if (allowed.length === 0) return { allowed: false, reason: 'allowlist_empty' };
  if (!allowed.includes(target)) return { allowed: false, reason: 'not_on_allowlist' };
  return { allowed: true };
}

export function isDryRun(env = process.env) {
  const v = (env.WARDA_DRY_RUN || '').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}
