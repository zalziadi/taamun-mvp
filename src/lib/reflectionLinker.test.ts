import { describe, it, expect } from "vitest";
import { extractPatterns, detectEmotionalArc, findConnectedDays, generateInsight } from "./reflectionLinker";

const makeReflection = (day: number, note: string, emotion = "", awareness = "shadow") => ({
  day,
  note,
  emotion,
  awareness_state: awareness,
});

describe("extractPatterns", () => {
  it("finds emotional keywords", () => {
    const reflections = [
      makeReflection(1, "شعرت بالخوف من المجهول"),
      makeReflection(2, "الخوف عاد مرة أخرى"),
      makeReflection(3, "اليوم أقل خوف"),
    ];
    const patterns = extractPatterns(reflections);
    const fear = patterns.find((p) => p.keyword === "خوف");
    expect(fear).toBeDefined();
    expect(fear!.recurrence).toBe(3);
    expect(fear!.type).toBe("emotional");
  });

  it("finds behavioral keywords", () => {
    const reflections = [makeReflection(1, "لاحظت نمط التردد في قراراتي")];
    const patterns = extractPatterns(reflections);
    expect(patterns.some((p) => p.keyword === "تردد")).toBe(true);
  });

  it("returns empty for no matches", () => {
    const patterns = extractPatterns([makeReflection(1, "يوم عادي")]);
    expect(patterns.length).toBe(0);
  });
});

describe("detectEmotionalArc", () => {
  it("returns emerging for < 2 reflections", () => {
    expect(detectEmotionalArc([makeReflection(1, "test")])).toBe("emerging");
  });

  it("returns repeating for same state and emotion", () => {
    const reflections = [
      makeReflection(1, "", "خوف", "shadow"),
      makeReflection(2, "", "خوف", "shadow"),
    ];
    expect(detectEmotionalArc(reflections)).toBe("repeating");
  });
});

describe("findConnectedDays", () => {
  it("finds days with matching patterns", () => {
    const reflections = [
      makeReflection(1, "شعرت بالخوف"),
      makeReflection(3, "اليوم بدون خوف"),
      makeReflection(5, "الخوف يعود"),
    ];
    const patterns = [{ keyword: "خوف", weight: 3, firstSeenDay: 1, recurrence: 3, type: "emotional" as const }];
    const connected = findConnectedDays(5, reflections, patterns);
    expect(connected).toContain(1);
    expect(connected).toContain(3);
    expect(connected).not.toContain(5);
  });
});

describe("generateInsight", () => {
  it("returns default for no patterns", () => {
    expect(generateInsight([], "emerging", [])).toBe("كل تأمل يضيف طبقة جديدة لفهمك");
  });

  it("generates pattern-based insight", () => {
    const patterns = [{ keyword: "خوف", weight: 3, firstSeenDay: 1, recurrence: 3, type: "emotional" as const }];
    const insight = generateInsight(patterns, "deepening", [2]);
    expect(insight).toContain("خوف");
    expect(insight).toContain("يتعمّق");
    expect(insight).toContain("يوم 2");
  });
});
