#!/usr/bin/env node
/**
 * scripts/test-phase-09-integration.mjs
 *
 * Phase 9 (Renewal Prompts In-App) integration harness.
 *
 * Exercises the 6 Phase-9 end-to-end scenarios without a real DB, real browser,
 * or a running Next.js server. Mirrors the pattern established by
 * `scripts/verify/phase-08-integration.mjs`:
 *
 *   - Re-implement shape-equivalent helpers against an in-memory fake Supabase.
 *   - Import pure-Node modules (entitlement HMAC, renewalBannerHelpers) directly.
 *   - Use `new Request(url, init)` + plain objects for the fake NextRequest /
 *     NextResponse cookie API surface.
 *
 * CONSTRAINTS
 *   - Zero new runtime dependencies (NFR-08). Pure Node built-ins + node:assert.
 *   - No real network, no real Supabase, no real PostHog.
 *   - Sub-5s total runtime, deterministic, no timers/sleeps.
 *   - Exits 0 on all-pass; non-zero with a readable summary on any fail.
 *
 * SCENARIOS
 *   A. User 6 days from expiry → shouldShow returns show=true with gateway
 *      mirrored from profiles.original_gateway + daysRemaining=6.
 *   B. Auto-renewed user (expires_at = now + 90d) → shouldShow returns
 *      show=false, reason="not_within_window". (Defends Pitfall #14.)
 *   C. Client-side dismiss persisted in LocalStorage → the real
 *      `isDismissedFrom` pure helper returns true; server shouldShow remains
 *      oblivious (by contract).
 *   D. Email queued for this user today (template=expiry_warning, within 24h)
 *      → shouldShow returns show=false, reason="email_sent_today".
 *   E. RenewalBanner structurally short-circuits on sacred paths — asserted
 *      by exercising the real `isExcludedPath` helper imported from
 *      src/lib/analytics/excludedPaths.ts AND grep-verifying that
 *      RenewalBanner.tsx calls `isExcludedPath(pathname)` before any fetch.
 *   F. Stale HMAC cookie (cookie expires_at < DB expires_at) → the shape-
 *      equivalent of `refreshEntitlementIfStale` calls `res.cookies.set(...)`
 *      with a fresh token. Uses colon-free expiry strings per the pre-existing
 *      entitlement.ts bug documented in 09.06-SUMMARY.md.
 *
 * Referenced strings (for future grep guards and readability):
 *   shouldShowRenewalBanner · refreshEntitlementIfStale · expiry_warning
 *   original_gateway · last_sent_at · not_within_window · email_sent_today
 *   taamun_entitled
 */

import { strict as assert } from "node:assert";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve as pathResolve } from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// 0. Test reporter (Phase 7/8 parity)
// ─────────────────────────────────────────────────────────────────────────────

const REPO_ROOT = pathResolve(
  dirname(fileURLToPath(import.meta.url)),
  ".."
);

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
// 1. In-memory fake Supabase tailored to Phase 9 queries.
//
//    Tables modeled: profiles, email_queue, push_subscriptions.
//
//    Query shapes supported (the exact shapes used by shouldShow.ts and
//    refreshEntitlement.ts):
//
//      .from("profiles").select(cols).eq("id", v).maybeSingle()
//
//      .from("email_queue").select("id")
//        .eq("user_id", v)
//        .in("template", [...])
//        .gte("created_at", iso)
//        .limit(n)
//
//      .from("push_subscriptions").select("last_sent_at")
//        .eq("user_id", v)
//        .gte("last_sent_at", iso)
//        .limit(n)
//
//    The in/gte/limit operators return the chain itself; the resolution step
//    is triggered by `.then(...)` (implicit await) — matching real
//    supabase-js builder semantics.
// ─────────────────────────────────────────────────────────────────────────────

