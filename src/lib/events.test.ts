import { describe, it, expect } from "vitest";
import { emit, subscribe, EVENTS } from "./events";

describe("events", () => {
  it("calls subscribed handler on emit", async () => {
    let received: any = null;
    subscribe(EVENTS.DAY_OPENED, (payload) => {
      received = payload;
    });
    await emit(EVENTS.DAY_OPENED, { day: 5 });
    expect(received).toEqual({ day: 5 });
  });

  it("supports multiple handlers", async () => {
    const results: number[] = [];
    subscribe("test_multi", () => results.push(1));
    subscribe("test_multi", () => results.push(2));
    await emit("test_multi", {});
    expect(results).toEqual([1, 2]);
  });

  it("unsubscribe removes handler", async () => {
    let called = false;
    const unsub = subscribe("test_unsub", () => {
      called = true;
    });
    unsub();
    await emit("test_unsub", {});
    expect(called).toBe(false);
  });

  it("does not throw if no handlers", async () => {
    await expect(emit("nonexistent", {})).resolves.toBeUndefined();
  });
});
