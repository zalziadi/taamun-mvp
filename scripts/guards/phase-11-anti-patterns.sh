#!/usr/bin/env bash
# scripts/guards/phase-11-anti-patterns.sh
#
# Phase 11 (Year-in-Review) anti-pattern sweep.
# Mirrors scripts/guards/phase-10-anti-patterns.sh — the ban-list targets the
# Phase 11 year-in-review code paths that must never grow Spotify-Wrapped
# copycat vocabulary, chart libraries, auto-share patterns, shaming/streak
# language, or privacy leaks via the private-body type identifier.
#
# Scope philosophy
#   Phase 11 bans apply to four path buckets:
#     BUCKET_OG     — src/app/year-in-review/og/route.tsx
#       (privacy — YIRPrivateContent must never appear here; also no DB/auth
#        imports — the endpoint is a public, query-param-only, edge route)
#     BUCKET_PAGE   — src/app/year-in-review/page.tsx, layout.tsx
#       (reflection content keys must never be referenced; no "use client")
#     BUCKET_UI     — src/components/YearInReviewArchive.tsx
#                   + src/components/AwarenessTrajectory.tsx
#       (no chart libs, no framer-motion, no navigator.share, no banned copy)
#     BUCKET_LIB    — src/lib/yearInReview/**
#       (YIRPrivateContent must only appear inside types.ts — never in
#        aggregate.ts / yearKey.ts — and never in anything outside the
#        yearInReview library)
#
# Plus two package.json checks:
#     - no chart library dependency installed
#     - "سنتي مع القرآن" title string appears in at least one Phase 11 file
#       (tone enforcement — YIR-05 / reflective framing)
#
# Wired into `npm run guard:release` AFTER `guard:phase-10` and BEFORE
# `npx tsc --noEmit`. Order matters for readable failure output.
#
# banned_terms (catalog — matches 11-CONTEXT.md "Banned anti-patterns"):
#   BUCKET_OG:
#     YIRPrivateContent — privacy (grep guarantee; type-split seal)
#     reflection_text|emotion_label|guide_message — private content keys
#     supabaseAdmin|requireUser|from ['\"]next/headers['\"]|@supabase/supabase-js
#     getYearInReview — edge-runtime route must not transitively pull Node deps
#   BUCKET_PAGE:
#     YIRPrivateContent (privacy)
#     reflection_text|emotion_label|guide_message (private keys)
#     "use client" on page.tsx — page MUST be a Server Component
#   BUCKET_UI:
#     chart libs: recharts|chart\.js|\bd3\b|victory|plotly|chartist
#     framer-motion import (restrained motion only — CSS transitions, no JS anim)
#     navigator\.share (custom share flow; no Web Share API upstream of /og)
#     Spotify-copycat / ranking / gamification vocabulary:
#       Wrapped|\branked\b|#1\s+of|top\s+[0-9]+%|\bcountdown\b|\bscarcity\b
#       auto-share|share\s+automatically|\bstreak\b|\blost\s+your\b
#       achievement\s+unlocked|badge\s+unlocked
#   BUCKET_LIB:
#     YIRPrivateContent appearing OUTSIDE types.ts inside src/lib/yearInReview/**
#
# Required-copy assertion:
#   "سنتي مع القرآن" MUST appear in either page.tsx or YearInReviewArchive.tsx
#   (tone enforcement — reflective framing per YIR-05 / CONTEXT §R4).
#
# Comment-line carve-out: lines whose content (after grep's leading
# `path:linenum:` prefix) starts with `*` or `//` after optional whitespace
# are skipped — JSDoc blocks documenting bans don't trip the guard, but
# banned strings inside real JSX / string literals / imports still match.
#
# Cost target: <5s. Pure POSIX grep — no ripgrep-only flags.

set -euo pipefail

# Resolve repo root regardless of cwd the script was invoked from.
REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

FAIL=0
VIOLATIONS=()

report() {
  FAIL=1
  VIOLATIONS+=("$1")
  echo "[phase-11-guard] $1" >&2
}

# Comment-line carve-out: strip lines whose content (after grep's leading
# `path:linenum:` prefix) starts with `*` or `//` after optional whitespace.
CARVE_OUT='([^:]+:[0-9]+:[[:space:]]*(\*|//))'

# ─────────────────────────────────────────────────────────────────────────────
# Path buckets — only grep paths that actually exist (avoids "No such file").
# ─────────────────────────────────────────────────────────────────────────────

