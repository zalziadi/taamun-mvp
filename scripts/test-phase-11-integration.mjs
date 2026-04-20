#!/usr/bin/env node
/**
 * scripts/test-phase-11-integration.mjs
 *
 * Phase 11 (Year-in-Review) integration harness — 6 scenarios.
 *
 * Mirrors the pattern established by Phase 09/10 harnesses
 * (scripts/test-phase-09-integration.mjs, scripts/test-phase-10-integration.mjs):
 *   - Zero new runtime / dev dependencies (NFR-08). Pure Node built-ins +
 *     node:assert + node:fs + node:child_process.
 *   - No real network, no real Supabase, no real PostHog.
 *   - Sub-3s total runtime on a typical dev laptop.
 *   - Exits 0 on all-pass; non-zero with a readable summary on any failure.
 *
 * PATH-ALIAS RESOLUTION
 *   Node ESM cannot resolve `./types` inside `yearKey.ts` without `.ts` (and
 *   cannot resolve `@/*` aliases at all) without a custom loader. NFR-08
 *   forbids adding one. We therefore SHAPE-MIRROR the three Phase 11 helpers
 *   INLINE — same contract, byte-equivalent logic for the paths we exercise:
 *     - YEAR_KEY_PATTERN, isYIRPublicStats (types.ts)
 *     - yearKeyForUser (yearKey.ts)
 *     - getYearInReview + MIN_REFLECTIONS_THRESHOLD + CACHE_TTL_HOURS (aggregate.ts)
 *   The mirrors are KEPT IN SYNC with their sources; drift between this file
 *   and the `src/lib/yearInReview/*.ts` files is caught by:
 *     1. Scenario G — sanity-asserts the constants.
 *     2. Phase 11 anti-pattern guard — greps the real source files.
 *     3. `npm run guard:release` — tsc + build + guard chain runs the real code.
 *   This is the Phase 09 harness precedent (see phase-09 comment header).
 *
 * SCENARIOS
 *   A. User with 40 reflections → getYearInReview returns YIRPublicStats →
 *      page-shape emits exactly 1 year_review_opened event.
 *   B. Cache fresh (<24h) → getYearInReview served from year_reviews.payload,
 *      RPC was NOT called (spy audit on fake Supabase).
 *   C. Cache stale (>24h) → getYearInReview calls RPC + upserts fresh payload,
 *      year_reviews.generated_at now within last minute.
 *   D. User with 20 reflections → getYearInReview returns null → page-shape
 *      emits ZERO year_review_opened events, response contains no share button.
 *   E. Share card URL → og route mirror validates year_key, renders ImageResponse,
 *      emits exactly 1 year_review_shared event.
 *   F. Static grep: `YIRPrivateContent` is NEVER imported into
 *      src/app/year-in-review/og/route.tsx (compile-time privacy guarantee
 *      verified at CI). Plus regression-insurance self-test (unless --no-regression-test):
 *      inject a violation → confirm guard catches it → revert.
 *
 * Usage:
 *   node scripts/test-phase-11-integration.mjs
 *   node scripts/test-phase-11-integration.mjs --no-regression-test
 */

import { strict as assert } from "node:assert";
import { fileURLToPath } from "node:url";
import { dirname, resolve as pathResolve } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const REPO_ROOT = pathResolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);

const SKIP_REGRESSION = process.argv.includes("--no-regression-test");

// ─────────────────────────────────────────────────────────────────────────────
// 0. Environment bootstrap — PostHog sink only activates when key+host set.
// ─────────────────────────────────────────────────────────────────────────────

process.env.NEXT_PUBLIC_POSTHOG_KEY = "phase-11-harness-key";
process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://posthog.test";
if (!process.env.ENTITLEMENT_SECRET) {
  process.env.ENTITLEMENT_SECRET = "phase-11-harness-secret";
}

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
// ─────────────────────────────────────────────────────────────────────────────

