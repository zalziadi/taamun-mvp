/** Lightweight internal analytics. No external vendor. Dev: console. Prod: localStorage queue. */
const QUEUE_KEY = "taamun.analytics.queue.v1";
const MAX_QUEUE = 200;

interface EventPayload {
  event: string;
  props?: Record<string, unknown>;
  ts: string;
}

function loadQueue(): EventPayload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is EventPayload =>
        x && typeof x === "object" && typeof (x as EventPayload).event === "string"
    );
  } catch {
    return [];
  }
}

function saveQueue(q: EventPayload[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-MAX_QUEUE)));
  } catch {
    // ignore
  }
}

export function track(eventName: string, props?: Record<string, unknown>): void {
  const payload: EventPayload = {
    event: eventName,
    props,
    ts: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === "development") {
    console.log("[analytics]", eventName, props ?? {});
  }

  const q = loadQueue();
  q.push(payload);
  saveQueue(q);
}
