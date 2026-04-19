#!/usr/bin/env bash
# scripts/guards/phase-09-anti-patterns.sh
#
# Phase 9 (Renewal Prompts In-App) anti-pattern sweep.
# Mirrors scripts/guards/phase-07-anti-patterns.sh and
# scripts/guards/phase-08-anti-patterns.sh — the ban-list targets the Phase 9
# renewal code paths that must never grow guilt/loss-aversion copy, countdown
# timers, modal interstitials, direct posthog.capture calls, fixed-inset
# fullscreen overlays, or framer-motion imports.
#
# Scope philosophy
#   Phase 9 bans apply to three path buckets:
#     RENEWAL_COMPONENT_PATHS — src/components/RenewalBanner.tsx
#                              + src/components/renewalBannerHelpers.ts
#     RENEWAL_API_PATHS      — src/app/api/renewal/**
#     RENEWAL_LIB_PATHS      — src/lib/renewal/**
#   Narrow on purpose — legitimate banner-adjacent code outside these paths
#   (e.g. docs, test harnesses in scripts/) must not trip this guard.
#
# Wired into `npm run guard:release` AFTER `guard:phase-08` and BEFORE
# `npx tsc --noEmit`. Order matters for readable failure output.
#
# banned_terms (catalog — matches 09-CONTEXT.md "Banned anti-patterns"):
#   COPY / LOSS-AVERSION:
#     لا تفقد · لن تستطيع الوصول · Don't lose · don't lose · dont lose
#   COUNTDOWN / SCARCITY:
#     setInterval · countdown / Countdown
#   MODAL / INTERSTITIAL:
#     <Dialog · <Modal · @radix-ui/react-dialog · components/ui/dialog
#     components/ui/modal · fixed inset-0 (fullscreen overlay pattern)
#   ANALYTICS:
#     posthog.capture( · bare track( (must route via @/lib/analytics server path)
#   ANIMATION (scope-narrowed):
#     framer-motion imports inside the 3 Phase-9 buckets (subtle CSS-only per
#     09-CONTEXT)
#
# Comment-line carve-out: lines whose first non-whitespace character is `*`
# or `//` are skipped — JSDoc blocks documenting bans (precedent from Phase 8
# guard) don't trip the guard, but any banned string inside real JSX / string
# literals / imports still matches.
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
  echo "[phase-09-guard] $1" >&2
}

# Comment-line carve-out: strip lines whose content (after grep's leading
# `path:linenum:` prefix) starts with `*` or `//` after optional whitespace.
# This lets JSDoc headers reference banned strings for documentation purposes
# while still catching real violations in JSX / string literals / imports.
CARVE_OUT='([^:]+:[0-9]+:[[:space:]]*(\*|//))'

# ─────────────────────────────────────────────────────────────────────────────
# Path buckets — only grep paths that actually exist (avoids "No such file").
# ─────────────────────────────────────────────────────────────────────────────

RENEWAL_COMPONENT_PATHS=()
[ -f "src/components/RenewalBanner.tsx" ] \
  && RENEWAL_COMPONENT_PATHS+=("src/components/RenewalBanner.tsx")
[ -f "src/components/renewalBannerHelpers.ts" ] \
  && RENEWAL_COMPONENT_PATHS+=("src/components/renewalBannerHelpers.ts")

RENEWAL_API_PATHS=()
[ -d "src/app/api/renewal" ] && RENEWAL_API_PATHS+=("src/app/api/renewal")

RENEWAL_LIB_PATHS=()
[ -d "src/lib/renewal" ] && RENEWAL_LIB_PATHS+=("src/lib/renewal")

# Union of every Phase-9 code path for the broadest bans.
ALL_PHASE9_PATHS=(
  "${RENEWAL_COMPONENT_PATHS[@]}"
  "${RENEWAL_API_PATHS[@]}"
  "${RENEWAL_LIB_PATHS[@]}"
)

