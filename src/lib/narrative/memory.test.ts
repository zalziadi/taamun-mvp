import { describe, it, expect } from "vitest";
import { buildNarrativeMemory, describeState, describeTimeAgo, buildSentence } from "./memory";

describe("describeState", () => {
  it("maps shadow to مشتت", () => {
    expect(describeState("shadow")).toBe("مشتت");
  });

  it("maps best_possibility to تحسم القرار", () => {
    expect(describeState("best_possibility")).toBe("تحسم القرار");
  });

  it("returns state as-is for unknown", () => {
    expect(describeState("unknown_state")).toBe("unknown_state");
  });
});

describe("describeTimeAgo", () => {
  it("0 days = اليوم", () => expect(describeTimeAgo(0)).toBe("اليوم"));
  it("1 day = أمس", () => expect(describeTimeAgo(1)).toBe("أمس"));
  it("2 days = قبل يومين", () => expect(describeTimeAgo(2)).toBe("قبل يومين"));
  it("5 days = قبل 5 أيام", () => expect(describeTimeAgo(5)).toContain("5"));
  it("10 days = قبل أسبوع", () => expect(describeTimeAgo(10)).toBe("قبل أسبوع"));
  it("21 days = قبل 3 أسابيع", () => expect(describeTimeAgo(21)).toContain("3"));
});

describe("buildSentence", () => {
  it("today format: 'اليوم أنت X'", () => {
    expect(buildSentence("اليوم", "best_possibility")).toContain("تحسم");
  });

  it("past format: 'X كنت Y'", () => {
    const sentence = buildSentence("قبل 5 أيام", "shadow");
    expect(sentence).toContain("قبل 5 أيام");
    expect(sentence).toContain("كنت");
    expect(sentence).toContain("مشتت");
  });

  it("uses keyEvent if provided", () => {
    const sentence = buildSentence("اليوم", "shadow", "اتخذت قرار صعب");
    expect(sentence).toContain("اتخذت");
  });
});

describe("buildNarrativeMemory", () => {
  it("returns empty for empty input", () => {
    expect(buildNarrativeMemory({ lastDays: [] })).toEqual([]);
  });

  it("returns 1 sentence for 1 day", () => {
    const result = buildNarrativeMemory({
      lastDays: [{ day: 5, state: "best_possibility" }],
    });
    expect(result).toHaveLength(1);
  });

  it("returns 3 anchors for 5+ days (start, middle, latest)", () => {
    const result = buildNarrativeMemory({
      lastDays: [
        { day: 1, state: "shadow" },
        { day: 2, state: "shadow" },
        { day: 3, state: "gift" },
        { day: 4, state: "gift" },
        { day: 5, state: "best_possibility" },
      ],
    });
    expect(result).toHaveLength(3);
    // Latest sentence should mention "اليوم"
    expect(result[result.length - 1]).toContain("اليوم");
  });

  it("orders sentences chronologically (oldest first)", () => {
    const result = buildNarrativeMemory({
      lastDays: [
        { day: 5, state: "best_possibility" },
        { day: 1, state: "shadow" },
        { day: 3, state: "gift" },
      ],
    });
    expect(result[0]).toContain("4");           // 5-1=4 days ago (shadow)
    expect(result[result.length - 1]).toContain("اليوم");
  });
});
