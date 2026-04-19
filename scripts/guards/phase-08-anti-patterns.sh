#!/usr/bin/env bash
# scripts/guards/phase-08-anti-patterns.sh
#
# Phase 8 anti-pattern sweep.
# Mirrors scripts/guards/phase-07-anti-patterns.sh; the ban-list targets the
# Phase 8 badge surface + sacred API paths that must never grow a confetti
# import, a share button, a modal, English-loan "Unlocked!" vocabulary, or a
# direct posthog.capture() on the reflection/start-cycle code paths.
#
# Scope philosophy
#   Phase 8 bans apply to three path buckets:
#     BADGE_PATHS           — src/components/badges/** + src/app/api/badges/**
#     PROGRESS_PAGE         — src/app/progress/**
#     SACRED_API_PATHS      — src/app/api/reflections/** + src/app/api/program/start-cycle/**
#     BADGE_HELPER_PATHS    — src/lib/badges/**
#   The ban targets USER-FACING COPY, IMPORTS, and COMPONENT USAGE — not
#   structural TypeScript (e.g. `unlocked: boolean` prop name) per the 07.04
#   Rule 1 precedent.
#
# Wired into `npm run guard:release` after `guard:phase-07` — order matters:
# Phase 7 guard runs first, then this one. Both must pass before tsc + build.
#
# banned_terms (catalog — matches 08-CONTEXT.md "Banned anti-patterns"):
#   BADGE/PROGRESS paths:
#     canvas-confetti · lottie-react · lottie · party-js · tsparticles
#     next/og · ImageResponse · opengraph-image · onShare · share-card
#     <Dialog · <Modal · <Drawer · <Sheet · <Popover
#     Unlocked! · Achievement · Streak · Level up · rarity · legendary · epic · mythic
#     🔥 emoji streak · "N of M unlocked" / "N% unlocked" (progress-bar copy)
#   SACRED_API paths (reflections + start-cycle + badge helper):
#     posthog.capture · track( (server must route through emitEvent only)
#     sendPush · push_notification · scheduleBadgeNotif (no push on unlock)
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
  echo "[phase-08-guard] $1" >&2
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
  --exclude-dir=tests
)

# ─────────────────────────────────────────────────────────────────────────────
# Path buckets — only grep paths that actually exist (avoids "No such file").
# ─────────────────────────────────────────────────────────────────────────────

# Bucket 1: badge component tree (strictest — no modal, no share, no animation lib)
BADGE_PATHS=()
[ -d "src/components/badges" ] && BADGE_PATHS+=("src/components/badges")
[ -d "src/app/api/badges" ] && BADGE_PATHS+=("src/app/api/badges")

# Bucket 2: /progress page (grid renders badges; same modal/share ban applies)
PROGRESS_PATHS=()
[ -d "src/app/progress" ] && PROGRESS_PATHS+=("src/app/progress")

# Bucket 3: sacred API paths (reflection save + cycle transition) — no direct
# analytics calls, no push on badge unlock.
SACRED_API_PATHS=()
[ -d "src/app/api/reflections" ] && SACRED_API_PATHS+=("src/app/api/reflections")
[ -d "src/app/api/program/start-cycle" ] && SACRED_API_PATHS+=("src/app/api/program/start-cycle")

# Bucket 4: badge helper (no direct push notification on unlock)
BADGE_HELPER_PATHS=()
[ -d "src/lib/badges" ] && BADGE_HELPER_PATHS+=("src/lib/badges")

# Union helper buckets for convenience
BADGE_GRID_PATHS=("${BADGE_PATHS[@]}" "${PROGRESS_PATHS[@]}")

# ─────────────────────────────────────────────────────────────────────────────
# Check 1: banned animation libraries imported inside the badge component
# tree. Phase 7 handles repo-wide coverage for these libs; Phase 8's guard
# re-asserts it narrowly on the badge surface (so a legitimate import outside
# the badge tree — if ever needed — isn't blocked here, only by Phase 7).
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BADGE_GRID_PATHS[@]} -gt 0 ]; then
  if grep -rnE "from[[:space:]]+['\"](canvas-confetti|lottie-react|lottie|party-js|tsparticles)['\"]" \
       "${BADGE_GRID_PATHS[@]}" 2>/dev/null; then
    report "Banned animation library imported inside badge/progress tree (confetti/lottie/party-js/tsparticles)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Check 2: share / next/og / opengraph / ImageResponse on the badge surface.
# REQUIREMENTS.md BADGE-04 — badges are private-by-default, no social export.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BADGE_GRID_PATHS[@]} -gt 0 ]; then
  if grep -rnE "from[[:space:]]+['\"]next/og['\"]|opengraph-image|ImageResponse|\\bonShare\\b|share-card" \
       "${BADGE_GRID_PATHS[@]}" 2>/dev/null; then
    report "Share / next/og / ImageResponse / onShare on badge or /progress surface (BADGE-04)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Check 3: modal / dialog / drawer / sheet / popover inside badge tree or