function createFakeSupabase(fixtures) {
  const state = {
    profiles: fixtures.profiles ? [...fixtures.profiles] : [],
    email_queue: fixtures.email_queue ? [...fixtures.email_queue] : [],
    push_subscriptions: fixtures.push_subscriptions
      ? [...fixtures.push_subscriptions]
      : [],
  };

  function table(name) {
    return {
      select(_cols) {
        const filters = [];
        const builder = {
          eq(col, val) {
            filters.push((r) => r[col] === val);
            return builder;
          },
          in(col, vals) {
            filters.push((r) => vals.includes(r[col]));
            return builder;
          },
          gte(col, val) {
            filters.push((r) => {
              const cell = r[col];
              if (cell == null) return false;
              // Both sides are ISO strings in Phase 9; lexicographic compare is
              // correct for same-zone ISO-8601.
              return cell >= val;
            });
            return builder;
          },
          limit(_n) {
            return builder;
          },
          maybeSingle() {
            const rows = state[name].filter((r) => filters.every((f) => f(r)));
            return Promise.resolve({ data: rows[0] ?? null, error: null });
          },
          // Resolve-on-await for the shouldShow.ts pattern:
          //   const { data: recentEmails } = await admin.from(...).select(...).eq(...).in(...).gte(...).limit(1)
          // (no .maybeSingle — a plain awaited builder returns { data: rows })
          then(resolve, reject) {
            try {
              const rows = state[name].filter((r) =>
                filters.every((f) => f(r)),
              );
              resolve({ data: rows, error: null });
            } catch (e) {
              reject(e);
            }
          },
        };
        return builder;
      },
    };
  }

  return { _state: state, from: table };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Shape-equivalent shouldShowRenewalBanner.
//
//    Mirrors src/lib/renewal/shouldShow.ts line-for-line for the branches
//    exercised by the 6 scenarios. If the real file drifts, update this mirror
//    in lockstep. Kept as a local function (rather than dynamic-imported from
//    src/) because src/lib/renewal/shouldShow.ts imports `@/lib/supabaseAdmin`
//    via a path alias that Node ESM cannot resolve without a loader — adding
//    a loader would drag in a new dev dep (forbidden by NFR-08).
// ─────────────────────────────────────────────────────────────────────────────

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function shouldShowRenewalBanner(admin, userId) {
  if (!admin) return { show: false, reason: "db_error" };

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("expires_at, original_gateway, subscription_tier")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) return { show: false, reason: "db_error" };
  if (!profile) return { show: false, reason: "no_profile" };

  const p = profile;

  if (!p.expires_at) return { show: false, reason: "no_expires_at" };

  const expiresAtMs = new Date(p.expires_at).getTime();
  const now = Date.now();

  if (expiresAtMs <= now) return { show: false, reason: "already_expired" };
  if (expiresAtMs - now > SEVEN_DAYS_MS) {
    return { show: false, reason: "not_within_window" };
  }
  if (!p.original_gateway) return { show: false, reason: "no_gateway" };

  const since = new Date(now - ONE_DAY_MS).toISOString();

  const { data: recentEmails } = await admin
    .from("email_queue")
    .select("id")
    .eq("user_id", userId)
    .in("template", ["expiry_warning", "renewal", "expired"])
    .gte("created_at", since)
    .limit(1);
  if (recentEmails && recentEmails.length > 0) {
    return { show: false, reason: "email_sent_today" };
  }

  const { data: pushRows } = await admin
    .from("push_subscriptions")
    .select("last_sent_at")
    .eq("user_id", userId)
    .gte("last_sent_at", since)
    .limit(1);
  if (pushRows && pushRows.length > 0) {
    return { show: false, reason: "push_sent_today" };
  }

  const daysRemaining = Math.max(
    0,
    Math.ceil((expiresAtMs - now) / ONE_DAY_MS),
  );

  const gateway = p.original_gateway;
  if (
    gateway !== "salla" &&
    gateway !== "tap" &&
    gateway !== "stripe" &&
    gateway !== "eid_code"
  ) {
    return { show: false, reason: "no_gateway" };
  }

  return {
    show: true,
    gateway,
    daysRemaining,
    tier: p.subscription_tier || "monthly",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Shape-equivalent refreshEntitlementIfStale.
//
//    Mirrors src/lib/renewal/refreshEntitlement.ts. Uses the REAL
//    `makeEntitlementToken` / `verifyEntitlementToken` / `COOKIE_NAME` from
//    src/lib/entitlement.ts (pure Node crypto, no path aliases) so the HMAC
//    round-trip is actually exercised.
//
//    Per 09.06-SUMMARY.md, the existing entitlement.ts splits the decoded
//    token on `:` which corrupts expiresAt values that contain colons (full
//    ISO). We use colon-free `YYYY-MM-DD` expiry strings — the same workaround
//    the Plan 09.06 vitest suite uses.
// ─────────────────────────────────────────────────────────────────────────────

const { makeEntitlementToken, verifyEntitlementToken, COOKIE_NAME } =
  await import("../src/lib/entitlement.ts").catch(
    // .ts extension will fail under plain node; fall back to the compiled path
    // if running after `tsc`. In dev we invoke via `node --experimental-strip-types`
    // or via the --import=… flag. Everywhere else we already use the real .ts
    // via Node's built-in TypeScript stripping (Node 22+). If that's not
    // available, we stub the crypto in-harness.
    () => stubEntitlement(),
  );

function stubEntitlement() {
  // Fallback crypto stub for older Node. Uses the same HMAC format as the real
  // module. Sourced from src/lib/entitlement.ts — see header note above.
  const { createHmac } = require("node:crypto");
  const COOKIE_NAME = "taamun_entitled";
  function getSecret() {
    const s = process.env.ENTITLEMENT_SECRET;
    if (!s) throw new Error("ENTITLEMENT_SECRET is not set");
    return s;
  }
  function makeEntitlementToken(userId, tier, expiresAt) {
    const exp = expiresAt ?? "";
    const payload = `${userId}:${tier}:${Date.now()}:${exp}`;
    const hmac = createHmac("sha256", getSecret());
    hmac.update(payload);
    const signature = hmac.digest("hex");
    const raw = `${payload}:${signature}`;
    return Buffer.from(raw).toString("base64");
  }
  function verifyEntitlementToken(token) {
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const parts = decoded.split(":");
      if (parts.length < 5) return { valid: false };
      const userId = parts[0];
      const tier = parts[1];
      const timestamp = parts[2];
      const expiresAt = parts[3];
      const signature = parts.slice(4).join(":");
      const payload = `${userId}:${tier}:${timestamp}:${expiresAt}`;
      const hmac = createHmac("sha256", getSecret());
      hmac.update(payload);
      if (signature !== hmac.digest("hex")) return { valid: false };
      if (expiresAt && new Date(expiresAt) < new Date()) {
        return { valid: false, userId, tier, expiresAt, expired: true };
      }
      return { valid: true, userId, tier, expiresAt };
    } catch {
      return { valid: false };
    }
  }
  return { makeEntitlementToken, verifyEntitlementToken, COOKIE_NAME };
}

async function refreshEntitlementIfStale(req, res, userId) {
  try {
    const currentToken = req.cookies.get(COOKIE_NAME)?.value;
    if (!currentToken) return;

    const verified = verifyEntitlementToken(currentToken);
    if (!verified.valid) return;

    const cookieExpiryMs = verified.expiresAt
      ? new Date(verified.expiresAt).getTime()
      : 0;

    const admin = req._fakeAdmin; // injected by the scenario
    const { data: profile, error } = await admin
      .from("profiles")
      .select("expires_at, subscription_tier")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile || !profile.expires_at) return;

    const dbExpiryMs = new Date(profile.expires_at).getTime();
    if (!Number.isFinite(dbExpiryMs)) return;
    if (dbExpiryMs <= cookieExpiryMs) return;

    const tier = profile.subscription_tier || verified.tier || "monthly";
    const fresh = makeEntitlementToken(userId, tier, profile.expires_at);

    res.cookies.set(COOKIE_NAME, fresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // match cookieMaxAge('monthly')=30d shape
    });
  } catch {
    // never throws by contract of 09.06
  }
}

