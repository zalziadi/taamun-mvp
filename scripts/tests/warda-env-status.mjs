// Safe env-status report for the Warda standalone server.
//
// Prints only SET / MISSING / PLACEHOLDER per key — NEVER the value itself.
// Non-secret config values (dry-run, recipient mode, allowlist size) are
// shown because they are operational flags, not secrets.
//
// Run:
//   node --env-file=warda-whatsapp/.env scripts/tests/warda-env-status.mjs

const env = process.env;
const PLACEHOLDER = /(__.*__|^\.\.\.$|FILL)/i;

function status(name) {
  const v = (env[name] || '').trim();
  if (!v) return 'MISSING';
  if (PLACEHOLDER.test(v)) return 'PLACEHOLDER';
  return 'SET';
}

const secrets = [
  'ANTHROPIC_API_KEY',
  'WHATSAPP_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_VERIFY_TOKEN',
];

console.log('— secret/credential presence (value never printed) —');
for (const k of secrets) console.log(`  ${k}=${status(k)}`);

console.log('\n— guardrail config (non-secret flags) —');
console.log(`  WARDA_DRY_RUN=${env.WARDA_DRY_RUN ?? '(unset)'}`);
console.log(`  WARDA_RECIPIENT_MODE=${env.WARDA_RECIPIENT_MODE ?? '(unset)'}`);
const allow = (env.WARDA_ALLOWLIST || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
console.log(`  WARDA_ALLOWLIST entries=${allow.length}`);
console.log(`  WHATSAPP_BUSINESS_NUMBER=${status('WHATSAPP_BUSINESS_NUMBER')}`);
console.log(`  WARDA_OPERATOR_NUMBER=${status('WARDA_OPERATOR_NUMBER')}`);

// Server readiness: all four required keys must be SET (not placeholder).
const required = ['ANTHROPIC_API_KEY', 'WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_VERIFY_TOKEN'];
const notReady = required.filter((k) => status(k) !== 'SET');
const dryRunOn = ['1', 'true', 'yes'].includes((env.WARDA_DRY_RUN || '').toLowerCase());

console.log('\n— readiness —');
console.log(`  dry-run active: ${dryRunOn ? 'YES' : 'NO'}`);
console.log(`  recipient mode is allowlist: ${(env.WARDA_RECIPIENT_MODE || '').toLowerCase() === 'allowlist' ? 'YES' : 'NO'}`);
console.log(`  allowlist has exactly 1 entry: ${allow.length === 1 ? 'YES' : 'NO'}`);
if (notReady.length) {
  console.log(`  server can start: NO — waiting on: ${notReady.join(', ')}`);
} else {
  console.log('  server can start: YES (all required keys SET)');
}
