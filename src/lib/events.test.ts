import { describe, it, expect } from "vitest";
import { emit, subscribe, EVENTS } from "./events";

describe("events (typed)", () => {
  it("calls subscribed handler on emit with correct payload", async () => {
    let received: any = null;
    subscribe("DAY_OPENED", (payload) => {
      received = payload;
    });
    await emit("DAY_OPENED", { userId: "u1", day: 5, drift: 0 });
    expect(received).toEqual({ userId: "u1", day: 5, drift: 0 });
  });

  it("supports REFLECTION_SAVED event", async () => {
    let received: any = null;
    subscribe("REFLECTION_SAVED", (payload) => {
      received = payload;
    });
    await emit("REFLECTION_SAVED", { userId: "u1", day: 3, noteLength: 150, emotion: "سلام" });
    expect(received?.day).toBe(3);
    expect(received?.emotion).toBe("سلام");
  });

  it("supports ACTION_COMPLETED event", async () => {
    let received: any = null;
    subscribe("ACTION_COMPLETED", (payload) => {
      received = payload;
    });
    await emit("ACTION_COMPLETED", { userId: "u1", actionId: "abc", impact: "high" });
    expect(received?.impact).toBe("high");
  });

  it("unsubscribe removes handler", async () => {
    let called = false;
    const unsub = subscribe("DAY_COMPLETED", () => {
      called = true;
    });
    unsub();
    await emit("DAY_COMPLETED", { userId: "u1", day: 1 });
    expect(called).toBe(false);
  });

  it("has correct EVENTS constants", () => {
    expect(EVENTS.DAY_OPENED).toBe("DAY_OPENED");
    expect(EVENTS.REFLECTION_SAVED).toBe("REFLECTION_SAVED");
    expect(EVENTS.IDENTITY_UPDATED).toBe("IDENTITY_UPDATED");
    expect(EVENTS.NARRATIVE_GENERATED).toBe("NARRATIVE_GENERATED");
  });
});
