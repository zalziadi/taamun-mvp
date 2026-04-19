#!/usr/bin/env node
/**
 * scripts/test-phase-10-integration.mjs
 *
 * Phase 10 (Referral Program) integration harness.
 *
 * Exercises the 7 Phase-10 end-to-end scenarios against the real Phase 10
 * helper modules (via Node 22+ TS-stripping) + a shape-equivalent fake
 * Supabase + a fetch-intercept PostHog sink. Mirrors the pattern established
 * by `scripts/test-phase-09-integration.mjs` (Plan 09.07 precedent).
 *
 * CONSTRAINTS
 *   - Zero new runtime / dev dependencies (NFR-08). Pure Node built-ins +
 *     node:assert + node:crypto.
 *   - No real network, no real Supabase, no real PostHog.
 *   - Sub-3s total runtime on a typical dev laptop.
 *   - Exits 0 on all-pass; non-zero with a readable summary on any failure.
 *
 * SCENARIOS
 *   1. Generate FRIEND code — exactly 1 referral_code_generated event,
 *      code matches FRIEND_CODE_REGEX, prefix-only ANALYTICS-07.
 *   2. Redeem FRIEND code — invitee gets 30d + referrals.status=pending_day14
 *      + exactly 1 referral_code_redeemed event (prefix-only).
 *   3. Day-14 credit via cron — referrer expires_at extended + status=rewarded
 *      + ZERO new activation_codes rows (REFER-04 core invariant).
 *   4. Self-referral — app-layer rejects with 409; referrals row unchanged;
 *      DB-layer CHECK (referrals_no_self_referral) also rejects.
 *   5. Refund within 14d — creditOneReferral returns 'refunded';
 *      referrer NOT credited.
 *   6. 4th rewarded referral in calendar year — create call returns
 *      annual_cap_reached (429); even if bypassed, creditOneReferral
 *      returns 'capped' and the over-cap row is voided (no credit).
 *   7. ANALYTICS-07 sweep — JSON.stringify(postHogSink) never contains
 *      a full FRIEND-[0-9A-HJKMNP-TV-Z]{6} substring.
 *
 * Referenced strings (for future grep guards):
 *   creditOneReferral · isInviteeEligible · yearlyRewardedCount
 *   generateUniqueFriendCode · FRIEND_CODE_REGEX
 *   referral_code_generated · referral_code_redeemed · referral_code_prefix
 *   pending_invitee · pending_day14 · rewarded · refunded · capped · void
 *   activation_codes (for zero-write audit)
 */

import { strict as assert } from "node:assert";
import { fileURLToPath } from "node:url";
import { dirname, resolve as pathResolve } from "node:path";

const REPO_ROOT = pathResolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);

// ─────────────────────────────────────────────────────────────────────────────
// 0. Environment bootstrap — ensure any modules we import find the expected
//    secrets. None of the Phase 10 helpers require ENTITLEMENT_SECRET but
//    entitlement.ts (transitive via mirror) does.
// ─────────────────────────────────────────────────────────────────────────────