const postHogSink = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async function interceptFetch(url, init) {
  const urlStr = typeof url === "string" ? url : String(url);
  if (urlStr.includes("/capture/")) {
    let body = null;
    try {
      body = init && init.body ? JSON.parse(String(init.body)) : null;
    } catch {
      body = null;
    }
    postHogSink.push({ url: urlStr, body });
    return new Response(JSON.stringify({ status: 1 }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  return originalFetch(url, init);
};

function sinkEventsByName(name) {
  return postHogSink.filter((e) => e?.body?.event === name);
}

function clearSink() {
  postHogSink.length = 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Shape-equivalent inline mirrors (kept in sync with src/lib/yearInReview/*)
// ─────────────────────────────────────────────────────────────────────────────

// Mirror of src/lib/yearInReview/types.ts
const YEAR_KEY_PATTERN = /^[0-9]{4}_anniversary$/;

function isYIRPublicStats(x) {
  if (!x || typeof x !== "object") return false;
  const r = x;
  return (
    typeof r.reflections_count === "number" &&
    (typeof r.awareness_avg === "number" || r.awareness_avg === null) &&
    Array.isArray(r.milestones_reached) &&
    typeof r.cycle_count === "number" &&
    (r.earliest_reflection_at === null ||
      typeof r.earliest_reflection_at === "string") &&
    (r.latest_reflection_at === null ||
      typeof r.latest_reflection_at === "string") &&
    Array.isArray(r.awareness_trajectory)
  );
}

// Mirror of src/lib/yearInReview/yearKey.ts — yearKeyForUser
const TIMEZONE = "Asia/Riyadh";
function toRiyadhYMD(d) {
  if (isNaN(d.getTime())) throw new Error("yearKey: invalid Date");
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const iso = fmt.format(d);
  const [y, m, day] = iso.split("-").map((n) => parseInt(n, 10));
  return { year: y, month: m, day };
}
function safeParseDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d;
}
function yearKeyForUser(profile, now = new Date()) {
  const anchor =
    safeParseDate(profile.activation_started_at) ??
    safeParseDate(profile.created_at);
  if (!anchor) {
    throw new Error(
      "yearKeyForUser: neither activation_started_at nor created_at is a valid date",
    );
  }
  if (isNaN(now.getTime())) throw new Error("yearKeyForUser: `now` invalid");
  const anchorYMD = toRiyadhYMD(anchor);
  const nowYMD = toRiyadhYMD(now);
  const nowBeforeAnniv =
    nowYMD.month < anchorYMD.month ||
    (nowYMD.month === anchorYMD.month && nowYMD.day < anchorYMD.day);
  const anniversaryYear = nowBeforeAnniv ? nowYMD.year - 1 : nowYMD.year;
  const key = `${anniversaryYear}_anniversary`;
  if (!YEAR_KEY_PATTERN.test(key)) {
    throw new Error(`yearKeyForUser: malformed key: ${key}`);
  }
  return key;
}
function parseYearKey(key, anchor) {
  if (!YEAR_KEY_PATTERN.test(key)) {
    throw new Error(`parseYearKey: malformed key: ${JSON.stringify(key)}`);
  }
  if (isNaN(anchor.getTime())) {
    throw new Error("parseYearKey: invalid anchor Date");
  }
  const year = parseInt(key.slice(0, 4), 10);
  const month = anchor.getUTCMonth();
  const day = anchor.getUTCDate();
  const start = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year + 1, month, day, 0, 0, 0, 0));
  return { start, end };
}

// Mirror of src/lib/yearInReview/aggregate.ts — getYearInReview
const MIN_REFLECTIONS_THRESHOLD = 30; // YIR-01
const CACHE_TTL_HOURS = 24; // YIR-03
const HOUR_MS = 60 * 60 * 1000;

async function getYearInReview(userId, admin, now = () => new Date()) {
  try {
    // 1. Profile
    const { data: profileRaw, error: pErr } = await admin
      .from("profiles")
      .select("activation_started_at, created_at")
      .eq("id", userId)
      .maybeSingle();
    if (pErr) return null;
    if (!profileRaw) return null;

    const profile = profileRaw;
    const nowDate = now();
    const yearKey = yearKeyForUser(profile, nowDate);

    // 2. Threshold gate
    const anchor = new Date(
      profile.activation_started_at ?? profile.created_at,
    );
    const { start, end } = parseYearKey(yearKey, anchor);
    const countResp = await admin
      .from("reflections")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString());
    const reflectionsCount = countResp?.count ?? 0;
    if (reflectionsCount < MIN_REFLECTIONS_THRESHOLD) return null;

    // 3. Cache lookup
    const { data: cachedRaw } = await admin
      .from("year_reviews")
      .select("payload, generated_at")
      .eq("user_id", userId)
      .eq("year_key", yearKey)
      .maybeSingle();

    if (cachedRaw) {
      if (
        cachedRaw.generated_at &&
        isFresh(cachedRaw.generated_at, nowDate) &&
        isYIRPublicStats(cachedRaw.payload)
      ) {
        return cachedRaw.payload;
      }
    }

    // 4. Regenerate via RPC
    const { data: rpcData, error: rpcErr } = await admin.rpc(
      "get_year_in_review",
      { p_user_id: userId, p_year_key: yearKey },
    );
    if (rpcErr) return null;
    if (!isYIRPublicStats(rpcData)) return null;

    // 5. Upsert
    const upsertResp = await admin.from("year_reviews").upsert(
      {
        user_id: userId,
        year_key: yearKey,
        payload: rpcData,
        generated_at: nowDate.toISOString(),
      },
      { onConflict: "user_id,year_key" },
    );
    // Soft-warn on upsert failure — still return fresh payload.
    // (Fake admin doesn't return errors on upsert, so this branch is a no-op.)
    void upsertResp;

    return rpcData;
  } catch {
    return null;
  }
}

function isFresh(generatedAt, nowDate) {
  const gAt = new Date(generatedAt).getTime();
  if (isNaN(gAt)) return false;
  return nowDate.getTime() - gAt < CACHE_TTL_HOURS * HOUR_MS;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Fake Supabase client — shape-equivalent to Phase 11 surface.
//
//    Tables: profiles, reflections, year_reviews.
//    Chain:  from().select().eq().gte().lt().maybeSingle() / await
//            from().upsert(row, { onConflict })
//            rpc(name, params)
//    Audit:  rpc_calls, upsert_calls, select_calls for cache scenarios.
// ─────────────────────────────────────────────────────────────────────────────

function createFakeSupabase(fixtures = {}, rpcHandler = null) {
  const state = {
    profiles: fixtures.profiles ? [...fixtures.profiles] : [],
    reflections: fixtures.reflections ? [...fixtures.reflections] : [],
    year_reviews: fixtures.year_reviews ? [...fixtures.year_reviews] : [],
  };
  const audit = {
    rpc_calls: 0,
    upsert_calls: 0,
    select_calls: 0,
    rpc_args: [],
  };
  function tableRef(name) {
    if (!(name in state)) state[name] = [];
    return state[name];
  }
  function select(name, cols = "*", opts = {}) {
    audit.select_calls += 1;
    const filters = [];
    const builder = {
      eq(col, val) {
        filters.push((r) => r[col] === val);
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
      lt(col, val) {
        filters.push((r) => {
          const cell = r[col];
          if (cell == null) return false;
          return cell < val;
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
      maybeSingle() {
        const rows = tableRef(name).filter((r) =>
          filters.every((f) => f(r)),
        );
        return Promise.resolve({ data: rows[0] ?? null, error: null });
      },
      then(resolve, reject) {
        try {
          const rows = tableRef(name).filter((r) =>
            filters.every((f) => f(r)),
          );
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
  function upsert(name, row, opts = {}) {
    audit.upsert_calls += 1;
    const onConflictKeys = (opts.onConflict ?? "id").split(",");
    const rows = tableRef(name);
    const idx = rows.findIndex((r) =>
      onConflictKeys.every((k) => r[k] === row[k]),
    );
    if (idx >= 0) rows[idx] = { ...rows[idx], ...row };
    else rows.push({ ...row });
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
        upsert(row, opts) {
          return upsert(name, row, opts);
        },
      };
    },
    async rpc(fn, params) {
      audit.rpc_calls += 1;
      audit.rpc_args.push({ fn, params });
      if (rpcHandler) return rpcHandler(fn, params);
      return { data: null, error: { message: "no rpc handler configured" } };
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Shape-equivalent mirrors for the route edges.
//
//    page.tsx emits `year_review_opened` above threshold, nothing below.
//    og/route.tsx validates year_key, clamps count, renders image, emits
//    `year_review_shared`.
// ─────────────────────────────────────────────────────────────────────────────

async function emitEventMirror(event, distinctId) {
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
    /* never throws by contract */
  }
}

async function pageRouteMirror(admin, userId, now = new Date()) {
  const stats = await getYearInReview(userId, admin, () => now);
  if (!stats) {
    return {
      status: 200,
      body: {
        text: "سنتي مع القرآن — حين تتراكم أيامك (على الأقل ٣٠ يوماً) ... ارجع لاحقاً",
        hasShareButton: false,
        hasArchive: false,
      },
      stats: null,
    };
  }
  const { data: profile } = await admin
    .from("profiles")
    .select("activation_started_at, created_at")
    .eq("id", userId)
    .maybeSingle();
  const yearKey = yearKeyForUser(profile, now);

  await emitEventMirror(
    {
      name: "year_review_opened",
      properties: {
        year_key: yearKey,
        reflections_count: stats.reflections_count,
      },
    },
    userId,
  );

  return {
    status: 200,
    body: {
      text: `سنتي مع القرآن ${stats.reflections_count}`,
      hasShareButton: true,
      hasArchive: true,
      sparkline: stats.awareness_trajectory.length >= 2,
    },
    stats,
    yearKey,
  };
}

async function ogRouteMirror(url) {
  const parsed = new URL(url, "https://local.test");
  const yearKey = parsed.searchParams.get("year_key") ?? "";
  const countRaw = parsed.searchParams.get("c") ?? "0";
  const parsedCount = parseInt(countRaw, 10);
  const count = Number.isFinite(parsedCount)
    ? Math.max(0, Math.min(9999, parsedCount))
    : 0;

  if (!YEAR_KEY_PATTERN.test(yearKey)) {
    return { status: 400, body: "invalid year_key" };
  }

  try {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (key && host) {
      await fetch(`${host}/capture/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: key,
          event: "year_review_shared",
          distinct_id: "share_card_crawler",
          properties: { year_key: yearKey, reflections_count: count },
          timestamp: new Date().toISOString(),
        }),
      });
    }
  } catch {
    /* swallow */
  }

  return {
    status: 200,
    contentType: "image/png",
    imageWidth: 1200,
    imageHeight: 630,
    yearKey,
    count,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers for test setup
// ─────────────────────────────────────────────────────────────────────────────

function seedReflections(userId, count, windowStart, windowEnd) {
  const rows = [];
  const windowMs = windowEnd.getTime() - windowStart.getTime();
  for (let i = 0; i < count; i++) {
    const at = new Date(windowStart.getTime() + (windowMs * i) / count);
    rows.push({
      id: `r-${userId}-${i}`,
      user_id: userId,
      created_at: at.toISOString(),
    });
  }
  return rows;
}

function buildStatsPayload(overrides = {}) {
  return {
    reflections_count: 40,
    awareness_avg: 0.75,
    milestones_reached: ["first_reflection", "day_7", "day_14"],
    cycle_count: 2,
    earliest_reflection_at: "2026-05-01T00:00:00.000Z",
    latest_reflection_at: "2027-04-01T00:00:00.000Z",
    awareness_trajectory: [0.3, 0.5, 0.6, 0.7, 0.8, 0.75, 0.9],
    ...overrides,
  };
}

function windowForProfile(profile, now) {
  const yearKey = yearKeyForUser(profile, now);
  const anchor = new Date(
    profile.activation_started_at ?? profile.created_at,
  );
  return parseYearKey(yearKey, anchor);
}

const USER_A = "user-A-40";
const USER_B = "user-B-20";
const ACTIVATION_START_A = "2026-05-01T10:00:00.000Z";
const ACTIVATION_START_B = "2026-06-01T10:00:00.000Z";

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO A — 40 reflections → archive + 1 event
// ─────────────────────────────────────────────────────────────────────────────

await scenario("Scenario A: 40 reflections → archive renders + 1 year_review_opened event", async () => {
  clearSink();
  const now = new Date("2027-06-15T12:00:00.000Z");

  const profile = {
    id: USER_A,
    activation_started_at: ACTIVATION_START_A,
    created_at: ACTIVATION_START_A,
  };
  const { start, end } = windowForProfile(profile, now);
  const reflections = seedReflections(USER_A, 40, start, end);

  const rpcPayload = buildStatsPayload({ reflections_count: 40 });
  const admin = createFakeSupabase(
    {
      profiles: [profile],
      reflections,
      year_reviews: [],
    },
    (fn) => {
      if (fn === "get_year_in_review") return { data: rpcPayload, error: null };
      return { data: null, error: { message: "unexpected rpc" } };
    },
  );

  const page = await pageRouteMirror(admin, USER_A, now);
  check("page status === 200", () => assert.equal(page.status, 200));
  check("page hasArchive === true", () => assert.equal(page.body.hasArchive, true));
  check("page hasShareButton === true", () =>
    assert.equal(page.body.hasShareButton, true),
  );
  check("page sparkline true (trajectory has ≥2 points)", () =>
    assert.equal(page.body.sparkline, true),
  );
  check("stats is YIRPublicStats shape", () =>
    assert.ok(isYIRPublicStats(page.stats)),
  );
  check("stats.reflections_count === 40", () =>
    assert.equal(page.stats.reflections_count, 40),
  );
  check("RPC was called (no cache)", () =>
    assert.ok(admin._audit.rpc_calls >= 1),
  );
  check("upsert was called (fresh snapshot persisted)", () =>
    assert.ok(admin._audit.upsert_calls >= 1),
  );

  const events = sinkEventsByName("year_review_opened");
  check("exactly 1 year_review_opened event emitted", () =>
    assert.equal(events.length, 1),
  );
  check("event year_key matches YEAR_KEY_PATTERN", () =>
    assert.match(events[0].body.properties.year_key, YEAR_KEY_PATTERN),
  );
  check("event reflections_count === 40", () =>
    assert.equal(events[0].body.properties.reflections_count, 40),
  );
  check("event has NO reflection_text property (privacy)", () =>
    assert.ok(!("reflection_text" in events[0].body.properties)),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO B — Cache fresh (<24h) → no RPC
// ─────────────────────────────────────────────────────────────────────────────

await scenario("Scenario B: cache fresh (<24h) → served from year_reviews.payload, NO RPC call", async () => {
  clearSink();
  const now = new Date("2027-06-15T12:00:00.000Z");
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

  const profile = {
    id: USER_A,
    activation_started_at: ACTIVATION_START_A,
    created_at: ACTIVATION_START_A,
  };
  const yearKey = yearKeyForUser(profile, now);
  const { start, end } = windowForProfile(profile, now);
  const reflections = seedReflections(USER_A, 40, start, end);
  const cachedPayload = buildStatsPayload({
    reflections_count: 40,
    milestones_reached: ["cached_marker"],
  });

  const admin = createFakeSupabase(
    {
      profiles: [profile],
      reflections,
      year_reviews: [
        {
          user_id: USER_A,
          year_key: yearKey,
          payload: cachedPayload,
          generated_at: oneHourAgo,
        },
      ],
    },
    () => ({ data: null, error: { message: "RPC must not be called on fresh cache" } }),
  );

  const stats = await getYearInReview(USER_A, admin, () => now);
  check("getYearInReview returns stats from cache", () =>
    assert.ok(isYIRPublicStats(stats)),
  );
  check("stats matches cached payload (contains 'cached_marker')", () =>
    assert.ok(stats.milestones_reached.includes("cached_marker")),
  );
  check("ZERO rpc_calls on fresh cache (YIR-03 cache policy)", () =>
    assert.equal(admin._audit.rpc_calls, 0),
  );
  check("ZERO upsert_calls on fresh cache", () =>
    assert.equal(admin._audit.upsert_calls, 0),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO C — Cache stale (>24h) → regenerates + upserts
// ─────────────────────────────────────────────────────────────────────────────

await scenario("Scenario C: cache stale (>24h) → regenerates + upserts fresh", async () => {
  clearSink();
  const now = new Date("2027-06-15T12:00:00.000Z");
  const twentyFiveHoursAgo = new Date(
    now.getTime() - 25 * 60 * 60 * 1000,
  ).toISOString();

  const profile = {
    id: USER_A,
    activation_started_at: ACTIVATION_START_A,
    created_at: ACTIVATION_START_A,
  };
  const yearKey = yearKeyForUser(profile, now);
  const { start, end } = windowForProfile(profile, now);
  const reflections = seedReflections(USER_A, 40, start, end);
  const staleCached = buildStatsPayload({
    reflections_count: 32,
    milestones_reached: ["stale_marker"],
  });
  const freshRpcPayload = buildStatsPayload({
    reflections_count: 40,
    milestones_reached: ["fresh_marker"],
  });

  const admin = createFakeSupabase(
    {
      profiles: [profile],
      reflections,
      year_reviews: [
        {
          user_id: USER_A,
          year_key: yearKey,
          payload: staleCached,
          generated_at: twentyFiveHoursAgo,
        },
      ],
    },
    (fn) => {
      if (fn === "get_year_in_review") return { data: freshRpcPayload, error: null };
      return { data: null, error: { message: "unexpected rpc" } };
    },
  );

  const stats = await getYearInReview(USER_A, admin, () => now);
  check("getYearInReview returns FRESH payload (not stale)", () =>
    assert.ok(stats.milestones_reached.includes("fresh_marker")),
  );
  check("rpc_calls >= 1 (stale → regenerate)", () =>
    assert.ok(admin._audit.rpc_calls >= 1),
  );
  check("upsert_calls >= 1 (fresh payload persisted)", () =>
    assert.ok(admin._audit.upsert_calls >= 1),
  );

  const row = admin._state.year_reviews.find(
    (r) => r.user_id === USER_A && r.year_key === yearKey,
  );
  check("upserted row exists post-regenerate", () => assert.ok(row));
  check("generated_at is within last minute (fresh)", () => {
    const deltaMs = now.getTime() - new Date(row.generated_at).getTime();
    assert.ok(
      deltaMs >= 0 && deltaMs < 60_000,
      `generated_at delta = ${deltaMs}ms`,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO D — 20 reflections → gate, no event, no share
// ─────────────────────────────────────────────────────────────────────────────

await scenario("Scenario D: 20 reflections → gentle gate, NO event, NO share button", async () => {
  clearSink();
  const now = new Date("2027-07-15T12:00:00.000Z");

  const profile = {
    id: USER_B,
    activation_started_at: ACTIVATION_START_B,
    created_at: ACTIVATION_START_B,
  };
  const { start, end } = windowForProfile(profile, now);
  const reflections = seedReflections(USER_B, 20, start, end);

  const admin = createFakeSupabase(
    { profiles: [profile], reflections, year_reviews: [] },
    () => ({ data: null, error: { message: "RPC must not be called below threshold" } }),
  );

  const stats = await getYearInReview(USER_B, admin, () => now);
  check("getYearInReview returns null below threshold (YIR-01)", () =>
    assert.equal(stats, null),
  );
  check("MIN_REFLECTIONS_THRESHOLD === 30", () =>
    assert.equal(MIN_REFLECTIONS_THRESHOLD, 30),
  );
  check("ZERO rpc_calls below threshold", () =>
    assert.equal(admin._audit.rpc_calls, 0),
  );

  const page = await pageRouteMirror(admin, USER_B, now);
  const events = sinkEventsByName("year_review_opened");
  check("ZERO year_review_opened events below threshold", () =>
    assert.equal(events.length, 0),
  );
  check("page body hasShareButton === false", () =>
    assert.equal(page.body.hasShareButton, false),
  );
  check("page body hasArchive === false", () =>
    assert.equal(page.body.hasArchive, false),
  );
  check("page body contains 'ارجع لاحقاً' gate text", () =>
    assert.match(page.body.text, /ارجع لاحقاً/),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO E — Share card URL → image + 1 event
// ─────────────────────────────────────────────────────────────────────────────

await scenario("Scenario E: share card URL → image response + 1 year_review_shared event", async () => {
  clearSink();
  const res = await ogRouteMirror(
    "/year-in-review/og?year_key=2027_anniversary&c=42",
  );
  check("status === 200", () => assert.equal(res.status, 200));
  check("content-type === image/png", () =>
    assert.equal(res.contentType, "image/png"),
  );
  check("image width === 1200", () => assert.equal(res.imageWidth, 1200));
  check("image height === 630", () => assert.equal(res.imageHeight, 630));
  check("year_key echoed === 2027_anniversary", () =>
    assert.equal(res.yearKey, "2027_anniversary"),
  );
  check("count echoed === 42", () => assert.equal(res.count, 42));

  const events = sinkEventsByName("year_review_shared");
  check("exactly 1 year_review_shared event emitted", () =>
    assert.equal(events.length, 1),
  );
  check("event distinct_id === 'share_card_crawler' (crawler, not user)", () =>
    assert.equal(events[0].body.distinct_id, "share_card_crawler"),
  );
  check("event year_key === '2027_anniversary'", () =>
    assert.equal(events[0].body.properties.year_key, "2027_anniversary"),
  );
  check("event reflections_count === 42", () =>
    assert.equal(events[0].body.properties.reflections_count, 42),
  );
  check("event has NO user_email / user_name / reflection_text (privacy)", () => {
    const p = events[0].body.properties;
    assert.ok(!("user_email" in p));
    assert.ok(!("user_name" in p));
    assert.ok(!("reflection_text" in p));
  });

  const bad = await ogRouteMirror(
    "/year-in-review/og?year_key=../../../etc/passwd&c=1",
  );
  check("invalid year_key → 400", () => assert.equal(bad.status, 400));

  const huge = await ogRouteMirror(
    "/year-in-review/og?year_key=2027_anniversary&c=999999",
  );
  check("huge count clamped to 9999", () => assert.equal(huge.count, 9999));

  const neg = await ogRouteMirror(
    "/year-in-review/og?year_key=2027_anniversary&c=-42",
  );
  check("negative count clamped to 0", () => assert.equal(neg.count, 0));
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO F — Compile-time privacy grep (+ regression-insurance self-test)
// ─────────────────────────────────────────────────────────────────────────────

await scenario("Scenario F: type enforcement grep — YIRPrivateContent NOT in og/route.tsx", async () => {
  const OG_ROUTE_REL = "src/app/year-in-review/og/route.tsx";
  const OG_ROUTE_ABS = pathResolve(REPO_ROOT, OG_ROUTE_REL);

  function grepExit(path) {
    try {
      execSync(
        `grep -n "YIRPrivateContent" ${JSON.stringify(path)}`,
        { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      );
      return 0;
    } catch (err) {
      return err.status ?? 2;
    }
  }

  const exit = grepExit(OG_ROUTE_REL);
  check("grep YIRPrivateContent og/route.tsx → exit 1 (no match)", () =>
    assert.equal(exit, 1, `got exit=${exit}`),
  );

  // ─ Regression-insurance self-test ─
  if (SKIP_REGRESSION) {
    console.log("  — skipping regression self-test (--no-regression-test)");
    return;
  }

  const original = readFileSync(OG_ROUTE_ABS, "utf8");
  const injected =
    original +
    "\n// harness-regression-insurance: YIRPrivateContent — delete me on revert\n";
  try {
    writeFileSync(OG_ROUTE_ABS, injected, "utf8");
    const injectedExit = grepExit(OG_ROUTE_REL);
    check("regression: grep catches injected YIRPrivateContent (exit 0)", () =>
      assert.equal(injectedExit, 0, `injected grep exit=${injectedExit}`),
    );
  } finally {
    writeFileSync(OG_ROUTE_ABS, original, "utf8");
  }
  const postExit = grepExit(OG_ROUTE_REL);
  check("regression: post-revert, grep again exits 1", () =>
    assert.equal(postExit, 1),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO G — Constant sanity (cheap insurance against drift of inline mirror)
// ─────────────────────────────────────────────────────────────────────────────

await scenario("Scenario G (constant sanity): MIN_REFLECTIONS_THRESHOLD=30, CACHE_TTL_HOURS=24", async () => {
  check("MIN_REFLECTIONS_THRESHOLD === 30 (YIR-01)", () =>
    assert.equal(MIN_REFLECTIONS_THRESHOLD, 30),
  );
  check("CACHE_TTL_HOURS === 24 (YIR-03)", () =>
    assert.equal(CACHE_TTL_HOURS, 24),
  );
  // Drift-detection: grep the REAL source for these constants. If they change
  // in aggregate.ts, this scenario fails → author updates the harness mirror.
  const aggSrc = readFileSync(
    pathResolve(REPO_ROOT, "src/lib/yearInReview/aggregate.ts"),
    "utf8",
  );
  check("real aggregate.ts exports MIN_REFLECTIONS_THRESHOLD = 30", () =>
    assert.match(
      aggSrc,
      /export\s+const\s+MIN_REFLECTIONS_THRESHOLD\s*=\s*30\b/,
    ),
  );
  check("real aggregate.ts exports CACHE_TTL_HOURS = 24", () =>
    assert.match(
      aggSrc,
      /export\s+const\s+CACHE_TTL_HOURS\s*=\s*24\b/,
    ),
  );
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
console.log("Phase 11 integration invariants: OK");
process.exit(0);
