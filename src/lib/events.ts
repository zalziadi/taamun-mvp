// Strict event contract system

export type EventMap = {
  DAY_OPENED: { userId: string; day: number; drift: number };
  REFLECTION_SAVED: { userId: string; day: number; noteLength: number; emotion: string | null };
  ACTION_COMPLETED: { userId: string; actionId: string; impact: "low" | "medium" | "high" };
  DAY_COMPLETED: { userId: string; day: number };
  DRIFT_DETECTED: { userId: string; drift: number; mode: string };
  IDENTITY_UPDATED: { userId: string; engagementScore: number; trajectory: string };
  NARRATIVE_GENERATED: { userId: string; arc: string; day: number };
};

type EventName = keyof EventMap;
type EventHandler<K extends EventName> = (payload: EventMap[K]) => void | Promise<void>;

// Internal untyped store (handlers indexed by event name)
const listeners = new Map<string, ((payload: any) => void | Promise<void>)[]>();

export function subscribe<K extends EventName>(
  eventName: K,
  handler: EventHandler<K>
): () => void {
  const handlers = listeners.get(eventName) ?? [];
  handlers.push(handler as any);
  listeners.set(eventName, handlers);
  return () => {
    const current = listeners.get(eventName) ?? [];
    listeners.set(eventName, current.filter((h) => h !== handler));
  };
}

export async function emit<K extends EventName>(
  eventName: K,
  payload: EventMap[K]
): Promise<void> {
  const handlers = listeners.get(eventName) ?? [];
  await Promise.allSettled(handlers.map((h) => h(payload)));
}

// Event names constant (backward-compatible)
export const EVENTS = {
  DAY_OPENED: "DAY_OPENED",
  REFLECTION_SAVED: "REFLECTION_SAVED",
  ACTION_COMPLETED: "ACTION_COMPLETED",
  DAY_COMPLETED: "DAY_COMPLETED",
  DRIFT_DETECTED: "DRIFT_DETECTED",
  IDENTITY_UPDATED: "IDENTITY_UPDATED",
  NARRATIVE_GENERATED: "NARRATIVE_GENERATED",
} as const;
