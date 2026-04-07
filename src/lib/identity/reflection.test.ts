import { describe, it, expect } from "vitest";
import { buildIdentityReflection, intensifyState, buildMessage, STATE_MAP } from "./reflection";

describe("STATE_MAP", () => {
  it("has all 4 action types", () => {
    expect(STATE_MAP.decision).toBeDefined();
    expect(STATE_MAP.ritual).toBeDefined();
    expect(STATE_MAP.progress).toBeDefined();
    expect(STATE_MAP.reflection).toBeDefined();
  });

  it("decision: تفكير → فعل", () => {
    expect(STATE_MAP.decision.before).toContain("تفكير");
    expect(STATE_MAP.decision.after).toContain("فعل");
  });
});

describe("intensifyState", () => {
  it("returns state as-is for high shift", () => {
    expect(intensifyState("وضوح", 0.8)).toBe("وضوح");
  });

  it("prefixes 'أقرب إلى' for medium shift", () => {
    expect(intensifyState("وضوح", 0.3)).toContain("أقرب");
  });

  it("prefixes 'بداية' for low shift", () => {
    expect(intensifyState("وضوح", 0.1)).toContain("بداية");
  });
});

describe("buildMessage", () => {
  it("uses 'أنت الآن' for strong shift", () => {
    const msg = buildMessage("تفكير", "فعل", 0.7);
    expect(msg).toContain("أنت الآن");
  });

  it("uses 'بدأت تتحرك' for medium shift", () => {
    const msg = buildMessage("تفكير", "فعل", 0.3);
    expect(msg).toContain("بدأت");
  });

  it("uses 'لاحظ' for small shift", () => {
    const msg = buildMessage("تفكير", "فعل", 0.1);
    expect(msg).toContain("لاحظ");
  });
});

describe("buildIdentityReflection", () => {
  it("returns full reflection for decision action", () => {
    const r = buildIdentityReflection({ action: "decision", identityShift: 0.6 });
    expect(r.message).toBeTruthy();
    expect(r.before_state).toBe("تفكير وتأجيل");
    expect(r.after_state).toBe("وضوح وفعل");
    expect(r.message).toContain("وضوح");
  });

  it("respects custom previousState", () => {
    const r = buildIdentityReflection({
      action: "ritual",
      identityShift: 0.6,
      previousState: "قلق",
    });
    expect(r.before_state).toBe("قلق");
  });

  it("scales after_state by intensity", () => {
    const strong = buildIdentityReflection({ action: "decision", identityShift: 0.9 });
    const weak = buildIdentityReflection({ action: "decision", identityShift: 0.1 });
    expect(strong.after_state).toBe("وضوح وفعل");
    expect(weak.after_state).toContain("بداية");
  });
});