# /progress page. BADGE-09 — no modal interrupting flow on badge click.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BADGE_GRID_PATHS[@]} -gt 0 ]; then
  if grep -rnE "<(Dialog|Modal|Drawer|Sheet|Popover)[[:space:]>]" \
       "${BADGE_GRID_PATHS[@]}" 2>/dev/null; then
    report "Modal / Dialog / Drawer / Sheet / Popover inside badge tree or /progress (BADGE-09)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Check 4: banned English-loan user-facing vocabulary inside badge tree or
# /progress. Patterns target QUOTED user-facing copy (JSX text, string
# literals) — not structural TypeScript, and NOT JSDoc/line comments that
# legitimately document bans for future maintainers (precedent: MilestoneBadge
# docblock at 08.01 + BadgeGrid affirmative docstring at 08.05). The vocab ban
# is on `Unlocked!` (with exclamation) + `Achievement`/`Streak`/`Level up` —
# a prop name `unlocked: boolean` is NOT flagged (07.04 Rule 1 deviation).
#
# Comment-line carve-out: lines whose first non-whitespace character is `*` or
# `//` are skipped. This is how JSDoc continuations (` * ...`), single-line
# comments (`// ...`), and block-comment bodies present in the source — the
# ban then only catches vocab that actually reaches the USER (JSX text / JS
# string literals). A determined regression would have to put the banned
# vocab inside a real string literal, which is exactly what we want to catch.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BADGE_GRID_PATHS[@]} -gt 0 ]; then
  VOCAB_PATTERN='"[^"]*(Unlocked!|Achievement|Streak|Level up|legendary|epic|mythic|rarity)[^"]*"|'"'"'[^'"'"']*(Unlocked!|Achievement|Streak|Level up|legendary|epic|mythic|rarity)[^'"'"']*'"'"''
  # Strip comment lines (lines starting with `*` or `//` after optional
  # whitespace) before running the vocab grep. `grep -v` excludes matches.
  if grep -rniE "$VOCAB_PATTERN" "${BADGE_GRID_PATHS[@]}" 2>/dev/null \
       | grep -vE ':[[:space:]]*\*|:[[:space:]]*//' ; then
    report "English-loan vocabulary (Unlocked!/Achievement/Streak/Level up/rarity/legendary/epic/mythic) in badge tree or /progress (user-facing string)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Check 5: streak UI tokens — 🔥 emoji adjacent to "days streak" copy, or a
# "streak!" exclaimed literal. Narrow pattern — `streak: number` structural
# prop is untouched.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BADGE_GRID_PATHS[@]} -gt 0 ]; then
  if grep -rnE '🔥[[:space:]]*[0-9]+[[:space:]]*days?[[:space:]]*streak|[0-9]+[[:space:]]*days?[[:space:]]*streak!|streak!' \
       "${BADGE_GRID_PATHS[@]}" 2>/dev/null; then
    report "Streak continuation UI token in badge tree or /progress"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Check 6: progress-bar copy. Shapes like "3 of 7 unlocked" or "43% unlocked"
# are anti-gamification per 08-CONTEXT banned list.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BADGE_GRID_PATHS[@]} -gt 0 ]; then
  if grep -rniE '[0-9]+[[:space:]]+of[[:space:]]+[0-9]+[[:space:]]+unlocked|[0-9]+%[[:space:]]+unlocked' \
       "${BADGE_GRID_PATHS[@]}" 2>/dev/null; then
    report "Progress-bar copy ('N of M unlocked' / 'N% unlocked') in badge tree or /progress"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Check 7: direct client-side analytics on sacred API paths. All analytics on
# the reflection save + cycle transition + badge helper MUST go through the
# server-side emitEvent helper. Overlaps with scripts/guards/analytics-privacy.js
# but gives Phase 8 its own explicit enforcement line.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#SACRED_API_PATHS[@]} -gt 0 ]; then
  if grep -rnE "posthog\.capture\(|(^|[^a-zA-Z_])track\(" \
       "${SACRED_API_PATHS[@]}" 2>/dev/null; then
    report "Direct posthog.capture() / track() on sacred API path (use emitEvent helper)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Check 8: no push notification on badge unlock. The helper + callers must
# NEVER schedule a push on a badge row insertion — BADGE-09 silent reveal.
# ─────────────────────────────────────────────────────────────────────────────
PUSH_SCAN_PATHS=("${SACRED_API_PATHS[@]}" "${BADGE_HELPER_PATHS[@]}")
if [ ${#PUSH_SCAN_PATHS[@]} -gt 0 ]; then
  if grep -rnE "\\bsendPush\\b|\\bpush_notification\\b|\\bscheduleBadgeNotif\\b" \
       "${PUSH_SCAN_PATHS[@]}" 2>/dev/null; then
    report "Push notification on badge unlock (sendPush/push_notification/scheduleBadgeNotif) — BADGE-09 silent reveal"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Summary.
# ─────────────────────────────────────────────────────────────────────────────
if [ "$FAIL" -ne 0 ]; then
  echo "" >&2
  echo "[phase-08-guard] FAIL — ${#VIOLATIONS[@]} violation(s) above" >&2
  exit 1
fi
echo "[phase-08-guard] PASS — zero banned patterns found"
exit 0
