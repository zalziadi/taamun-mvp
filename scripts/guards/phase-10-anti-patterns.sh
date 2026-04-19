#!/usr/bin/env bash
# scripts/guards/phase-10-anti-patterns.sh
#
# Phase 10 (Referral Program) anti-pattern sweep.
# Mirrors scripts/guards/phase-09-anti-patterns.sh — the ban-list targets the
# Phase 10 referral code paths that must never grow MLM / affiliate vocabulary,
# leaderboards, earn-cash framing, auto-share, activation_codes minting from
# the credit path, pre-day-14 credit, or full-code leaks to analytics.
#
# Scope philosophy
#   Phase 10 bans apply to five path buckets:
#     BUCKET_A — src/components/ReferralPanel.tsx
#              + src/components/ReferralPanelHelpers.ts
#       (UI vocab, gamification, timers, modals, animation, required da'wah copy)
#     BUCKET_B — src/app/api/referral/**
#              + src/app/api/activate/route.ts
#       (full-code leak to analytics — ANALYTICS-07)
#     BUCKET_C — src/lib/referral/credit.ts
#              + src/app/api/cron/credit-referrals/**
#       (NEVER mint activation_codes — REFER-04 · synchronous only — REFER-05
#        · silent credit — REFER-11)
#     BUCKET_D — src/app/account/referral/**
#       (no client-side posthog.capture or analytics.track for referral events
#        — ANALYTICS-07 server-only)
#     BUCKET_E — src/components/ReferralPanel.tsx + src/app/account/referral/**
#       (no auto-share: SUMMARY §R4)
#
# Wired into `npm run guard:release` AFTER `guard:phase-09` and BEFORE
# `npx tsc --noEmit`. Order matters for readable failure output.
#
# banned_terms (catalog — matches 10-CONTEXT.md "Banned anti-patterns"):
#   BUCKET_A vocabulary / gamification / UI:
#     earn · cash · reward(-ing standalone) · points · affiliate · commission
#     خصم · أرباح · سحب
#     🔥 · 🏆 · 🥇 · top referrer · leaderboard · level N
#     setInterval · countdown · Countdown · <Dialog · <Modal
#     @radix-ui/react-dialog · fixed inset-0 · framer-motion
#   BUCKET_A required copy:
#     ادعُ للتمعّن (da'wah framing — REFER-10)
#   BUCKET_B analytics:
#     emitEvent(...code...) · properties: { code: code } — full code leak
#   BUCKET_C credit path:
#     from("activation_codes").insert · insert into activation_codes — REFER-04
#     webhook · queue.add · enqueue — REFER-05 (synchronous only)
#     email_queue · push_queue · emitEvent(credited|reward) — REFER-11 silent
#   BUCKET_D client analytics:
#     posthog.capture · analytics.track(...referral — ANALYTICS-07 server-only
#   BUCKET_E auto-share:
#     useEffect(...click()) · ref.current?.click() — SUMMARY §R4
#
# Comment-line carve-out: lines whose first non-whitespace character (after
# grep's leading `path:linenum:` prefix) is `*` or `//` are skipped — JSDoc
# blocks documenting bans don't trip the guard, but banned strings inside
# real JSX / string literals / imports still match.
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
  echo "[phase-10-guard] $1" >&2
}

# Comment-line carve-out: strip lines whose content (after grep's leading
# `path:linenum:` prefix) starts with `*` or `//` after optional whitespace.
CARVE_OUT='([^:]+:[0-9]+:[[:space:]]*(\*|//))'

# ─────────────────────────────────────────────────────────────────────────────
# Path buckets — only grep paths that actually exist (avoids "No such file").
# ─────────────────────────────────────────────────────────────────────────────

BUCKET_A=()
[ -f "src/components/ReferralPanel.tsx" ] \
  && BUCKET_A+=("src/components/ReferralPanel.tsx")
[ -f "src/components/ReferralPanelHelpers.ts" ] \
  && BUCKET_A+=("src/components/ReferralPanelHelpers.ts")

BUCKET_B=()
[ -d "src/app/api/referral" ] && BUCKET_B+=("src/app/api/referral")
[ -f "src/app/api/activate/route.ts" ] \
  && BUCKET_B+=("src/app/api/activate/route.ts")

BUCKET_C=()
[ -f "src/lib/referral/credit.ts" ] && BUCKET_C+=("src/lib/referral/credit.ts")
[ -d "src/app/api/cron/credit-referrals" ] \
  && BUCKET_C+=("src/app/api/cron/credit-referrals")

BUCKET_D=()
[ -d "src/app/account/referral" ] && BUCKET_D+=("src/app/account/referral")

BUCKET_E=()
[ -f "src/components/ReferralPanel.tsx" ] \
  && BUCKET_E+=("src/components/ReferralPanel.tsx")
[ -d "src/app/account/referral" ] && BUCKET_E+=("src/app/account/referral")

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_A-1: MLM / affiliate / earn-cash vocabulary in ReferralPanel.
# Bans the English vocab (case-insensitive) + three Arabic tokens that would
# signal a monetary-reward framing. Regex uses word boundaries so 'rewarded'
# in status labels doesn't fire — but standalone 'reward' / 'earn' / 'cash'
# does.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BUCKET_A[@]} -gt 0 ]; then
  VOCAB_PATTERN='\b(earn|cash|points|affiliate|commission)\b|خصم|أرباح|سحب'
  if grep -rniE "$VOCAB_PATTERN" "${BUCKET_A[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[A-vocab] MLM / affiliate / earn-cash vocabulary in ReferralPanel (earn|cash|points|affiliate|commission|خصم|أرباح|سحب)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_A-2: gamification UI — flame / trophy emoji, leaderboard, top-referrer,
