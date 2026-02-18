import { APP_SLUG } from "@/lib/appConfig";

const eventBuffer = [];
const EVENTS_KEY = `${APP_SLUG}_events`;
const TRACK_LOG_PREFIX = `[${APP_SLUG}-track]`;

function readEvents() {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function track(eventName, meta = {}) {
  if (typeof window === "undefined") return;

  const payload = {
    event: eventName,
    meta,
    ts: Date.now(),
  };

  if (process.env.NODE_ENV !== "production") {
    console.log(TRACK_LOG_PREFIX, payload);
  }

  eventBuffer.push(payload);
  if (eventBuffer.length > 200) eventBuffer.splice(0, eventBuffer.length - 200);

  const existing = readEvents();
  existing.push(payload);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(existing.slice(-200)));
}
