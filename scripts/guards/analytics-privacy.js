#!/usr/bin/env node
/**
 * ANALYTICS privacy guard — ANALYTICS-09, ANALYTICS-10, ANALYTICS-12.
 *
 * Fails the build if:
 *   - R1 (ANALYTICS-09): A `track(` or `posthog.capture(` call appears inside a sacred path
 *   - R2 (ANALYTICS-10): A `track(` or `posthog.capture(` call appears inside one of the 7 sacred components
 *   - R3 (ANALYTICS-12): An event property name matches a banned PII-shape pattern
 *
 * No external npm deps — pure `fs` + `path`. Matches existing guard pattern
 * (scripts/guards/brand.js, runtime.js, metadata.js).
 *
 * Reference: .planning/phases/06-posthog-event-instrumentation/06-CONTEXT.md
 */

"use strict";

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "../..");

// Sacred path prefixes (relative to repo root) — ANALYTICS-09
const SACRED_PATHS = [
  "src/app/day",
  "src/app/reflection",
  "src/app/book",
  "src/app/program/day",
  "src/app/api/guide",
  "src/app/guide",
];

// Sacred component files (exact basenames) — ANALYTICS-10
const SACRED_COMPONENTS = new Set([
  "DayExperience.tsx",
  "ReflectionJournal.tsx",
  "AwarenessMeter.tsx",
  "BookQuote.tsx",
  "VerseBlock.tsx",
  "HiddenLayer.tsx",
  "SilenceGate.tsx",
]);

// Banned property-name patterns — ANALYTICS-12
// Keep in sync with src/lib/analytics/events.ts BANNED_PROPERTY_PATTERNS.
// Matches `foo_email: ...`, `reflection_text: ...`, etc. within object literals.
const BANNED_PROPERTY_REGEX = [
  /\b([a-zA-Z0-9_]*_email)\s*:/g,
  /\b([a-zA-Z0-9_]*_phone)\s*:/g,
  /\b(reflection_[a-zA-Z0-9_]+)\s*:/g,
  /\b(verse_[a-zA-Z0-9_]+)\s*:/g,
  /\b(journal_[a-zA-Z0-9_]+)\s*:/g,
  /\b(message_[a-zA-Z0-9_]+)\s*:/g,
  /\b(prayer_[a-zA-Z0-9_]+)\s*:/g,
];

// Files exempt from property-pattern scan.
// These files define the patterns as literals (for runtime check or grep match)
// so they will always "contain" the forbidden names — scanning them would be circular.
const PROPERTY_SCAN_EXEMPT = new Set([
  "src/lib/analytics/events.ts",
  "src/lib/analytics/events.test.ts",
  "scripts/guards/analytics-privacy.js",
]);

// track() / posthog.capture() detection regex for R1/R2 (sacred path/component).
// `\b` ensures we don't match `.track(` on unrelated identifiers like `.backtrack(`.
// For R3 scoping we use `extractEmitCallArgs` which ALSO covers `emitEvent(`.
const TRACK_CALL_REGEX = /\btrack\s*\(|\bposthog\.capture\s*\(/;

// Directories to skip entirely during walk.
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
  ".vercel",
  ".turbo",
]);

const SCAN_EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

const violations = [];
let scannedFiles = 0;

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full);
    } else if (entry.isFile() && SCAN_EXTENSIONS.test(entry.name)) {
      scanFile(full);
    }
  }
}

