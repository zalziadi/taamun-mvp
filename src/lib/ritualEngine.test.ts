import { describe, it, expect } from "vitest";
import { buildDailyRitual, buildEntry, buildIntention, buildAction, buildClosing } from "./ritualEngine";
import type { Guidance } from "./guidanceEngine";
import type { PersonalityProfile } from "./personalityEngine";
import type { RitualInputs } from "./ritualEngine";

const makeGuidance = (o: Partial<Guidance> = {}): Guidance => ({
  message: "test", tone: "reflective", focus: "continue",
  suggestedPath: { type: "reflection", reason: "test" },
  confidence: 0.7, personality: null, ...o,
});

const makePersonality = (o: Partial<PersonalityProfile> = {}): PersonalityProfile => ({
  style: "supportive", communication: "gentle", motivationType: "growth-driven",
  sensitivityLevel: "medium", adaptationScore: 0.6, ...o,
});

const makeInputs = (o: Partial<RitualInputs> = {}): RitualInputs => ({
  guidance: makeGuidance(),
  personality: makePersonality(),
  narrative: null,
  cognitiveAction: null,
  emotionalState: "curious",
  day: 5,
  streakDays: 3,
  ...o,
});

describe("buildEntry", () => {
  it("returns calm message for supportive + lost", () => {
    const entry = buildEntry("supportive", "lost", null);
    expect(entry.message).toContain("رجعت");
    expect(entry.breathCue).toBe(true);
  });

  it("returns challenging message for challenging + engaged", () => {
    const entry = buildEntry("challenging", "engaged", null);
    expect(entry.message).toContain("بعمق");
    expect(entry.breathCue).toBe(false);
  });

  it("enables breathCue for reflective tone", () => {
    const entry = buildEntry("reflective", "curious", null);
    expect(entry.breathCue).toBe(true);
  });

  it("enables breathCue for challenging + lost (exception)", () => {
    const entry = buildEntry("challenging", "lost", null);
    expect(entry.breathCue).toBe(true);
  });
});

describe("buildIntention", () => {
  it("uses narrative when available", () => {
    const intention = buildIntention(
      makeGuidance(),
      { title: "test", story: "أنت في مرحلة عمق — كل يوم يكشف طبقة", arc: "hero" },
      null,
      5
    );
    expect(intention.intentionText).toContain("نيتي اليوم");
    expect(intention.intentionText).toContain("عمق");
  });

  it("falls back to default for recover focus", () => {
    const intention = buildIntention(
      makeGuidance({ focus: "recover" }),
      null,
      makePersonality({ motivationType: "fear-driven" }),
      5
    );
    expect(intention.intentionText).toContain("بلطف");
    expect(intention.focusArea).toBe("العودة");
  });

  it("sets correct focus area name", () => {
    expect(buildIntention(makeGuidance({ focus: "deepen" }), null, null, 5).focusArea).toBe("العمق");
    expect(buildIntention(makeGuidance({ focus: "decide" }), null, null, 5).focusArea).toBe("القرار");
  });
});

describe("buildAction", () => {
  it("uses cognitive action when provided", () => {
    const action = buildAction(
      { type: "reflection", label: "test", description: "test", suggestedNextStep: "اكتب سطر", priority: "medium" },
      makeGuidance(),
      null
    );
    expect(action.type).toBe("reflect");
    expect(action.instruction).toBe("اكتب سطر");
  });

  it("falls back to personality-based instruction", () => {
    const action = buildAction(null, makeGuidance(), makePersonality({ style: "spiritual" }));
    expect(action.instruction).toContain("٣ مرات");
  });

  it("uses analytical instruction for analytical style", () => {
    const action = buildAction(null, makeGuidance(), makePersonality({ style: "analytical" }));
    expect(action.instruction).toContain("النمط");
  });
});

describe("buildClosing", () => {
  it("returns supportive closing", () => {
    const closing = buildClosing("supportive", "continue");
    expect(closing.message).toContain("ارتاح");
    expect(closing.integration).toContain("معك");
  });

  it("returns challenging closing", () => {
    const closing = buildClosing("challenging", "deepen");
    expect(closing.message).toContain("غداً");
  });

  it("returns recovery integration for recover focus", () => {
    const closing = buildClosing("reflective", "recover");
    expect(closing.integration).toContain("عودتك");
  });
});

describe("buildDailyRitual", () => {
  it("returns complete ritual with all sections", () => {
    const ritual = buildDailyRitual(makeInputs());
    expect(ritual.entry.message).toBeTruthy();
    expect(ritual.entry.breathCue).toBeDefined();
    expect(ritual.intention.focusArea).toBeTruthy();
    expect(ritual.intention.intentionText).toContain("نيتي");
    expect(ritual.action.type).toBeDefined();
    expect(ritual.action.instruction).toBeTruthy();
    expect(ritual.closing.message).toBeTruthy();
    expect(ritual.closing.integration).toBeTruthy();
  });

  it("adapts to recovery scenario", () => {
    const ritual = buildDailyRitual(makeInputs({
      guidance: makeGuidance({ tone: "supportive", focus: "recover" }),
      emotionalState: "lost",
      personality: makePersonality({ motivationType: "fear-driven" }),
    }));
    expect(ritual.entry.message).toContain("رجعت");
    expect(ritual.entry.breathCue).toBe(true);
    expect(ritual.intention.focusArea).toBe("العودة");
    expect(ritual.closing.integration).toContain("عودتك");
  });

  it("adapts to challenging breakthrough scenario", () => {
    const ritual = buildDailyRitual(makeInputs({
      guidance: makeGuidance({ tone: "challenging", focus: "deepen" }),
      emotionalState: "engaged",
      personality: makePersonality({ style: "challenger" }),
    }));
    expect(ritual.entry.message).toContain("بعمق");
    expect(ritual.entry.breathCue).toBe(false);
  });
});
