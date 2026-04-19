#!/usr/bin/env bash
# scripts/guards/phase-07-anti-patterns.sh
#
# Phase 7 anti-pattern sweep.
# Exits non-zero if any banned pattern from .planning/phases/07-cycle-2-transition
# /07-CONTEXT.md "Banned anti-patterns" is introduced in a sacred path.
#
# Scope philosophy
#   The ban applies to the Day-28 sacred path and badge surface, NOT to
#   library code that happens to use a word like `streak` as a metric name.
#   Checks are deliberately scoped so legitimate infrastructure (e.g.
#   src/lib/streak.ts, src/lib/personalityEngine.ts progress.streak) is not
#   tripped — only user-facing vocabulary + imports inside sacred components.
#
# Cost target: <5 seconds. Pure POSIX grep, no ripgrep-only flags.
# Wired into npm run guard:release after lint:analytics-privacy.
#
# banned_terms (catalog — matches 07-CONTEXT.md "Banned anti-patterns"):
#   canvas-confetti · lottie-react · lottie · party-js · tsparticles
#   Unlocked! · Achievement · Level Up · Mission Accomplished
#   streak! · "🔥 N days streak"
#   <Dialog · <Modal · <Drawer · <Popover (inside sacred paths)
#   next/og / opengraph-image / ImageResponse (on badge surface)
#   posthog.capture · track( (inside sacred paths)
#   useEffect auto-advancing to /api/program/start-cycle

set -euo pipefail

# Resolve repo root regardless of cwd the script was invoked from.
REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

FAIL=0
VIOLATIONS=()

report() {
  FAIL=1
  VIOLATIONS+=("$1")
  echo "[phase-07-guard] $1" >&2
}

# Shared grep excludes — never scan planning docs, node_modules, build output,
# docs prose, the scripts directory itself (so this file doesn't self-match),
# or supabase migrations (SQL).
EXCLUDES=(
  --exclude-dir=.planning
  --exclude-dir=node_modules
  --exclude-dir=.next
  --exclude-dir=docs
  --exclude-dir=scripts
  --exclude-dir=supabase
  --exclude-dir=.git
  --exclude-dir=public
)

# Sacred paths (Phase 7 definition) — where the no-modal + no-client-analytics
# + tonal invariants apply most strictly.
SACRED_PATHS=(
  "src/app/day"
  "src/app/reflection"
  "src/app/book"
  "src/app/program/day"
  "src/app/api/guide"
  "src/app/guide"
  "src/components/DayExperience.tsx"
  "src/components/ReflectionJournal.tsx"
  "src/components/AwarenessMeter.tsx"
  "src/components/VerseBlock.tsx"
  "src/components/HiddenLayer.tsx"
  "src/components/BookQuote.tsx"
  "src/components/SilenceGate.tsx"
  "src/components/badges"
)

# Only feed grep paths that actually exist (avoids "No such file" noise).
SACRED_EXTANT=()
for p in "${SACRED_PATHS[@]}"; do
  [ -e "$p" ] && SACRED_EXTANT+=("$p")
done

# ─────────────────────────────────────────────────────────────────────────────
# Check 1: banned animation libraries in source imports (repo-wide).
# ─────────────────────────────────────────────────────────────────────────────
# Matches `from "canvas-confetti"`, `from 'lottie-react'`, etc. We look for
# the `from "…"` import form so a prose comment saying "no confetti" does
# not trip the guard.
if grep -rnE "from[[:space:]]+['\"](canvas-confetti|lottie-react|lottie|party-js|tsparticles)['\"]" \
     "${EXCLUDES[@]}" src/ 2>/dev/null; then
  report "Banned animation library imported (confetti / lottie / party-js / tsparticles)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Check 2: banned English-loan user-facing vocabulary (sacred paths only).
