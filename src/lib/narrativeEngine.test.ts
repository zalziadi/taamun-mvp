import { describe, it, expect } from "vitest";
import { generateNarrative, classifyNarrativeArc, buildStory } from "./narrativeEngine";
import type { Pattern } from "./reflectionLinker";

describe("classifyNarrativeArc", () => {
  it("returns hero for deepening + high completion", () => {
    expect(classifyNarrativeArc("deepening", 0.8, 0)).toBe("hero");
  });

  it("returns resistant for high drift + low completion", () => {
    expect(classifyNarrativeArc("emerging", 0.2, 7)).toBe("resistant");
  });

  it("returns transforming for shifting arc", () => {
    expect(classifyNarrativeArc("shifting", 0.5, 2)).toBe("transforming");
  });

  it("returns seeker as default", () => {
    expect(classifyNarrativeArc("emerging", 0.5, 2)).toBe("seeker");
  });
});

describe("generateNarrative", () => {
  it("generates hero narrative", () => {
    const patterns: Pattern[] = [
      { keyword: "وعي", weight: 5, firstSeenDay: 1, recurrence: 5, type: "cognitive" },
    ];
    const n = generateNarrative(patterns, "deepening", 10, 9, 0);
    expect(n.arc).toBe("hero");
    expect(n.title).toBe("رحلة البطل");
    expect(n.story).toContain("وعي");
  });

  it("generates resistant narrative for high drift", () => {
    const n = generateNarrative([], "emerging", 10, 2, 7);
    expect(n.arc).toBe("resistant");
    expect(n.story).toContain("المقاومة");
  });

  it("generates seeker narrative with patterns", () => {
    const patterns: Pattern[] = [
      { keyword: "خوف", weight: 3, firstSeenDay: 1, recurrence: 3, type: "emotional" },
    ];
    const n = generateNarrative(patterns, "emerging", 5, 3, 1);
    expect(n.arc).toBe("seeker");
    expect(n.story).toContain("خوف");
  });
});
