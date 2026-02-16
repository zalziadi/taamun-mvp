"use client";

import posthog from "posthog-js";

const ANON_ID_KEY = "TAAMUN_ANON_ID";
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

export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return;

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

export function track(eventName: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!initialized) initAnalytics();
  if (!initialized) return;
  posthog.capture(eventName, props);
}