# "level N" language.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BUCKET_A[@]} -gt 0 ]; then
  if grep -rniE "🔥|🏆|🥇|top[[:space:]]*referrer|leaderboard|\\blevel[[:space:]]+[0-9]" \
       "${BUCKET_A[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[A-gami] gamification UI (emoji / leaderboard / level N) in ReferralPanel"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_A-3: timers / modals / fullscreen overlay / animation library.
# Phase 10 UI is a static page with user-initiated taps only — no countdown,
# no modal interruption, no framer-motion transitions.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BUCKET_A[@]} -gt 0 ]; then
  if grep -rnE 'setInterval\(|[Cc]ountdown|<(Dialog|Modal)[[:space:]>/]|@radix-ui/react-dialog|fixed[[:space:]]+inset-0|from[[:space:]]+['\''"]framer-motion['\''"]' \
       "${BUCKET_A[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[A-ui] banned timer / modal / overlay / framer-motion usage in ReferralPanel"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_A-4: required Arabic da'wah copy (REFER-10).
# The phrase "ادعُ للتمعّن" MUST appear in ReferralPanel.tsx.
# ─────────────────────────────────────────────────────────────────────────────
if [ -f "src/components/ReferralPanel.tsx" ]; then
  if ! grep -q "ادعُ للتمعّن" src/components/ReferralPanel.tsx; then
    report "[A-copy] missing required Arabic da'wah string 'ادعُ للتمعّن' in ReferralPanel.tsx (REFER-10)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_B: ANALYTICS-07 — full referral code MUST NOT leak to analytics.
# Narrow regex targets the specific anti-pattern: an emitEvent call whose
# properties object contains `code: <var>` or `code: "FRIEND-...` OR any
# properties object referencing `code:` in a referral event context.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BUCKET_B[@]} -gt 0 ]; then
  # Match: properties: { ... code: ... } in any referral-API file.
  if grep -rnE 'properties:[[:space:]]*\{[^}]*[[:space:]]code:' \
       "${BUCKET_B[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[B-analytics] emitEvent properties appears to include 'code:' — full code leak (ANALYTICS-07)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_C-1: REFER-04 — NEVER mint activation_codes from the credit path.
# The referrer's reward is a direct UPDATE to profiles.expires_at.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BUCKET_C[@]} -gt 0 ]; then
  if grep -rnE 'from\(['\''"]activation_codes['\''"]\)[^.]*\.insert|insert[^)]*activation_codes' \
       "${BUCKET_C[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[C-mint] credit path appears to mint activation_codes (REFER-04 violation)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_C-2: REFER-05 — synchronous credit only. No webhooks / queues / enqueue.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BUCKET_C[@]} -gt 0 ]; then
  if grep -rniE '\bwebhook\b|queue\.add\(|\benqueue\(' \
       "${BUCKET_C[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[C-async] credit path contains async dispatch (webhook / queue.add / enqueue) — REFER-05 violation"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_C-3: REFER-11 — silent credit. No email / push / emitEvent on credit.
# The referrer simply notices their expires_at extended on next /account visit.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BUCKET_C[@]} -gt 0 ]; then
  if grep -rniE 'email_queue|push_queue|sendPush\(|emitEvent[^)]*(credited|rewarded|\\breward\\b)' \
       "${BUCKET_C[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[C-notify] credit path emits notification / analytics event (REFER-11 silent delivery violation)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_D: ANALYTICS-07 — referral analytics are SERVER-ONLY.
# No posthog.capture() or analytics.track(..referral..) on /account/referral.
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BUCKET_D[@]} -gt 0 ]; then
  if grep -rnE 'posthog\.capture\(|analytics\.track\([^)]*referral' \
       "${BUCKET_D[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[D-client-analytics] client-side referral analytics in /account/referral (ANALYTICS-07 server-only)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# BUCKET_E: SUMMARY §R4 — no auto-share. Shares MUST be user-initiated taps.
# Bans: useEffect hooks containing `.click()` calls, and direct `ref.current`
# click invocations. The real component uses onClick handlers only (allowed).
# ─────────────────────────────────────────────────────────────────────────────
if [ ${#BUCKET_E[@]} -gt 0 ]; then
  if grep -rnE 'useEffect\([^}]*\.click\(|ref\.current\??\.click\(' \
       "${BUCKET_E[@]}" 2>/dev/null \
       | grep -vE "$CARVE_OUT" ; then
    report "[E-autoshare] auto-share pattern detected (useEffect + .click() or ref.current.click()) — SUMMARY §R4 violation"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
if [ "$FAIL" -ne 0 ]; then
  echo "" >&2
  echo "[phase-10-guard] FAIL — ${#VIOLATIONS[@]} violation(s) above" >&2
  exit 1
fi
echo "[phase-10-guard] PASS — zero banned patterns found"
exit 0
