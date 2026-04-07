import { describe, it, expect } from "vitest";
import { updateIdentityState, aggregateIdentityUpdates } from "./update";

describe("updateIdentityState", () => {
  it("decision creates highest shift", () => {
    const decision = updateIdentityState({ action: "decision", intensity: 1 });
    const ritual = updateIdentityState({ action: "ritual", intensity: 1 });
    expect(decision.identity_shift).toBeGreaterThan(ritual.identity_shift);
  });

  it("intensity scales the shift linearly", () => {
    const half = updateIdentityState({ action: "decision", intensity: 0.5 });
    const full = updateIdentityState({ action: "decision", intensity: 1 });
    expect(full.identity_shift).toBeCloseTo(half.identity_shift * 2, 1);
  });

  it("clamps intensity to [0, 1]", () => {
    const over = updateIdentityState({ action: "decision", intensity: 5 });
    const under = updateIdentityState({ action: "decision", intensity: -1 });
    expect(over.identity_shift).toBeLessThanOrEqual(1);
    expect(under.identity_shift).toBe(0);
  });

  it("progress action emphasizes trajectory correction", () => {
    const result = updateIdentityState({ action: "progress", intensity: 1 });
    expect(result.trajectory_delta).toBeGreaterThan(result.identity_shift);
  });

  it("returns Arabic reason", () => {
    const result = updateIdentityState({ action: "decision", intensity: 1 });
    expect(result.reason).toBeTruthy();
    expect(result.reason.length).toBeGreaterThan(10);
  });
});

describe("aggregateIdentityUpdates", () => {
  it("sums shifts across actions", () => {
    const updates = [
      updateIdentityState({ action: "decision", intensity: 1 }),
      updateIdentityState({ action: "ritual", intensity: 1 }),
    ];
    const total = aggregateIdentityUpdates(updates);
    expect(total.total_shift).toBe(0.8); // 0.6 + 0.2
    expect(total.total_trajectory_delta).toBe(0.7); // 0.4 + 0.3
  });

  it("returns zero for empty array", () => {
    const total = aggregateIdentityUpdates([]);
    expect(total.total_shift).toBe(0);
    expect(total.total_trajectory_delta).toBe(0);
  });
});
