type EventHandler = (payload: any) => void | Promise<void>;

const listeners = new Map<string, EventHandler[]>();

export function subscribe(eventName: string, handler: EventHandler): () => void {
  const handlers = listeners.get(eventName) ?? [];
  handlers.push(handler);
  listeners.set(eventName, handlers);
  return () => {
    const current = listeners.get(eventName) ?? [];
    listeners.set(eventName, current.filter((h) => h !== handler));
  };
}

export async function emit(eventName: string, payload: any): Promise<void> {
  const handlers = listeners.get(eventName) ?? [];
  await Promise.allSettled(handlers.map((h) => h(payload)));
}

// Event names
export const EVENTS = {
  DAY_OPENED: "DAY_OPENED",
  REFLECTION_SAVED: "REFLECTION_SAVED",
  ACTION_COMPLETED: "ACTION_COMPLETED",
  DAY_COMPLETED: "DAY_COMPLETED",
  DRIFT_DETECTED: "DRIFT_DETECTED",
} as const;