# ─────────────────────────────────────────────────────────────────────────────
# Scope: only sacred components + day/program/book/guide routes. Enterprise
# library code that uses "streak" as a metric is not in scope — the ban is
# on the Day-28 / badge reveal tonal surface.
#
# Patterns target user-facing COPY: JSX text, string literals, className
# display strings. We look for quoted forms to avoid false positives on
# structural TypeScript prop names (`unlocked: boolean`, `streak: number`).
if [ ${#SACRED_EXTANT[@]} -gt 0 ]; then
  # Banned quoted strings (single OR double quoted) containing English-loan
  # vocabulary in user-facing form.
  VOCAB_PATTERN='"[^"]*(Unlocked!|Achievement|Level Up|Mission Accomplished|unlock!|achievement!|level up!)[^"]*"|'"'"'[^'"'"']*(Unlocked!|Achievement|Level Up|Mission Accomplished|unlock!|achievement!|level up!)[^'"'"']*'"'"''
  if grep -rniE "$VOCAB_PATTERN" "${SACRED_EXTANT[@]}" 2>/dev/null; then
    report "User-facing English-loan vocabulary (Unlocked! / Achievement / Level Up) in a sacred path"
  fi

  # Banned "streak continuation UI" — only flag the actual UX string
  # "X days streak" / fire emoji + streak. Does NOT flag `streak: number`.
  if grep -rnE '🔥[[:space:]]*[0-9]+[[:space:]]*days?[[:space:]]*streak|[0-9]+[[:space:]]*days?[[:space:]]*streak!|streak!' \
       "${SACRED_EXTANT[@]}" 2>/dev/null; then
    report "Streak continuation UI string in a sacred path"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Check 3: modal / dialog / drawer / popover inside sacred components.
# ─────────────────────────────────────────────────────────────────────────────
# JSX opening tags; we only flag on sacred paths. Plan 07.03 explicitly
# forbids modal interruption on Day-28.
if [ ${#SACRED_EXTANT[@]} -gt 0 ]; then
  if grep -rnE "<(Dialog|Modal|Drawer|Popover)[[:space:]>]" "${SACRED_EXTANT[@]}" 2>/dev/null; then
    report "Modal / Dialog / Drawer / Popover component inside a sacred path"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Check 4: badge surface must not carry a share / OpenGraph export.
# ─────────────────────────────────────────────────────────────────────────────
# REQUIREMENTS.md BADGE-04: badges are private-by-default.
BADGE_PATHS=()
[ -d "src/components/badges" ] && BADGE_PATHS+=("src/components/badges")
[ -d "src/app/api/badges" ] && BADGE_PATHS+=("src/app/api/badges")

if [ ${#BADGE_PATHS[@]} -gt 0 ]; then
  if grep -rnE "from[[:space:]]+['\"]next/og['\"]|opengraph-image|ImageResponse" \
       "${BADGE_PATHS[@]}" 2>/dev/null; then
    report "Share / next/og / ImageResponse export on badge surface (BADGE-04 violation)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Check 5: client-side PostHog emission on sacred paths.
# ─────────────────────────────────────────────────────────────────────────────
# All analytics on sacred paths MUST go through server-side emitEvent. This
# overlaps with scripts/guards/analytics-privacy.js but gives Phase 7 its own
# explicit enforcement line.
if [ ${#SACRED_EXTANT[@]} -gt 0 ]; then
  if grep -rnE "posthog\.capture\(|(^|[^a-zA-Z_])track\(" \
       "${SACRED_EXTANT[@]}" 2>/dev/null; then
    report "Client-side analytics (posthog.capture / track()) in a sacred path"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Check 6: auto-advance to cycle 2 via useEffect — Plan 07.03 bans this.
# ─────────────────────────────────────────────────────────────────────────────
# Heuristic: same file contains BOTH `useEffect` AND a POST to start-cycle.
# Only fires in the two files where the CTA legitimately lives.
CANDIDATES=(
  "src/components/DayExperience.tsx"
)
for f in "${CANDIDATES[@]}"; do
  [ -e "$f" ] || continue
  # A useEffect that invokes start-cycle (without a click handler) is the
  # pattern we want to catch. Here we flag the narrow case of useEffect(...)
  # whose body references "start-cycle".
  if awk '
    /useEffect\(/       { in_effect = 1; brace = 0 }
    in_effect           {
                          for (i=1; i<=length($0); i++) {
                            c = substr($0, i, 1)
                            if (c == "{") brace++
                            else if (c == "}") {
                              brace--
                              if (brace <= 0) { in_effect = 0; break }
                            }
                          }
                          if ($0 ~ /start-cycle/) { print NR": "$0; found=1 }
                        }
    END                 { exit found ? 0 : 1 }
  ' "$f" 2>/dev/null; then
    report "useEffect in $f auto-advances to /api/program/start-cycle (Plan 07.03 ban)"
  fi
done

# ─────────────────────────────────────────────────────────────────────────────
# Summary.
# ─────────────────────────────────────────────────────────────────────────────
if [ "$FAIL" -ne 0 ]; then
  echo "" >&2
  echo "[phase-07-guard] FAIL — ${#VIOLATIONS[@]} violation(s) above" >&2
  exit 1
fi
echo "[phase-07-guard] PASS — zero banned patterns found"
exit 0