BUCKET_OG=()
[ -f "src/app/year-in-review/og/route.tsx" ] \
  && BUCKET_OG+=("src/app/year-in-review/og/route.tsx")

BUCKET_PAGE=()
[ -f "src/app/year-in-review/page.tsx" ] \
  && BUCKET_PAGE+=("src/app/year-in-review/page.tsx")
[ -f "src/app/year-in-review/layout.tsx" ] \
  && BUCKET_PAGE+=("src/app/year-in-review/layout.tsx")

BUCKET_UI=()
[ -f "src/components/YearInReviewArchive.tsx" ] \
  && BUCKET_UI+=("src/components/YearInReviewArchive.tsx")
[ -f "src/components/AwarenessTrajectory.tsx" ] \
  && BUCKET_UI+=("src/components/AwarenessTrajectory.tsx")

BUCKET_LIB_DIR=""
[ -d "src/lib/yearInReview" ] && BUCKET_LIB_DIR="src/lib/yearInReview"

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_OG-1: privacy invariant — YIRPrivateContent must NEVER appear in the
# OG share card route. This is the PITFALL #10 compile-time guarantee.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BUCKET_OG[@]} -gt 0 ]; then
  if grep -nE 'YIRPrivateContent' "${BUCKET_OG[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[OG-privacy] YIRPrivateContent imported/referenced in share card route (PITFALL #10 violation)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_OG-2: private content keys must NEVER appear in the OG route.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BUCKET_OG[@]} -gt 0 ]; then
  if grep -nE '\breflection_text\b|\bemotion_label\b|\bguide_message\b' \
       "${BUCKET_OG[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[OG-keys] private content keys (reflection_text / emotion_label / guide_message) in share card route"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_OG-3: edge-runtime purity — the public OG endpoint must NOT import
# server-only DB/auth helpers. Query-param-only by design (NFR-04 edge + privacy).
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BUCKET_OG[@]} -gt 0 ]; then
  if grep -nE 'supabaseAdmin|requireUser|from[[:space:]]+['\''"]next/headers['\''"]|@supabase/supabase-js|getYearInReview' \
       "${BUCKET_OG[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[OG-runtime] server-only DB/auth/helper import in /og route (must be public, edge, query-param-only)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_PAGE-1: privacy — YIRPrivateContent never in page / layout.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BUCKET_PAGE[@]} -gt 0 ]; then
  if grep -nE 'YIRPrivateContent' "${BUCKET_PAGE[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[PAGE-privacy] YIRPrivateContent referenced in /year-in-review page or layout"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_PAGE-2: private content keys never in page / layout.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BUCKET_PAGE[@]} -gt 0 ]; then
  if grep -nE '\breflection_text\b|\bemotion_label\b|\bguide_message\b' \
       "${BUCKET_PAGE[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[PAGE-keys] private content keys in /year-in-review page or layout"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_PAGE-3: page.tsx MUST remain a Server Component — no "use client".
# ─────────────────────────────────────────────────────────────────────────────
if [ -f "src/app/year-in-review/page.tsx" ]; then
  # The directive is valid as the very first statement only; catch it on the
  # first non-comment line. A simpler check: grep for the exact literal.
  if grep -nE '^[[:space:]]*["'\'']use client["'\'']' \
       src/app/year-in-review/page.tsx 2>/dev/null ; then
    report "[PAGE-server] 'use client' on page.tsx — /year-in-review MUST be a Server Component"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_UI-1: no chart libraries — Phase 11 uses hand-rolled SVG (YIR-11).
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BUCKET_UI[@]} -gt 0 ]; then
  if grep -nE "from[[:space:]]+['\"]recharts['\"]|from[[:space:]]+['\"]chart\.js['\"]|from[[:space:]]+['\"]d3['\"]|from[[:space:]]+['\"]victory['\"]|from[[:space:]]+['\"]plotly['\"]|from[[:space:]]+['\"]chartist['\"]" \
       "${BUCKET_UI[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[UI-chart] chart library import in Phase 11 UI (YIR-11: hand-rolled SVG only)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_UI-2: no framer-motion imports in Phase 11 UI (restrained motion).
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BUCKET_UI[@]} -gt 0 ]; then
  if grep -nE "from[[:space:]]+['\"]framer-motion['\"]" \
       "${BUCKET_UI[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[UI-motion] framer-motion import in Phase 11 UI (restrained motion — CSS only)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_UI-3: no navigator.share — share flow is explicit <a href> tap.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BUCKET_UI[@]} -gt 0 ]; then
  if grep -nE 'navigator\.share\(' "${BUCKET_UI[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[UI-webshare] navigator.share() in Phase 11 UI (custom explicit-tap share flow only)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_UI-4: banned Spotify-copycat / ranking / gamification vocabulary.