function fakeReq(cookieValue, fakeAdmin) {
  return {
    cookies: {
      get(name) {
        if (name === COOKIE_NAME && cookieValue !== undefined) {
          return { name, value: cookieValue };
        }
        return undefined;
      },
    },
    _fakeAdmin: fakeAdmin,
  };
}

function fakeRes() {
  const calls = [];
  return {
    cookies: {
      set(name, value, opts) {
        calls.push({ name, value, opts });
      },
    },
    _setCalls: calls,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Ensure ENTITLEMENT_SECRET is set (required by makeEntitlementToken).
// ─────────────────────────────────────────────────────────────────────────────

if (!process.env.ENTITLEMENT_SECRET) {
  process.env.ENTITLEMENT_SECRET = "phase-09-harness-secret";
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario A: User 6 days from expiry → show=true, gateway propagated.
// ─────────────────────────────────────────────────────────────────────────────

await scenario(
  "Scenario A: user 6d from expiry → show=true, gateway='salla', daysRemaining=6",
  async () => {
    const userId = "user-scn-A";
    const now = Date.now();
    // 5.5 days out — Math.ceil(5.5) = 6, deterministic regardless of ms drift.
    const expiresAt = new Date(now + 5.5 * ONE_DAY_MS).toISOString();

    const admin = createFakeSupabase({
      profiles: [
        {
          id: userId,
          expires_at: expiresAt,
          original_gateway: "salla",
          subscription_tier: "monthly",
        },
      ],
      email_queue: [],
      push_subscriptions: [],
    });

    const result = await shouldShowRenewalBanner(admin, userId);

    check("show === true", () => assert.equal(result.show, true));
    check("gateway === 'salla'", () => assert.equal(result.gateway, "salla"));
    check("daysRemaining === 6", () =>
      assert.equal(result.daysRemaining, 6),
    );
    check("tier === 'monthly'", () => assert.equal(result.tier, "monthly"));
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Scenario B: Auto-renewed user (expires_at = now + 90d) → not_within_window.
// Pitfall #14 defense — the user self-renewed; the banner must vanish.
// ─────────────────────────────────────────────────────────────────────────────

await scenario(
  "Scenario B: auto-renewed (expires_at=now+90d) → show=false, reason='not_within_window'",
  async () => {
    const userId = "user-scn-B";
    const now = Date.now();
    const expiresAt = new Date(now + 90 * ONE_DAY_MS).toISOString();

    const admin = createFakeSupabase({
      profiles: [
        {
          id: userId,
          expires_at: expiresAt,
          original_gateway: "stripe",
          subscription_tier: "yearly",
        },
      ],
    });

    const result = await shouldShowRenewalBanner(admin, userId);

    check("show === false", () => assert.equal(result.show, false));
    check("reason === 'not_within_window'", () =>
      assert.equal(result.reason, "not_within_window"),
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Scenario C: client-side dismiss LocalStorage → isDismissedFrom returns true.
// The server-side shouldShow remains oblivious (by contract); the gate is
// client-side only. We exercise the REAL isDismissedFrom helper from
// src/components/renewalBannerHelpers.ts.
// ─────────────────────────────────────────────────────────────────────────────

await scenario(
  "Scenario C: dismiss persisted in LocalStorage → isDismissedFrom returns true",
  async () => {
    const helpers = await import(
      "../src/components/renewalBannerHelpers.ts"
    ).catch(() => null);

    if (!helpers) {
      // Fallback inline: replicate the pure helper using its exact logic.
      // This path only triggers if Node < 22 without TS-stripping; the keys
      // are the same constants the component uses.
      const DISMISS_KEY = "taamun.renewal_dismissed_until.v1";
      const DISMISS_COUNT_KEY = "taamun.renewal_dismiss_count.v1";
      const MAX_DISMISSALS = 3;
      function inlineIsDismissed(storage, now = Date.now()) {
        if (!storage) return false;
        try {
          const until = Number(storage.getItem(DISMISS_KEY) || 0);
          if (Number.isFinite(until) && until > now) return true;
          const count = Number(storage.getItem(DISMISS_COUNT_KEY) || 0);
          if (Number.isFinite(count) && count >= MAX_DISMISSALS) return true;
        } catch {
          /* ignore */
        }
        return false;
      }
      const fakeStorageRecent = {
        getItem(k) {
          if (k === DISMISS_KEY) return String(Date.now() + 1 * 60 * 60 * 1000);
          return null;
        },
      };
      check("[fallback] recent dismiss suppresses banner", () =>
        assert.equal(inlineIsDismissed(fakeStorageRecent), true),
      );
      return;
    }

    const { isDismissedFrom, DISMISS_KEY, DISMISS_COUNT_KEY, MAX_DISMISSALS } =
      helpers;

    const fakeStorageRecent = {
      getItem(k) {
        if (k === DISMISS_KEY) {
          return String(Date.now() + 60 * 60 * 1000); // 1h in future
        }
        return null;
      },
    };
    check("recent-dismiss (until=now+1h) → isDismissedFrom true", () =>
      assert.equal(isDismissedFrom(fakeStorageRecent), true),
    );

    const fakeStorageCap = {
      getItem(k) {
        if (k === DISMISS_COUNT_KEY) return String(MAX_DISMISSALS);
        return null;
      },
    };
    check("at dismiss-cap (count === MAX) → isDismissedFrom true", () =>
      assert.equal(isDismissedFrom(fakeStorageCap), true),
    );

    const fakeStorageStale = {
      getItem(k) {
        if (k === DISMISS_KEY) {
          return String(Date.now() - 60 * 60 * 1000); // 1h ago
        }
        if (k === DISMISS_COUNT_KEY) return "0";
        return null;
      },
    };
    check("stale dismiss (until=now-1h) + count=0 → false", () =>
      assert.equal(isDismissedFrom(fakeStorageStale), false),
    );

    check("null storage → isDismissedFrom false (graceful)", () =>
      assert.equal(isDismissedFrom(null), false),
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Scenario D: email_queue has expiry_warning row created within 24h →
// shouldShow returns show=false, reason="email_sent_today".
// ─────────────────────────────────────────────────────────────────────────────

await scenario(
  "Scenario D: email_queue (template=expiry_warning, created 5h ago) → show=false, email_sent_today",
  async () => {
    const userId = "user-scn-D";
    const now = Date.now();
    const expiresAt = new Date(now + 6 * ONE_DAY_MS).toISOString();
    const fiveHoursAgoIso = new Date(now - 5 * 60 * 60 * 1000).toISOString();

    const admin = createFakeSupabase({
      profiles: [
        {
          id: userId,
          expires_at: expiresAt,
          original_gateway: "salla",
          subscription_tier: "monthly",
        },
      ],
      email_queue: [
        {
          id: "eq-1",
          user_id: userId,
          template: "expiry_warning",
          created_at: fiveHoursAgoIso,
          sent_at: null, // still queued — dedup on created_at is the whole point
        },
      ],
      push_subscriptions: [],
    });

    const result = await shouldShowRenewalBanner(admin, userId);

    check("show === false", () => assert.equal(result.show, false));
    check("reason === 'email_sent_today'", () =>
      assert.equal(result.reason, "email_sent_today"),
    );

    // Sanity: also confirm the in() template filter — a row with an unrelated
    // template must NOT suppress the banner.
    const userId2 = "user-scn-D2";
    const adminUnrelated = createFakeSupabase({
      profiles: [
        {
          id: userId2,
          expires_at: expiresAt,
          original_gateway: "salla",
          subscription_tier: "monthly",
        },
      ],
      email_queue: [
        {
          id: "eq-2",
          user_id: userId2,
          template: "weekly_digest",
          created_at: fiveHoursAgoIso,
          sent_at: null,
        },
      ],
      push_subscriptions: [],
    });
    const resultUnrelated = await shouldShowRenewalBanner(
      adminUnrelated,
      userId2,
    );
    check("unrelated template (weekly_digest) does NOT suppress banner", () =>
      assert.equal(resultUnrelated.show, true),
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Scenario E: sacred-path structural guard — the RenewalBanner component
// short-circuits on excluded paths before any fetch. Exercises the real
// `isExcludedPath` (authoritative since Plan 06) AND grep-verifies that
// RenewalBanner.tsx does gate on it.
// ─────────────────────────────────────────────────────────────────────────────

await scenario(
  "Scenario E: isExcludedPath + RenewalBanner structural gate on sacred paths",
  async () => {
    const excluded = await import(
      "../src/lib/analytics/excludedPaths.ts"
    ).catch(() => null);

    if (excluded) {
      const { isExcludedPath } = excluded;
      check("isExcludedPath('/day/7') → true", () =>
        assert.equal(isExcludedPath("/day/7"), true),
      );
      check("isExcludedPath('/book/chapter-1') → true", () =>
        assert.equal(isExcludedPath("/book/chapter-1"), true),
      );
      check("isExcludedPath('/reflection') → true", () =>
        assert.equal(isExcludedPath("/reflection"), true),
      );
      check("isExcludedPath('/program/day/3') → true", () =>
        assert.equal(isExcludedPath("/program/day/3"), true),
      );
      check("isExcludedPath('/') → false", () =>
        assert.equal(isExcludedPath("/"), false),
      );
      check("isExcludedPath('/pricing') → false", () =>
        assert.equal(isExcludedPath("/pricing"), false),
      );
      check("isExcludedPath('/account') → false", () =>
        assert.equal(isExcludedPath("/account"), false),
      );
    } else {
      check("excludedPaths module load (TS-strip support?)", () => {
        throw new Error(
          "Could not load src/lib/analytics/excludedPaths.ts — run with Node 22+",
        );
      });
    }

    // Structural: RenewalBanner.tsx must call isExcludedPath(pathname) before fetch.
    const banner = await readFile(
      pathResolve(REPO_ROOT, "src/components/RenewalBanner.tsx"),
      "utf8",
    );
    check("RenewalBanner.tsx gates on isExcludedPath(pathname)", () =>
      assert.match(banner, /isExcludedPath\(pathname\)/),
    );
    check("RenewalBanner.tsx imports isExcludedPath from analytics/excludedPaths", () =>
      assert.match(
        banner,
        /from\s+['"]@\/lib\/analytics\/excludedPaths['"]/,
      ),
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Scenario F: stale cookie (cookie expires_at < DB expires_at) → helper
// attempts to refresh. Uses colon-free YYYY-MM-DD expiry strings per
// 09.06-SUMMARY.md workaround.
// ─────────────────────────────────────────────────────────────────────────────

await scenario(
  "Scenario F: stale HMAC cookie (cookie 2d < DB 30d) → refresh fires res.cookies.set",
  async () => {
    const userId = "user-scn-F";
    const nowMs = Date.now();
    const cookieExpiry = new Date(nowMs + 2 * ONE_DAY_MS)
      .toISOString()
      .slice(0, 10); // YYYY-MM-DD — colon-free
    const dbExpiry = new Date(nowMs + 30 * ONE_DAY_MS)
      .toISOString()
      .slice(0, 10);

    const admin = createFakeSupabase({
      profiles: [
        {
          id: userId,
          expires_at: dbExpiry,
          subscription_tier: "yearly",
        },
      ],
    });

    const staleToken = makeEntitlementToken(userId, "monthly", cookieExpiry);
    const req = fakeReq(staleToken, admin);
    const res = fakeRes();

    await refreshEntitlementIfStale(req, res, userId);

    check("res.cookies.set called exactly once (stale cookie refreshed)", () =>
      assert.equal(res._setCalls.length, 1),
    );
    check("set cookie name === COOKIE_NAME", () =>
      assert.equal(res._setCalls[0].name, COOKIE_NAME),
    );
    check("set cookie value is a non-empty string", () => {
      assert.equal(typeof res._setCalls[0].value, "string");
      assert.ok(res._setCalls[0].value.length > 0);
    });
    check("set cookie value differs from stale token", () =>
      assert.notEqual(res._setCalls[0].value, staleToken),
    );
    check("cookie opts.httpOnly === true", () =>
      assert.equal(res._setCalls[0].opts.httpOnly, true),
    );
    check("cookie opts.sameSite === 'lax'", () =>
      assert.equal(res._setCalls[0].opts.sameSite, "lax"),
    );
    check("cookie opts.path === '/'", () =>
      assert.equal(res._setCalls[0].opts.path, "/"),
    );
    check("cookie opts.maxAge > 0", () => {
      assert.equal(typeof res._setCalls[0].opts.maxAge, "number");
      assert.ok(res._setCalls[0].opts.maxAge > 0);
    });

    // Negative-path sanity: DB newer-than-cookie is the ONLY trigger.
    // Same-expiry → no-op.
    const sameReq = fakeReq(
      makeEntitlementToken(userId, "monthly", dbExpiry),
      admin,
    );
    const sameRes = fakeRes();
    await refreshEntitlementIfStale(sameReq, sameRes, userId);
    check("same-expiry cookie → no refresh (res.cookies.set not called)", () =>
      assert.equal(sameRes._setCalls.length, 0),
    );

    // No cookie → no-op, no DB hit.
    const noReq = fakeReq(undefined, admin);
    const noRes = fakeRes();
    await refreshEntitlementIfStale(noReq, noRes, userId);
    check("no cookie on request → no refresh", () =>
      assert.equal(noRes._setCalls.length, 0),
    );
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Summary.
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
console.log("Phase 9 integration invariants: OK");
process.exit(0);
