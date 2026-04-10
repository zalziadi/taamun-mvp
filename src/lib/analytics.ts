"use client";

import posthog from "posthog-js";

/* ── Globals ── */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const ANON_ID_KEY = "taamun_ANON_ID";
const UTM_KEY = "taamun_utm";
let initialized = false;

function getOrCreateAnonId(): string {
  const existing = window.localStorage.getItem(ANON_ID_KEY);
  if (existing) return existing;

  const nextId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `anon_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  window.localStorage.setItem(ANON_ID_KEY, nextId);
  return nextId;
}

/* ── UTM Capture ── */

const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

export type UtmData = Partial<Record<(typeof UTM_PARAMS)[number], string>>;

/** Capture UTM params from URL and store in localStorage. Called once on init. */
function captureUtmParams(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: UtmData = {};
    let hasAny = false;
    for (const key of UTM_PARAMS) {
      const val = params.get(key);
      if (val) {
        utm[key] = val;
        hasAny = true;
      }
    }
    if (hasAny) {
      window.localStorage.setItem(UTM_KEY, JSON.stringify(utm));
    }
  } catch {
    // Ignore localStorage failures.
  }
}

/** Retrieve stored UTM data (or null). */
export function getStoredUtm(): UtmData | null {
  try {
    const raw = window.localStorage.getItem(UTM_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UtmData;
  } catch {
    return null;
  }
}

/* ── Init ── */

export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return;

  // Always capture UTM params (works even without PostHog)
  captureUtmParams();

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key || !host) return;

  const anonId = getOrCreateAnonId();
  posthog.init(key, {
    api_host: host,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    persistence: "localStorage",
    person_profiles: "never",
  });

  posthog.identify(anonId);
  initialized = true;
}

/* ── Tracking ── */

/** Track event in PostHog + Meta Pixel (if loaded). UTM data auto-attached. */
export function track(eventName: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!initialized) initAnalytics();

  // Attach UTM data to all events
  const utm = getStoredUtm();
  const enriched = utm ? { ...utm, ...props } : props;

  // PostHog
  if (initialized) {
    posthog.capture(eventName, enriched);
  }
}

/** Fire a Meta Pixel standard or custom event. */
export function trackFbq(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  if (window.fbq) {
    window.fbq("track", eventName, params);
  }
}

/** Identify a known user (call after successful auth). */
export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!initialized) initAnalytics();

  // PostHog: link anonymous ID to real user
  if (initialized) {
    posthog.identify(userId, traits);
  }
}