# Case-sensitive except for the 'Wrapped' marker.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BUCKET_UI[@]} -gt 0 ]; then
  # Wrapped — Spotify copycat (case-sensitive, bounded)
  if grep -nE '\bWrapped\b' "${BUCKET_UI[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[UI-copy] 'Wrapped' (Spotify copycat) in Phase 11 UI"
  fi
  # ranked, #1 of, top X%, countdown, scarcity
  if grep -nE '\branked\b|#1[[:space:]]+of|top[[:space:]]+[0-9]+%|\bcountdown\b|\bscarcity\b' \
       "${BUCKET_UI[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[UI-rank] ranking / top-percentile / countdown / scarcity vocabulary in Phase 11 UI"
  fi
  # auto-share / share automatically
  if grep -nE 'auto-share|share[[:space:]]+automatically' \
       "${BUCKET_UI[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[UI-autoshare] auto-share vocabulary in Phase 11 UI (explicit tap only)"
  fi
  # streak / lost your
  if grep -nE '\bstreak\b|\blost[[:space:]]+your\b' \
       "${BUCKET_UI[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[UI-streak] streak / loss-aversion vocabulary in Phase 11 UI"
  fi
  # achievement unlocked / badge unlocked
  if grep -nE 'achievement[[:space:]]+unlocked|badge[[:space:]]+unlocked' \
       "${BUCKET_UI[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[UI-gami] gamified unlock vocabulary in Phase 11 UI"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_LIB: YIRPrivateContent must live ONLY in types.ts inside yearInReview/.
# Anywhere else inside the library (aggregate.ts, yearKey.ts, *.test.ts) is a
# violation — the type-split privacy seal.
# ─────────────────────────────────────────────────────────────────────────────
if [ -n "$BUCKET_LIB_DIR" ]; then
  # Find every file in src/lib/yearInReview that mentions YIRPrivateContent
  # and is NOT types.ts. types.test.ts is allowed (it asserts the compile-time
  # disjointness and uses @ts-expect-error guards — the identifier appears
  # inside assertion-only contexts by design).
  LIB_HITS=$(grep -rnE 'YIRPrivateContent' "$BUCKET_LIB_DIR" 2>/dev/null \
    | grep -vE "$CARVE_OUT" \
    | grep -vE '(^|/)types\.ts:' \
    | grep -vE '(^|/)types\.test\.ts:' \
    || true)
  if [ -n "$LIB_HITS" ]; then
    echo "$LIB_HITS" >&2
    report "[LIB-seal] YIRPrivateContent appears outside types.ts inside src/lib/yearInReview/"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# package.json — no chart library dependency installed (YIR-11, NFR-08).
# ─────────────────────────────────────────────────────────────────────────────
if [ -f "package.json" ]; then
  if grep -nE '"(recharts|chart\.js|d3|chartist|plotly|victory)":[[:space:]]*"' \
       package.json 2>/dev/null ; then
    report "[pkg-chart] chart library dependency declared in package.json (YIR-11: hand-rolled SVG only)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Required-copy assertion — reflective title "سنتي مع القرآن" MUST appear in
# either the page or the archive component (tone enforcement).
# ─────────────────────────────────────────────────────────────────────────────
TITLE_FOUND=0
for candidate in \
  "src/app/year-in-review/page.tsx" \
  "src/components/YearInReviewArchive.tsx" \
  "src/app/year-in-review/layout.tsx" ; do
  if [ -f "$candidate" ] && grep -q "سنتي مع القرآن" "$candidate" 2>/dev/null ; then
    TITLE_FOUND=1
    break
  fi
done
if [ "$TITLE_FOUND" -eq 0 ]; then
  report "[copy-title] reflective title 'سنتي مع القرآن' missing from page.tsx / archive / layout (YIR-05 tone)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
if [ "$FAIL" -ne 0 ]; then
  echo "" >&2
  echo "[phase-11-guard] FAIL — ${#VIOLATIONS[@]} violation(s) above" >&2
  exit 1
fi
echo "[phase-11-guard] PASS — zero banned patterns found"
exit 0
