import { describe, it, expect } from "vitest";
import { buildJustification, detectDominantHesitation, countKeywordOccurrences } from "./justification";

describe("countKeywordOccurrences", () => {
  it("counts keyword in entry text", () => {
    const result = countKeywordOccurrences(
      [{ text: "أشعر بتردد كبير اليوم" }],
      ["تردد", "حيرة"]
    );
    expect(result.find((r) => r.keyword === "تردد")?.count).toBe(1);
  });

  it("counts keyword in entry tags", () => {
    const result = countKeywordOccurrences(
      [{ tags: ["تأجيل", "صباح"] }],
      ["تأجيل", "تردد"]
    );
    expect(result.find((r) => r.keyword === "تأجيل")?.count).toBe(1);
  });

  it("returns sorted by frequency desc", () => {
    const result = countKeywordOccurrences(
      [
        { text: "تردد ثم تردد" },
        { text: "تردد دائم" },
        { text: "حيرة فقط" },
      ],
      ["تردد", "حيرة"]
    );
    expect(result[0].keyword).toBe("تردد");
    expect(result[0].count).toBe(2);
  });
});

describe("detectDominantHesitation", () => {
  it("detects dominant from entries", () => {
    const result = detectDominantHesitation({
      patterns: [],
      recentEntries: [
        { text: "تردد كبير" },
        { text: "ما زلت في تردد" },
      ],
      commitmentScore: 50,
    });
    expect(result?.keyword).toBe("تردد");
  });

  it("falls back to patterns when entries empty", () => {
    const result = detectDominantHesitation({
      patterns: ["نمط تأجيل واضح"],
      recentEntries: [],
      commitmentScore: 50,
    });
    expect(result?.keyword).toBe("تأجيل");
  });

  it("returns null when nothing matches", () => {
    const result = detectDominantHesitation({
      patterns: ["استقرار"],
      recentEntries: [{ text: "يوم جميل" }],
      commitmentScore: 80,
    });
    expect(result).toBeNull();
  });
});

describe("buildJustification", () => {
  it("returns full justification with insight + evidence + hook", () => {
    const j = buildJustification({
      patterns: ["تردد"],
      recentEntries: [
        { text: "تردد في القرار" },
        { text: "ما زال التردد" },
        { text: "يوم آخر" },
      ],
      commitmentScore: 40,
    });
    expect(j.insight).toBeTruthy();
    expect(j.evidence).toBeTruthy();
    expect(j.emotional_hook).toBeTruthy();
    expect(j.evidence).toContain("2");
    expect(j.evidence).toContain("3");
  });

  it("uses commitment fallback when no patterns", () => {
    const j = buildJustification({
      patterns: [],
      recentEntries: [],
      commitmentScore: 20,
    });
    expect(j.insight).toContain("الالتزام");
    expect(j.evidence).toContain("20");
  });

  it("returns sensible default when no signals", () => {
    const j = buildJustification({
      patterns: [],
      recentEntries: [],
      commitmentScore: 80,
    });
    expect(j.insight).toBeTruthy();
    expect(j.emotional_hook).toBeTruthy();
  });
});