# ─────────────────────────────────────────────────────────────────────────────
# Check 1: Guilt / loss-aversion copy anywhere in Phase 9 code.
# Pattern specifically bans "لا تفقد", "لن تستطيع الوصول" (the exact REQ-02
# anti-copy), "Don't lose" / "don't lose" / "dont lose" (English loan or typo).
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#ALL_PHASE9_PATHS[@]} -gt 0 ]; then
  # Note: Arabic strings embed inside grep extended regex; -i normalises
  # English case so "Don't lose" / "don't lose" / "DONT LOSE" all match.
  LOSS_PATTERN='لا تفقد|لن تستطيع الوصول|Don'"'"'?t lose|dont lose'
  if grep -rniE "$LOSS_PATTERN" "${ALL_PHASE9_PATHS[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "Guilt / loss-aversion copy ('لا تفقد' / 'لن تستطيع الوصول' / 'Don't lose' / 'dont lose') in Phase 9 code path"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Check 2: Countdown-timer / scarcity-urgency patterns in Phase 9 code.
# `setInterval(` is a narrow but accurate proxy — the Phase 9 surface has NO
# legitimate use for setInterval in RenewalBanner, shouldShow, or
# refreshEntitlement. `countdown` / `Countdown` catches component imports.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#ALL_PHASE9_PATHS[@]} -gt 0 ]; then
  if grep -rnE 'setInterval\(|[Cc]ountdown' \
       "${ALL_PHASE9_PATHS[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "Countdown timer / scarcity-urgency pattern (setInterval / Countdown) in Phase 9 code path"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Check 3: Modal / Dialog library usage inside the banner component.
# Phase 9 banner is a STRIP, not a modal — no Dialog / Modal JSX tags, no
# radix-dialog / ui-dialog / ui-modal imports. Plus structural ban on
# `fixed inset-0` (fullscreen overlay = interstitial modal shape).
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#RENEWAL_COMPONENT_PATHS[@]} -gt 0 ]; then
  if grep -rnE '<(Dialog|Modal)[[:space:]>/]|@radix-ui/react-dialog|components/ui/(dialog|modal)|fixed[[:space:]]+inset-0' \
       "${RENEWAL_COMPONENT_PATHS[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "Modal / Dialog / fullscreen-overlay ('fixed inset-0') pattern inside RenewalBanner component"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Check 4: Direct posthog.capture() / track() inside the RenewalBanner
# component. Phase 9 analytics MUST go through `@/lib/analytics` `track()` —
# the bare `track(` call is allowed in the banner (it's a thin client wrapper)
# but `posthog.capture(` is always forbidden there.
#
# To avoid flagging the legitimate `track("renewal_prompted", ...)` call in
# RenewalBanner.tsx (which uses the analytics helper, not direct posthog),
# this check narrowly bans `posthog.capture(`.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#RENEWAL_COMPONENT_PATHS[@]} -gt 0 ]; then
  if grep -rnE 'posthog\.capture\(' \
       "${RENEWAL_COMPONENT_PATHS[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "Direct posthog.capture() inside RenewalBanner component (must use @/lib/analytics track())"
  fi
fi

# Also ban posthog.capture() on the renewal API surface — server analytics must
# go through emitEvent (matches Phase 7/8 guard precedent).
if [ ${#RENEWAL_API_PATHS[@]} -gt 0 ]; then
  if grep -rnE 'posthog\.capture\(' \
       "${RENEWAL_API_PATHS[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "Direct posthog.capture() on /api/renewal/** (must use emitEvent helper)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Check 5: framer-motion imports inside Phase 9 code paths.
# 09-CONTEXT specifies "subtle fade only" — Phase 9 keeps transitions to
# CSS-level (Tailwind `transition-opacity`) to minimise review surface. A
# later phase may re-enable framer-motion for renewal flows via explicit
# plan; for now it's banned in the 3 Phase-9 buckets (not globally).
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#ALL_PHASE9_PATHS[@]} -gt 0 ]; then
  if grep -rnE "from[[:space:]]+['\"]framer-motion['\"]" \
       "${ALL_PHASE9_PATHS[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "framer-motion imported inside Phase 9 code path (subtle CSS-transition only per 09-CONTEXT)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Summary.
# ─────────────────────────────────────────────────────────────────────────────
if [ "$FAIL" -ne 0 ]; then
  echo "" >&2
  echo "[phase-09-guard] FAIL — ${#VIOLATIONS[@]} violation(s) above" >&2
  exit 1
fi
echo "[phase-09-guard] PASS — zero banned patterns found"
exit 0
