// Live-config safety check for the Warda standalone server.
//
// Loads warda-whatsapp/.env and verifies the recipient/dry-run gates behave
// correctly against the ACTUAL configured values — WITHOUT importing the
// server or sending anything. Only the pure guardrail functions are called.
//
// Run:
//   node --env-file=warda-whatsapp/.env scripts/tests/warda-live-config.check.mjs

import assert from 'node:assert/strict';
import {
  checkRecipient,
  checkOutbound,
  isDryRun,
} from '../../warda-whatsapp/guardrails.js';

const env = process.env;
let passed = 0;
let failed = 0;
function t(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed += 1;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed += 1;
  }
}

// ── Sanity: required guardrail values present and not placeholders ──
const PLACEHOLDER = /__.*__/;
const allowRaw = env.WARDA_ALLOWLIST || '';
const allowList = allowRaw.split(',').map((s) => s.trim()).filter(Boolean);
const business = env.WHATSAPP_BUSINESS_NUMBER || '';
const operator = env.WARDA_OPERATOR_NUMBER || '';

console.log('config presence');
t('WARDA_DRY_RUN is on', () => assert.equal(isDryRun(env), true));
t('WARDA_RECIPIENT_MODE is allowlist', () =>
  assert.equal((env.WARDA_RECIPIENT_MODE || '').toLowerCase(), 'allowlist'));
t('WARDA_ALLOWLIST has exactly one number', () =>
  assert.equal(allowList.length, 1, `found ${allowList.length}`));
t('WARDA_ALLOWLIST is not a placeholder', () =>
  assert.doesNotMatch(allowRaw, PLACEHOLDER));
t('WHATSAPP_BUSINESS_NUMBER set (no placeholder)', () => {
  assert.ok(business, 'empty');
  assert.doesNotMatch(business, PLACEHOLDER);
});
t('WARDA_OPERATOR_NUMBER set (no placeholder)', () => {
  assert.ok(operator, 'empty');
  assert.doesNotMatch(operator, PLACEHOLDER);
});

console.log('\nrecipient gate (against real .env values)');
const testNum = allowList[0];
const otherNum = '+966500000001'; // arbitrary number NOT on the allowlist

t('the allowlisted number is allowed', () => {
  const r = checkRecipient(testNum, env);
  assert.equal(r.allowed, true, r.reason);
});
t('a different number is blocked (not_on_allowlist)', () => {
  const r = checkRecipient(otherNum, env);
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'not_on_allowlist');
});
t('WHATSAPP_BUSINESS_NUMBER is blocked (self_send_blocked)', () => {
  const r = checkRecipient(business, env);
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'self_send_blocked');
});
t('WARDA_OPERATOR_NUMBER is blocked', () => {
  const r = checkRecipient(operator, env);
  assert.equal(r.allowed, false);
  // self_send wins if operator == business; otherwise operator_send_blocked
  assert.ok(['operator_send_blocked', 'self_send_blocked'].includes(r.reason), r.reason);
});

console.log('\ndry-run send path (no network)');
t('dry-run means no real send is attempted', () => {
  // Mirror the server logic: a reply only "sends" when !isDryRun().
  const wouldSend = !isDryRun(env);
  assert.equal(wouldSend, false, 'isDryRun must short-circuit the real send');
});
t('a normal reply passes the outbound gate cleanly', () => {
  const r = checkOutbound('أهلاً 🌸 كيف أقدر أساعدك؟', 'warda');
  assert.equal(r.blocked, false);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
