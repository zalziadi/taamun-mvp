import { describe, it, expect } from "vitest";
import { detectTone, applyTone, adaptToneToMessage } from "./index";

describe("detectTone", () => {
  it("returns calm for high drift", () => {
    expect(detectTone({ momentum: 0, drift: 7, commitment: 50 })).toBe("calm");
  });

  it("returns firm for hesitation patterns", () => {
    expect(detectTone({
      momentum: 0,
      drift: 0,
      commitment: 50,
      hesitationPatterns: true,
    })).toBe("firm");
  });

  it("returns motivational for high momentum", () => {
    expect(detectTone({ momentum: 8, drift: 0, commitment: 70 })).toBe("motivational");
  });

  it("returns compassionate for low commitment", () => {
    expect(detectTone({ momentum: 0, drift: 0, commitment: 20 })).toBe("compassionate");
  });

  it("returns calm as safe default", () => {
    expect(detectTone({ momentum: 2, drift: 0, commitment: 50 })).toBe("calm");
  });

  it("drift takes priority over hesitation", () => {
    expect(detectTone({
      momentum: 0,
      drift: 8,
      commitment: 50,
      hesitationPatterns: true,
    })).toBe("calm");
  });
});

describe("applyTone", () => {
  it("returns a string with extra content for any tone", () => {
    const original = "اليوم بين يديك";
    const adapted = applyTone(original, "motivational");
    expect(adapted).toContain(original);
    expect(adapted.length).toBeGreaterThanOrEqual(original.length);
  });

  it("is deterministic for same input", () => {
    const a = applyTone("test", "calm");
    const b = applyTone("test", "calm");
    expect(a).toBe(b);
  });
});

describe("adaptToneToMessage", () => {
  it("returns tone + adapted message", () => {
    const result = adaptToneToMessage("ابدأ", { momentum: 8, drift: 0, commitment: 70 });
    expect(result.tone).toBe("motivational");
    expect(result.message).toContain("ابدأ");
  });
});
