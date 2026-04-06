import { describe, it, expect } from "vitest";
import { buildIdentity } from "./identityTracker";

describe("buildIdentity", () => {
  it("returns absent pattern for no completions", () => {
    const id = buildIdentity({
      completedDays: [],
      totalDays: 28,
      currentDay: 5,
      driftHistory: [],
      reflections: [],
      guideSessionCount: 0,
      themes: [],
    });
    expect(id.completionPattern).toBe("absent");
    expect(id.engagementScore).toBe(0);
    expect(id.transformationSignal).toBe("early");
  });

  it("returns consistent for high completion", () => {
    const id = buildIdentity({
      completedDays: [1, 2, 3, 4, 5],
      totalDays: 28,
      currentDay: 5,
      driftHistory: [3, 2, 1],
      reflections: [
        { day: 1, note: "a".repeat(250), emotion: "سلام", awareness_state: "gift" },
        { day: 2, note: "b".repeat(250), emotion: "سلام", awareness_state: "gift" },
        { day: 3, note: "c".repeat(250), emotion: "سلام", awareness_state: "best_possibility" },
      ],
      guideSessionCount: 3,
      themes: ["وعي"],
    });
    expect(id.completionPattern).toBe("consistent");
    expect(id.reflectionDepth).toBe("deep");
    expect(id.engagementScore).toBeGreaterThan(50);
    expect(id.trajectory).toBe("improving");
  });

  it("detects declining trajectory", () => {
    const id = buildIdentity({
      completedDays: [1],
      totalDays: 28,
      currentDay: 10,
      driftHistory: [1, 3, 6],
      reflections: [],
      guideSessionCount: 0,
      themes: [],
    });
    expect(id.trajectory).toBe("declining");
  });

  it("finds dominant emotion", () => {
    const id = buildIdentity({
      completedDays: [1, 2, 3],
      totalDays: 28,
      currentDay: 3,
      driftHistory: [],
      reflections: [
        { day: 1, note: "test", emotion: "خوف", awareness_state: "shadow" },
        { day: 2, note: "test", emotion: "خوف", awareness_state: "shadow" },
        { day: 3, note: "test", emotion: "سلام", awareness_state: "gift" },
      ],
      guideSessionCount: 0,
      themes: [],
    });
    expect(id.dominantEmotion).toBe("خوف");
  });
});
