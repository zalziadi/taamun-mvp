// Smoke tests for the Warda guardrails.
//
// Run:
//   node scripts/tests/warda-guardrails.test.mjs
//
// Tests both the standalone JS guardrails (warda-whatsapp/guardrails.js) and
// the shared TS guardrails compiled by tsc on import? No — to keep this test
// dependency-free we test the JS copy directly, and rely on `tsc --noEmit`
// to catch drift between the two.

import assert from 'node:assert/strict';
import {
  checkOutbound,
  checkRecipient,
  isDryRun,
} from '../../warda-whatsapp/guardrails.js';

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

console.log('checkOutbound');

t('passes a normal Warda reply through unchanged', () => {
  const r = checkOutbound('أهلاً فيك 🌸 وش اللي يهمك أكثر — تمعّن ولّا مسخر؟', 'warda');
  assert.equal(r.blocked, false);
  assert.equal(r.scrubbed, false);
  assert.match(r.safeText, /أهلاً فيك/);
});

t('scrubs advisor phrase "توصيتي" but still sends', () => {
  const r = checkOutbound('توصيتي لك تبدأ بباقة 280 ريال 🌸', 'warda');
  assert.equal(r.blocked, false);
  assert.equal(r.scrubbed, true);
  assert.doesNotMatch(r.safeText, /توصيتي/);
});

t('scrubs raw [HANDOFF:samra] tag', () => {
  const r = checkOutbound('بأحوّلك لسمرا في الدعم الفني [HANDOFF:samra]', 'warda');
  assert.equal(r.blocked, false);
  assert.equal(r.scrubbed, true);
  assert.doesNotMatch(r.safeText, /HANDOFF/);
});

t('blocks an advisor-format numbered analysis from Warda', () => {
  const advisorReply = `1) المشكلة الحقيقية
2) الخيارات المتاحة
3) توصيتي`;
  const r = checkOutbound(advisorReply, 'warda');
  assert.equal(r.blocked, true);
  assert.equal(r.reason, 'advisor_format_in_warda_reply');
});

t('hard-blocks if an API key leaks', () => {
  const r = checkOutbound('عذراً الكود هو sk-ant-12345abc', 'warda');
  assert.equal(r.blocked, true);
  assert.equal(r.reason, 'secret_leak');
});

t('blocks empty / whitespace responses', () => {
  assert.equal(checkOutbound('', 'warda').blocked, true);
  assert.equal(checkOutbound('   ', 'warda').blocked, true);
});

t('blocks when message becomes empty after scrub', () => {
  const r = checkOutbound('توصيتي', 'warda');
  assert.equal(r.blocked, true);
  assert.equal(r.reason, 'empty_after_scrub');
});

console.log('\ncheckRecipient');

t('default mode is allowlist — empty allowlist blocks everyone', () => {
  const r = checkRecipient('+966500000000', {});
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'allowlist_empty');
});

t('allowlist mode allows a listed number', () => {
  const r = checkRecipient('+966500000000', {
    WARDA_RECIPIENT_MODE: 'allowlist',
    WARDA_ALLOWLIST: '+966500000000,+966511111111',
  });
  assert.equal(r.allowed, true);
});

t('allowlist matches Meta phone format without plus', () => {
  const r = checkRecipient('966594409396', {
    WARDA_RECIPIENT_MODE: 'allowlist',
    WARDA_ALLOWLIST: '+966594409396',
  });
  assert.equal(r.allowed, true);
});

t('blocks our own business number when Meta omits plus', () => {
  const r = checkRecipient('966553930885', {
    WARDA_RECIPIENT_MODE: 'open',
    WHATSAPP_BUSINESS_NUMBER: '+966553930885',
  });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'self_send_blocked');
});

t('blocks the operator number when Meta omits plus', () => {
  const r = checkRecipient('966594409396', {
    WARDA_RECIPIENT_MODE: 'open',
    WARDA_OPERATOR_NUMBER: '+966594409396',
  });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'operator_send_blocked');
});

t('allowlist matches Meta phone format without plus', () => {
  const r = checkRecipient('966594409396', {
    WARDA_RECIPIENT_MODE: 'allowlist',
    WARDA_ALLOWLIST: '+966594409396',
  });
  assert.equal(r.allowed, true);
});

t('blocks our own business number when Meta omits plus', () => {
  const r = checkRecipient('966553930885', {
    WARDA_RECIPIENT_MODE: 'open',
    WHATSAPP_BUSINESS_NUMBER: '+966553930885',
  });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'self_send_blocked');
});

t('blocks the operator number when Meta omits plus', () => {
  const r = checkRecipient('966594409396', {
    WARDA_RECIPIENT_MODE: 'open',
    WARDA_OPERATOR_NUMBER: '+966594409396',
  });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'operator_send_blocked');
});

t('allowlist mode rejects an unlisted number', () => {
  const r = checkRecipient('+966599999999', {
    WARDA_RECIPIENT_MODE: 'allowlist',
    WARDA_ALLOWLIST: '+966500000000',
  });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'not_on_allowlist');
});

t('refuses to message our own business number even in open mode', () => {
  const r = checkRecipient('+966553930885', {
    WARDA_RECIPIENT_MODE: 'open',
    WHATSAPP_BUSINESS_NUMBER: '+966553930885',
  });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'self_send_blocked');
});

t('refuses to message the operator number', () => {
  const r = checkRecipient('+966553930885', {
    WARDA_RECIPIENT_MODE: 'open',
    WARDA_OPERATOR_NUMBER: '+966553930885',
  });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'operator_send_blocked');
});

t('denylist mode blocks specific numbers', () => {
  const r = checkRecipient('+966500000000', {
    WARDA_RECIPIENT_MODE: 'denylist',
    WARDA_DENYLIST: '+966500000000',
  });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'denylist_hit');
});

t('open mode allows everyone except self/operator', () => {
  const r = checkRecipient('+966588888888', { WARDA_RECIPIENT_MODE: 'open' });
  assert.equal(r.allowed, true);
});

console.log('\nisDryRun');

t('reads WARDA_DRY_RUN truthy values', () => {
  assert.equal(isDryRun({ WARDA_DRY_RUN: '1' }), true);
  assert.equal(isDryRun({ WARDA_DRY_RUN: 'true' }), true);
  assert.equal(isDryRun({ WARDA_DRY_RUN: 'yes' }), true);
  assert.equal(isDryRun({}), false);
  assert.equal(isDryRun({ WARDA_DRY_RUN: 'false' }), false);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