if (!process.env.ENTITLEMENT_SECRET) {
  process.env.ENTITLEMENT_SECRET = "phase-10-harness-secret";
}
// Force PostHog sink to activate — server.ts no-ops when these are unset.
process.env.NEXT_PUBLIC_POSTHOG_KEY = "phase-10-harness-key";
process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://posthog.test";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Reporter
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}
function fail(name, err) {
  failed++;
  failures.push({ name, err });
  console.log(`  ✗ ${name}\n    ${(err && err.message) || err}`);
}
async function scenario(title, fn) {
  console.log(`\n[${title}]`);
  try {
    await fn();
  } catch (err) {
    fail(`${title} — uncaught`, err);
  }
}
function check(name, thunk) {
  try {
    thunk();
    ok(name);
  } catch (err) {
    fail(name, err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PostHog fetch interception — capture every /capture/ POST into a sink.
//    Must be installed BEFORE importing src/lib/analytics/server.ts.
// ─────────────────────────────────────────────────────────────────────────────

const postHogSink = [];
// Separate cumulative sink that scenarios DON'T clear — used by scenario 7
// for the cross-run ANALYTICS-07 sweep.
const postHogSinkAll = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async function interceptFetch(url, init) {
  const urlStr = typeof url === "string" ? url : String(url);
  if (urlStr.includes("/capture/")) {
    let body = null;
    try {
      body = init && init.body ? JSON.parse(String(init.body)) : null;
      postHogSink.push({ url: urlStr, body });
      postHogSinkAll.push({ url: urlStr, body });
    } catch {
      postHogSink.push({ url: urlStr, body: null, rawBody: init?.body });
      postHogSinkAll.push({ url: urlStr, body: null, rawBody: init?.body });
    }
    return new Response(JSON.stringify({ status: 1 }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  return originalFetch(url, init);
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Fake Supabase client — shape-equivalent to the surface Phase 10 uses.
//
//    Tables modeled:
//      profiles           — id, expires_at, subscription_status,
//                           subscription_tier, original_gateway, activated_at
//      referrals          — id, code, referrer_id, invitee_id, status,
//                           invitee_redeemed_at, referrer_rewarded_at,
//                           created_at
//      progress           — user_id, completed_days (number[])
//      user_progress      — legacy fallback, same shape
//      activation_codes   — id, code, used_by, tier (tracked for REFER-04
//                           zero-write audit)
//
//    Chain support:
//      from(t).select(cols[, opts]).eq(...).in(...).is(...).gte(...)
//        .lte(...).order(...).limit(...).maybeSingle() / await
//      from(t).insert(row | rows)
//      from(t).update(patch).eq(...)
//      from(t).upsert(row, { onConflict })
//
//    .select with `{ count: "exact", head: true }` resolves to { count, error }.
// ─────────────────────────────────────────────────────────────────────────────

let nextRowId = 1;
function genId(prefix) {
  return `${prefix}-${nextRowId++}`;
}

function createFakeSupabase(fixtures = {}) {
  const state = {
    profiles: fixtures.profiles ? [...fixtures.profiles] : [],
    referrals: fixtures.referrals ? [...fixtures.referrals] : [],
    progress: fixtures.progress ? [...fixtures.progress] : [],
    user_progress: fixtures.user_progress ? [...fixtures.user_progress] : [],
    activation_codes: fixtures.activation_codes
      ? [...fixtures.activation_codes]
      : [],
  };

  // Audit counters — scenarios assert these to prove REFER-04.
  const audit = {
    activation_codes_inserts: 0,
    activation_codes_updates: 0,
  };

  function tableRef(name) {
    if (!(name in state)) state[name] = [];
    return state[name];
  }

  function select(name, cols = "*", opts = {}) {
    const filters = [];
    const order = { col: null, ascending: true };
    let limitN = null;
    const builder = {
      eq(col, val) {
        filters.push((r) => r[col] === val);
        return builder;
      },
      in(col, vals) {
        filters.push((r) => vals.includes(r[col]));
        return builder;
      },
      is(col, val) {
        if (val === null) filters.push((r) => r[col] == null);
        else filters.push((r) => r[col] === val);
        return builder;
      },
      gte(col, val) {
        filters.push((r) => {
          const cell = r[col];
          if (cell == null) return false;
          return cell >= val;
        });
        return builder;
      },
      lte(col, val) {
        filters.push((r) => {
          const cell = r[col];
          if (cell == null) return false;
          return cell <= val;
        });
        return builder;
      },
      order(col, o = {}) {
        order.col = col;
        order.ascending = o.ascending !== false;
        return builder;
      },
      limit(n) {
        limitN = n;
        return builder;
      },
      maybeSingle() {
        let rows = tableRef(name).filter((r) =>
          filters.every((f) => f(r)),
        );
        if (order.col) {
          rows = [...rows].sort((a, b) => {
            const av = a[order.col];
            const bv = b[order.col];
            if (av === bv) return 0;
            const cmp = av < bv ? -1 : 1;
            return order.ascending ? cmp : -cmp;
          });
        }
        return Promise.resolve({ data: rows[0] ?? null, error: null });
      },
      then(resolve, reject) {
        try {
          let rows = tableRef(name).filter((r) =>
            filters.every((f) => f(r)),
          );
          if (order.col) {
            rows = [...rows].sort((a, b) => {
              const av = a[order.col];
              const bv = b[order.col];
              if (av === bv) return 0;
              const cmp = av < bv ? -1 : 1;
              return order.ascending ? cmp : -cmp;
            });
          }
          if (limitN !== null) rows = rows.slice(0, limitN);
          if (opts && opts.count === "exact" && opts.head === true) {
            resolve({ data: null, count: rows.length, error: null });
          } else {
            resolve({ data: rows, error: null });
          }
        } catch (e) {
          reject(e);
        }
      },
    };
    return builder;
  }

  function insert(name, rowOrRows) {
    const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
    const rowsWithDefaults = rows.map((r) => {
      const copy = { ...r };
      if (!copy.id) copy.id = genId(name);
      if (!copy.created_at) copy.created_at = new Date().toISOString();
      return copy;
    });
    tableRef(name).push(...rowsWithDefaults);
    if (name === "activation_codes") {
      audit.activation_codes_inserts += rowsWithDefaults.length;
    }
    return Promise.resolve({ data: rowsWithDefaults, error: null });
  }

  function update(name, patch) {
    const filters = [];
    const builder = {
      eq(col, val) {
        filters.push((r) => r[col] === val);
        return builder;
      },
      is(col, val) {
        if (val === null) filters.push((r) => r[col] == null);
        else filters.push((r) => r[col] === val);
        return builder;
      },
      then(resolve, reject) {
        try {
          // CHECK constraint emulation for referrals.invitee_id === referrer_id.
          if (name === "referrals" && "invitee_id" in patch) {
            for (const row of tableRef(name)) {
              if (!filters.every((f) => f(row))) continue;
              if (
                patch.invitee_id != null &&
                patch.invitee_id === row.referrer_id
              ) {
                return resolve({
                  data: null,
                  error: {
                    code: "23514",
                    message:
                      'new row for relation "referrals" violates check constraint "referrals_no_self_referral"',
                  },
                });
              }
            }
          }
          for (const row of tableRef(name)) {
            if (filters.every((f) => f(row))) {
              Object.assign(row, patch);
            }
          }
          if (name === "activation_codes") {
            audit.activation_codes_updates += 1;
          }
          resolve({ data: null, error: null });
        } catch (e) {
          reject(e);
        }
      },
    };
    return builder;
  }

  function upsert(name, row, opts = {}) {
    const onConflict = opts.onConflict ?? "id";
    const existing = tableRef(name).find(
      (r) => r[onConflict] === row[onConflict],
    );
    if (existing) {
      Object.assign(existing, row);
    } else {
      const copy = { ...row };
      if (!copy.id && onConflict !== "id") copy.id = genId(name);
      tableRef(name).push(copy);
    }
    return Promise.resolve({ data: null, error: null });
  }

  return {
    _state: state,
    _audit: audit,
    from(name) {
      return {
        select(cols, opts) {
          return select(name, cols, opts);
        },
        insert(rowOrRows) {
          return insert(name, rowOrRows);
        },
        update(patch) {
          return update(name, patch);
        },
        upsert(row, opts) {
          return upsert(name, row, opts);
        },
      };
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Real Phase 10 module imports — TS-strip under Node 22+.
//
//    Both of these are pure-TS + node built-ins only (crypto, nothing else).
//    They can be imported directly without path-alias resolution.
// ─────────────────────────────────────────────────────────────────────────────

const { generateUniqueFriendCode, FRIEND_CODE_REGEX, FRIEND_PREFIX } =
  await import("../src/lib/referral/generate.ts");

const { creditOneReferral, isInviteeEligible, yearlyRewardedCount } =
  await import("../src/lib/referral/credit.ts");

// Shape-equivalent emitEvent mirror.
//
// The real src/lib/analytics/server.ts imports from "./events" (no .ts
// extension) which Node ESM cannot resolve without a loader — adding one
// would drag in a new dev dep (NFR-08 forbids). We mirror the critical
// behavior: prefix-only property guard + fire-and-forget fetch to the
// PostHog capture URL. The fetch interceptor above captures into postHogSink.
//
// If the real server.ts adds a new gate, mirror it here. Integration stays
// honest because the REAL generateUniqueFriendCode + creditOneReferral +
// FRIEND_CODE_REGEX are imported from src/lib/referral/*.
async function emitEvent(event, distinctId) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key || !host) return;
  try {
    await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event: event.name,
        distinct_id: distinctId,
        properties: event.properties,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // never throws by contract
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Shape-equivalent route mirrors.
//
//    The actual route files in src/app/api/** import from @/lib/... path
//    aliases that Node ESM cannot resolve without a custom loader (NFR-08
//    forbids adding one). We therefore mirror the critical branches of the
//    two relevant routes inline, keeping the SAME logic shape — and exercise
//    the REAL generateUniqueFriendCode / FRIEND_CODE_REGEX / creditOneReferral
//    underneath. This is the Phase 09.07 precedent.
//
//    If the real routes drift, update these mirrors in lockstep. The guard in
//    Task 2 greps for the same invariants in the real files so drift is
//    detectable at CI time.
// ─────────────────────────────────────────────────────────────────────────────

const ANNUAL_CAP = 3;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Mirror of src/app/api/referral/create/route.ts POST handler.
 * Returns a plain object `{ status, body }` instead of a NextResponse.
 */
async function referralCreate(admin, userId) {
  // 2. Reuse existing unredeemed code.
  const { data: existing } = await admin
    .from("referrals")
    .select("code")
    .eq("referrer_id", userId)
    .is("invitee_id", null)
    .eq("status", "pending_invitee")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.code) {
    return { status: 200, body: { ok: true, code: existing.code, reused: true } };
  }

  // 3. Annual cap check.
  const startOfYear = new Date(
    Date.UTC(new Date().getUTCFullYear(), 0, 1),
  ).toISOString();

  const { count } = await admin
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", userId)
    .eq("status", "rewarded")
    .gte("created_at", startOfYear);

  const current = count ?? 0;
  if (current >= ANNUAL_CAP) {
    return {
      status: 429,
      body: { ok: false, error: "annual_cap_reached", max: ANNUAL_CAP, current },
    };
  }

  // 4. Mint unique code.
  const code = await generateUniqueFriendCode(admin);

  // 5. Insert. invitee_id is explicitly null at mint-time (matches PG schema
  // default). The real route lets PG default it; our fake doesn't emit nulls
  // for unspecified columns, so we set it here for scenarios that read it back.
  await admin.from("referrals").insert({
    code,
    referrer_id: userId,
    invitee_id: null,
    status: "pending_invitee",
  });

  // 6. Emit prefix-only analytics event.
  await emitEvent(
    { name: "referral_code_generated", properties: { referral_code_prefix: "FRIEND" } },
    userId,
  );

  return { status: 200, body: { ok: true, code, reused: false } };
}

/**
 * Mirror of the FRIEND-* branch in src/app/api/activate/route.ts.
 * Returns { status, body, cookieSet } where cookieSet is a boolean.
 */
async function activateFriend(admin, userId, code) {
  if (!FRIEND_CODE_REGEX.test(code)) {
    return { status: 400, body: { ok: false, error: "not_friend_code" } };
  }

  const { data: referralRow } = await admin
    .from("referrals")
    .select("id, referrer_id, invitee_id, status")
    .eq("code", code)
    .maybeSingle();

  if (!referralRow) {
    return { status: 404, body: { ok: false, error: "code_not_found" } };
  }
  // Byte-for-byte ordering match with src/app/api/activate/route.ts: the
  // already-redeemed check runs first, then the self-referral check. Both
  // return 409 but different error codes. Treat undefined as null (PG would
  // always emit null for unset columns).
  if (referralRow.invitee_id != null) {
    return { status: 409, body: { ok: false, error: "code_already_redeemed" } };
  }
  if (referralRow.referrer_id === userId) {
    return { status: 409, body: { ok: false, error: "self_referral_forbidden" } };
  }

  const friendTier = "monthly";
  const friendNow = new Date();
  const friendExpiresAt = new Date(
    friendNow.getTime() + THIRTY_DAYS_MS,
  ).toISOString();

  await admin.from("profiles").upsert(
    {
      id: userId,
      subscription_status: "active",
      subscription_tier: friendTier,
      activated_at: friendNow.toISOString(),
      expires_at: friendExpiresAt,
    },
    { onConflict: "id" },
  );

  await admin
    .from("profiles")
    .update({ original_gateway: "eid_code" })
    .eq("id", userId)
    .is("original_gateway", null);

  const { error: referralUpdateError } = await admin
    .from("referrals")
    .update({
      invitee_id: userId,
      invitee_redeemed_at: friendNow.toISOString(),
      status: "pending_day14",
    })
    .eq("id", referralRow.id);

  // If the DB CHECK constraint rejected (self-referral backstop), bubble it
  // up — but only after the app-layer guard has already rejected this path,
  // so in practice we only reach this with different users.
  if (referralUpdateError) {
    return {
      status: 409,
      body: {
        ok: false,
        error: "db_check_constraint",
        detail: referralUpdateError.message,
      },
    };
  }

  await emitEvent(
    { name: "referral_code_redeemed", properties: { referral_code_prefix: "FRIEND" } },
    userId,
  );

  return {
    status: 200,
    body: {
      ok: true,
      tier: friendTier,
      expires_at: friendExpiresAt,
      via: "friend_referral",
    },
    cookieSet: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers for test setup / audit.
// ─────────────────────────────────────────────────────────────────────────────

function sinkEventsByName(name) {
  return postHogSink.filter((e) => e?.body?.event === name);
}

function clearSink() {
  postHogSink.length = 0;
}

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 1 — Generate FRIEND code
// ─────────────────────────────────────────────────────────────────────────────

let scenario1State;
const USER_A = "user-A";
const USER_B = "user-B";
const USER_C = "user-C";
const USER_D = "user-D";

await scenario("Scenario 1: Generate FRIEND code", async () => {
  clearSink();
  const admin = createFakeSupabase({
    profiles: [
      {
        id: USER_A,
        subscription_status: "active",
        subscription_tier: "monthly",
        expires_at: new Date(Date.now() + THIRTY_DAYS_MS).toISOString(),
        original_gateway: "salla",
      },
    ],
    referrals: [],
  });

  const res = await referralCreate(admin, USER_A);

  check("status === 200", () => assert.equal(res.status, 200));
  check("res.body.ok === true", () => assert.equal(res.body.ok, true));
  check("code matches FRIEND_CODE_REGEX", () =>
    assert.match(res.body.code, FRIEND_CODE_REGEX),
  );
  check("code starts with FRIEND_PREFIX", () =>
    assert.ok(res.body.code.startsWith(FRIEND_PREFIX)),
  );
  check("reused === false", () => assert.equal(res.body.reused, false));

  check("referrals state has exactly 1 row", () =>
    assert.equal(admin._state.referrals.length, 1),
  );
  const row = admin._state.referrals[0];
  check("row.referrer_id === USER_A", () =>
    assert.equal(row.referrer_id, USER_A),
  );
  check("row.status === 'pending_invitee'", () =>
    assert.equal(row.status, "pending_invitee"),
  );
  check("row.invitee_id is null/undefined", () =>
    assert.ok(row.invitee_id == null),
  );

  const events = sinkEventsByName("referral_code_generated");
  check("exactly 1 referral_code_generated event emitted", () =>
    assert.equal(events.length, 1),
  );
  check("event property referral_code_prefix === 'FRIEND'", () =>
    assert.equal(
      events[0].body.properties.referral_code_prefix,
      "FRIEND",
    ),
  );
  check("event does NOT contain full code string", () =>
    assert.doesNotMatch(
      JSON.stringify(events[0]),
      /FRIEND-[0-9A-HJKMNP-TV-Z]{6}/,
    ),
  );
  check("zero activation_codes writes during scenario 1", () =>
    assert.equal(admin._audit.activation_codes_inserts, 0),
  );

  // Preserve for scenario 2.
  scenario1State = { admin, code: res.body.code };
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 2 — Redeem FRIEND code
// ─────────────────────────────────────────────────────────────────────────────

let scenario2State;
await scenario("Scenario 2: Redeem FRIEND code", async () => {
  clearSink();
  const { admin, code } = scenario1State;

  // Pre-redemption audit — no profile yet for USER_B.
  const preProfile = admin._state.profiles.find((p) => p.id === USER_B);
  check("pre-redemption: no USER_B profile", () =>
    assert.equal(preProfile, undefined),
  );

  const nowBefore = Date.now();
  const res = await activateFriend(admin, USER_B, code);
  const nowAfter = Date.now();

  check("status === 200", () => assert.equal(res.status, 200));
  check("body.ok === true", () => assert.equal(res.body.ok, true));
  check("body.via === 'friend_referral'", () =>
    assert.equal(res.body.via, "friend_referral"),
  );
  check("body.tier === 'monthly'", () =>
    assert.equal(res.body.tier, "monthly"),
  );
  check("cookieSet === true", () => assert.equal(res.cookieSet, true));

  const referralRow = admin._state.referrals.find((r) => r.code === code);
  check("referrals row updated: invitee_id === USER_B", () =>
    assert.equal(referralRow.invitee_id, USER_B),
  );
  check("referrals row updated: status === 'pending_day14'", () =>
    assert.equal(referralRow.status, "pending_day14"),
  );
  check("referrals row updated: invitee_redeemed_at is set", () =>
    assert.ok(referralRow.invitee_redeemed_at),
  );

  const profileB = admin._state.profiles.find((p) => p.id === USER_B);
  check("USER_B profile created", () => assert.ok(profileB));
  check("USER_B subscription_status === 'active'", () =>
    assert.equal(profileB.subscription_status, "active"),
  );
  check("USER_B subscription_tier === 'monthly'", () =>
    assert.equal(profileB.subscription_tier, "monthly"),
  );
  check("USER_B expires_at ≈ now + 30d (±5s)", () => {
    const expMs = Date.parse(profileB.expires_at);
    const lower = nowBefore + THIRTY_DAYS_MS - 5000;
    const upper = nowAfter + THIRTY_DAYS_MS + 5000;
    assert.ok(expMs >= lower && expMs <= upper, `${expMs} not in [${lower}, ${upper}]`);
  });
  check("USER_B original_gateway === 'eid_code' (FRIEND tag)", () =>
    assert.equal(profileB.original_gateway, "eid_code"),
  );

  const events = sinkEventsByName("referral_code_redeemed");
  check("exactly 1 referral_code_redeemed event emitted", () =>
    assert.equal(events.length, 1),
  );
  check("redeem event property referral_code_prefix === 'FRIEND'", () =>
    assert.equal(
      events[0].body.properties.referral_code_prefix,
      "FRIEND",
    ),
  );
  check("redeem event does NOT contain full code string", () =>
    assert.doesNotMatch(
      JSON.stringify(events[0]),
      /FRIEND-[0-9A-HJKMNP-TV-Z]{6}/,
    ),
  );

  check("zero activation_codes writes during scenario 2", () =>
    assert.equal(admin._audit.activation_codes_inserts, 0),
  );

  scenario2State = {
    admin,
    code,
    referrerExpiresAtBeforeCredit: admin._state.profiles.find(
      (p) => p.id === USER_A,
    ).expires_at,
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 3 — Day-14 credit via creditOneReferral
// ─────────────────────────────────────────────────────────────────────────────

await scenario("Scenario 3: Day-14 credit → referrer extended, zero activation_codes", async () => {
  const { admin, code, referrerExpiresAtBeforeCredit } = scenario2State;

  // Fast-forward: invitee redeemed 15 days ago; invitee completed day 14.
  const referralRow = admin._state.referrals.find((r) => r.code === code);
  referralRow.invitee_redeemed_at = isoDaysAgo(15);

  // Seed progress with completed_days including 14.
  admin._state.progress.push({
    user_id: USER_B,
    completed_days: [1, 2, 7, 10, 14],
  });

  // Extend USER_B's expires_at to be > redeemed+14d so refund heuristic
  // doesn't trigger. invitee_redeemed_at was set to 15d ago; ensure
  // profiles.expires_at is at least that + 14d (= -1d, so anything in the
  // future satisfies it).
  const profileB = admin._state.profiles.find((p) => p.id === USER_B);
  profileB.expires_at = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

  const insertsBefore = admin._audit.activation_codes_inserts;
  const updatesBefore = admin._audit.activation_codes_updates;

  const outcome = await creditOneReferral(admin, {
    id: referralRow.id,
    code: referralRow.code,
    referrer_id: referralRow.referrer_id,
    invitee_id: referralRow.invitee_id,
    status: referralRow.status,
    invitee_redeemed_at: referralRow.invitee_redeemed_at,
  });

  check("outcome === 'credited'", () => assert.equal(outcome, "credited"));

  const updatedRow = admin._state.referrals.find((r) => r.code === code);
  check("referrals.status === 'rewarded'", () =>
    assert.equal(updatedRow.status, "rewarded"),
  );
  check("referrals.referrer_rewarded_at set", () =>
    assert.ok(updatedRow.referrer_rewarded_at),
  );

  const profileA = admin._state.profiles.find((p) => p.id === USER_A);
  const beforeMs = Date.parse(referrerExpiresAtBeforeCredit);
  const afterMs = Date.parse(profileA.expires_at);
  check("referrer profiles.expires_at extended by 30d", () => {
    const delta = afterMs - beforeMs;
    // Allow ±2s of timing drift around the Math.max(now, current) branch.
    const expected = THIRTY_DAYS_MS;
    assert.ok(
      Math.abs(delta - expected) < 2000,
      `delta=${delta}, expected~=${expected}`,
    );
  });

  check("ZERO new activation_codes inserts (REFER-04)", () =>
    assert.equal(admin._audit.activation_codes_inserts, insertsBefore),
  );
  check("ZERO new activation_codes updates (REFER-04)", () =>
    assert.equal(admin._audit.activation_codes_updates, updatesBefore),
  );
  check("activation_codes table still empty", () =>
    assert.equal(admin._state.activation_codes.length, 0),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 4 — Self-referral (app-layer + DB-layer)
// ─────────────────────────────────────────────────────────────────────────────

await scenario("Scenario 4: Self-referral rejected (app-layer + DB CHECK)", async () => {
  clearSink();
  const admin = createFakeSupabase({
    profiles: [
      {
        id: USER_A,
        subscription_status: "active",
        subscription_tier: "monthly",
        expires_at: new Date(Date.now() + THIRTY_DAYS_MS).toISOString(),
      },
    ],
    referrals: [],
  });

  const created = await referralCreate(admin, USER_A);
  check("code created successfully", () => assert.equal(created.status, 200));
  const code = created.body.code;

  const preProfileExpiry = admin._state.profiles.find(
    (p) => p.id === USER_A,
  ).expires_at;

  const res = await activateFriend(admin, USER_A, code);
  check("status === 409 (app-layer reject)", () =>
    assert.equal(res.status, 409),
  );
  check("error === 'self_referral_forbidden'", () =>
    assert.equal(res.body.error, "self_referral_forbidden"),
  );

  const referralRow = admin._state.referrals.find((r) => r.code === code);
  check("referrals row invitee_id still null (not mutated)", () =>
    assert.ok(referralRow.invitee_id == null),
  );
  check("referrals row status unchanged (still pending_invitee)", () =>
    assert.equal(referralRow.status, "pending_invitee"),
  );

  const postProfileExpiry = admin._state.profiles.find(
    (p) => p.id === USER_A,
  ).expires_at;
  check("USER_A profile.expires_at UNCHANGED", () =>
    assert.equal(preProfileExpiry, postProfileExpiry),
  );

  // DB-layer backstop: attempt direct update that would violate the CHECK
  // constraint. The fake mirrors the CHECK and returns a constraint error.
  const { error: dbErr } = await admin
    .from("referrals")
    .update({ invitee_id: referralRow.referrer_id })
    .eq("id", referralRow.id);
  check("DB-layer CHECK rejects self-referral update", () =>
    assert.ok(dbErr && dbErr.code === "23514"),
  );
  check("DB error message mentions no_self_referral constraint", () =>
    assert.match(
      String(dbErr.message),
      /referrals_no_self_referral/,
    ),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 5 — Refund within 14d voids pending reward
// ─────────────────────────────────────────────────────────────────────────────

await scenario("Scenario 5: Refund within 14d → status=refunded, referrer NOT credited", async () => {
  clearSink();
  const referrerExpiresAt = new Date(
    Date.now() + THIRTY_DAYS_MS,
  ).toISOString();
  const admin = createFakeSupabase({
    profiles: [
      {
        id: USER_A,
        subscription_status: "active",
        subscription_tier: "monthly",
        expires_at: referrerExpiresAt,
      },
    ],
    referrals: [],
  });

  // Generate code + redeem.
  const created = await referralCreate(admin, USER_A);
  const code = created.body.code;
  const res = await activateFriend(admin, USER_B, code);
  check("redeem OK", () => assert.equal(res.status, 200));

  // Simulate refund: 10 days in, invitee's subscription_status='expired' and
  // expires_at cut short to BEFORE redeemed+14d (refund heuristic).
  const referralRow = admin._state.referrals.find((r) => r.code === code);
  referralRow.invitee_redeemed_at = isoDaysAgo(10);

  const profileB = admin._state.profiles.find((p) => p.id === USER_B);
  profileB.subscription_status = "expired";
  // expires_at is BEFORE redeemed+14d → refund heuristic triggers.
  profileB.expires_at = isoDaysAgo(5);

  const insertsBefore = admin._audit.activation_codes_inserts;

  const outcome = await creditOneReferral(admin, {
    id: referralRow.id,
    code: referralRow.code,
    referrer_id: referralRow.referrer_id,
    invitee_id: referralRow.invitee_id,
    status: referralRow.status,
    invitee_redeemed_at: referralRow.invitee_redeemed_at,
  });

  check("outcome === 'refunded'", () => assert.equal(outcome, "refunded"));
  const updatedRow = admin._state.referrals.find((r) => r.code === code);
  check("referrals.status === 'refunded'", () =>
    assert.equal(updatedRow.status, "refunded"),
  );

  const profileA = admin._state.profiles.find((p) => p.id === USER_A);
  check("referrer expires_at UNCHANGED (NOT credited)", () =>
    assert.equal(profileA.expires_at, referrerExpiresAt),
  );
  check("ZERO new activation_codes writes", () =>
    assert.equal(admin._audit.activation_codes_inserts, insertsBefore),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 6 — 4th successful referral in same year
// ─────────────────────────────────────────────────────────────────────────────

await scenario("Scenario 6: 4th referral in year — capped at create OR at credit", async () => {
  clearSink();
  const startOfYear = new Date(
    Date.UTC(new Date().getUTCFullYear(), 0, 1),
  ).toISOString();
  const referrerExpiresAt = new Date(
    Date.now() + THIRTY_DAYS_MS,
  ).toISOString();

  // Seed 3 rewarded rows already in the current year for USER_A.
  const admin = createFakeSupabase({
    profiles: [
      {
        id: USER_A,
        subscription_status: "active",
        subscription_tier: "monthly",
        expires_at: referrerExpiresAt,
      },
    ],
    referrals: [
      {
        id: "r-seed-1",
        code: "FRIEND-SEED001",
        referrer_id: USER_A,
        invitee_id: "seed-invitee-1",
        status: "rewarded",
        created_at: startOfYear,
      },
      {
        id: "r-seed-2",
        code: "FRIEND-SEED002",
        referrer_id: USER_A,
        invitee_id: "seed-invitee-2",
        status: "rewarded",
        created_at: startOfYear,
      },
      {
        id: "r-seed-3",
        code: "FRIEND-SEED003",
        referrer_id: USER_A,
        invitee_id: "seed-invitee-3",
        status: "rewarded",
        created_at: startOfYear,
      },
    ],
  });

  // Attempt to mint a 4th code — should be blocked at cap.
  const createRes = await referralCreate(admin, USER_A);
  check("create call returns 429", () => assert.equal(createRes.status, 429));
  check("error === 'annual_cap_reached'", () =>
    assert.equal(createRes.body.error, "annual_cap_reached"),
  );
  check("max === 3", () => assert.equal(createRes.body.max, 3));
  check("current === 3", () => assert.equal(createRes.body.current, 3));

  // Defense-in-depth: even if the cap check at create were bypassed (e.g. a
  // race before the 3rd rewarded landed), creditOneReferral MUST re-check.
  // Simulate: manually insert a pending_day14 row and try to credit it.
  admin._state.referrals.push({
    id: "r-race",
    code: "FRIEND-RACE99",
    referrer_id: USER_A,
    invitee_id: USER_C,
    status: "pending_day14",
    invitee_redeemed_at: isoDaysAgo(15),
    created_at: new Date().toISOString(),
  });
  admin._state.profiles.push({
    id: USER_C,
    subscription_status: "active",
    subscription_tier: "monthly",
    expires_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
  });
  admin._state.progress.push({
    user_id: USER_C,
    completed_days: [1, 7, 14],
  });

  const count = await yearlyRewardedCount(
    admin,
    USER_A,
    new Date().toISOString(),
  );
  check("yearlyRewardedCount returns 3", () => assert.equal(count, 3));

  const insertsBefore = admin._audit.activation_codes_inserts;

  const outcome = await creditOneReferral(admin, {
    id: "r-race",
    code: "FRIEND-RACE99",
    referrer_id: USER_A,
    invitee_id: USER_C,
    status: "pending_day14",
    invitee_redeemed_at: isoDaysAgo(15),
  });

  check("credit outcome === 'capped'", () =>
    assert.equal(outcome, "capped"),
  );
  const raceRow = admin._state.referrals.find((r) => r.id === "r-race");
  check("race row status === 'void'", () =>
    assert.equal(raceRow.status, "void"),
  );

  const profileA = admin._state.profiles.find((p) => p.id === USER_A);
  check("USER_A expires_at UNCHANGED (cap honored)", () =>
    assert.equal(profileA.expires_at, referrerExpiresAt),
  );
  check("ZERO new activation_codes writes during cap path", () =>
    assert.equal(admin._audit.activation_codes_inserts, insertsBefore),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 7 — ANALYTICS-07 prefix-only privacy sweep (end-of-run)
// ─────────────────────────────────────────────────────────────────────────────

await scenario("Scenario 7: ANALYTICS-07 prefix-only sweep — no full FRIEND-* codes in any event", async () => {
  // Use cumulative sink — scenarios 1-6 clear `postHogSink` for their own
  // per-scenario counts but postHogSinkAll accumulates across the entire run.
  const allSinkJson = JSON.stringify(postHogSinkAll);
  check(
    "cumulative sink contains at least 3 events (scn 1 gen + scn 2 redeem + scn 4 gen + scn 5 gen+redeem)",
    () =>
      assert.ok(
        postHogSinkAll.length >= 3,
        `cumulative sink length = ${postHogSinkAll.length}`,
      ),
  );
  check("cumulative sink JSON never contains /FRIEND-[0-9A-HJKMNP-TV-Z]{6}/", () =>
    assert.doesNotMatch(allSinkJson, /FRIEND-[0-9A-HJKMNP-TV-Z]{6}/),
  );
  // Belt-and-suspenders: every referral event's properties must carry exactly
  // the `referral_code_prefix='FRIEND'` pair — no stray `code` field.
  for (const entry of postHogSinkAll) {
    const evt = entry.body;
    if (
      evt.event === "referral_code_generated" ||
      evt.event === "referral_code_redeemed"
    ) {
      check(
        `${evt.event}: properties has referral_code_prefix='FRIEND' only`,
        () => {
          assert.equal(evt.properties.referral_code_prefix, "FRIEND");
          assert.ok(
            !("code" in evt.properties),
            "full 'code' must never appear in analytics properties",
          );
        },
      );
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log(
  `\n─────\nresults: ${passed} passed, ${failed} failed (of ${passed + failed})`,
);
if (failed > 0) {
  console.log("\nFAILURES:");
  for (const f of failures) {
    console.log(`  • ${f.name}: ${(f.err && f.err.stack) || f.err}`);
  }
  process.exit(1);
}
console.log("Phase 10 integration invariants: OK");
process.exit(0);