function scanFile(absPath) {
  scannedFiles++;
  const rel = path.relative(REPO_ROOT, absPath).replace(/\\/g, "/");

  // The guard script itself is exempt from EVERY rule — it holds the patterns
  // as literals for detection.
  if (rel === "scripts/guards/analytics-privacy.js") return;

  const content = fs.readFileSync(absPath, "utf8");
  const lines = content.split("\n");

  const inSacredPath = SACRED_PATHS.some(
    (p) => rel === p || rel.startsWith(`${p}/`)
  );
  const isSacredComponent = SACRED_COMPONENTS.has(path.basename(rel));

  const propertyScanExempt = PROPERTY_SCAN_EXEMPT.has(rel);

  // Rule 1 + 2: no track()/posthog.capture( in sacred paths or components.
  // Line-based scan — these rules are about the CALL, not its body.
  if (inSacredPath || isSacredComponent) {
    for (let i = 0; i < lines.length; i++) {
      if (TRACK_CALL_REGEX.test(lines[i])) {
        violations.push({
          file: rel,
          line: i + 1,
          rule: inSacredPath ? "ANALYTICS-09" : "ANALYTICS-10",
          message: `Tracking call inside sacred ${
            inSacredPath ? "path" : "component"
          } — ${lines[i].trim()}`,
        });
      }
    }
  }

  // Rule 3 scoping: R3 only fires for banned property names that appear
  // WITHIN an emit/track/posthog.capture call's argument list.
  // Free-floating object literals elsewhere (`.insert({ used_email })`,
  // `.update({ verse_ref })`, `fetch(..., { body: { user_email }})`)
  // are NOT violations — those are DB/API calls unrelated to analytics.
  //
  // Strategy: find each emit call, walk characters with proper paren-depth
  // tracking (skipping string literals and comments), and extract the full
  // argument-list substring. Then test banned-property regex on that
  // substring, computing the (line, col) back from the absolute index.
  if (!propertyScanExempt) {
    const emitBlocks = extractEmitCallArgs(content);
    for (const block of emitBlocks) {
      for (const re of BANNED_PROPERTY_REGEX) {
        const localBanRe = new RegExp(re.source, "g");
        let bm;
        while ((bm = localBanRe.exec(block.args)) !== null) {
          const absIdx = block.argsStart + bm.index;
          const lineNo = lineNumberOf(content, absIdx);
          violations.push({
            file: rel,
            line: lineNo,
            rule: "ANALYTICS-12",
            message: `Banned property name "${bm[1]}" inside analytics call — PII must never reach PostHog. See 06-CONTEXT.md §"Property whitelist".`,
          });
        }
      }
    }
  }
}

/**
 * Find every `emitEvent(…)` / `track(…)` / `posthog.capture(…)` call in `src`
 * and return the substring inside the outermost parens, plus its start offset.
 *
 * Skips string literals (single, double, backtick) and line/block comments so
 * parens inside them don't throw off depth. Not a full JS parser, but handles
 * the common cases this guard needs to catch.
 */
function extractEmitCallArgs(src) {
  const results = [];
  const openRe = /\b(?:emitEvent|track|posthog\.capture)\s*\(/g;
  let m;
  while ((m = openRe.exec(src)) !== null) {
    const openIdx = m.index + m[0].length - 1; // index of `(`
    const argsStart = openIdx + 1;
    const end = findMatchingParen(src, openIdx);
    if (end < 0) continue; // malformed — skip
    results.push({
      argsStart,
      args: src.slice(argsStart, end),
    });
    openRe.lastIndex = end + 1;
  }
  return results;
}

/**
 * Given `src` and the index of an opening `(`, return the index of its
 * matching `)`, or -1 if not found. Skips strings + comments.
 */
function findMatchingParen(src, openIdx) {
  let depth = 0;
  let i = openIdx;
  const len = src.length;
  while (i < len) {
    const ch = src[i];
    const next = src[i + 1];

    // Line comment
    if (ch === "/" && next === "/") {
      const nl = src.indexOf("\n", i + 2);
      i = nl < 0 ? len : nl + 1;
      continue;
    }
    // Block comment
    if (ch === "/" && next === "*") {
      const close = src.indexOf("*/", i + 2);
      i = close < 0 ? len : close + 2;
      continue;
    }
    // String literals — single/double/backtick. Handle escapes.
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i++;
      while (i < len) {
        const c = src[i];
        if (c === "\\") {
          i += 2;
          continue;
        }
        if (c === quote) {
          i++;
          break;
        }
        // Template-literal ${...} — skip nested expression.
        if (quote === "`" && c === "$" && src[i + 1] === "{") {
          let d = 1;
          i += 2;
          while (i < len && d > 0) {
            if (src[i] === "{") d++;
            else if (src[i] === "}") d--;
            i++;
          }
          continue;
        }
        i++;
      }
      continue;
    }

    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return -1;
}

/** 1-indexed line number of absolute offset `idx` within `src`. */
function lineNumberOf(src, idx) {
  let line = 1;
  for (let i = 0; i < idx && i < src.length; i++) {
    if (src[i] === "\n") line++;
  }
  return line;
}

walk(path.join(REPO_ROOT, "src"));

if (violations.length > 0) {
  console.error("");
  console.error("✗ ANALYTICS PRIVACY GUARD FAILED");
  console.error("");
  for (const v of violations) {
    console.error(`  VIOLATION [${v.rule}] ${v.file}:${v.line}`);
    console.error(`    ${v.message}`);
  }
  console.error("");
  console.error(
    `Total: ${violations.length} violation(s) across ${scannedFiles} file(s).`
  );
  console.error(
    "See: .planning/phases/06-posthog-event-instrumentation/06-CONTEXT.md"
  );
  process.exit(1);
}

console.log(`✓ analytics privacy guard passed (${scannedFiles} files scanned)`);
process.exit(0);
