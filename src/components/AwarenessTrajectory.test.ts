import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AwarenessTrajectory } from "./AwarenessTrajectory";

/**
 * Phase 11.05 — AwarenessTrajectory SVG sparkline tests.
 *
 * Invariants under test (YIR-11, NFR-08, NFR-02):
 *   1. Empty / single-point trajectory renders nothing (null).
 *   2. ≥2 points renders exactly one <svg> with one <polyline>.
 *   3. Normalization: min value -> y=height (bottom), max value -> y=0 (top).
 *   4. A11y: SVG exposes role="img" and an Arabic aria-label.
 *   5. Zero chart-library imports in source file (hand-rolled SVG only).
 *
 * NOTE: Uses React.createElement directly (not JSX) because the project has
 * no .tsx vitest config; all existing co-located tests are .ts files.
 */

function render(props: {
  trajectory: readonly number[];
  width?: number;
  height?: number;
}): string {
  return renderToStaticMarkup(createElement(AwarenessTrajectory, props));
}

describe("AwarenessTrajectory — empty / degenerate cases", () => {
  it("renders nothing when trajectory is empty", () => {
    expect(render({ trajectory: [] })).toBe("");
  });

  it("renders nothing when trajectory has a single point (cannot draw a line)", () => {
    expect(render({ trajectory: [0.5] })).toBe("");
  });
});

describe("AwarenessTrajectory — SVG output shape", () => {
  it("renders exactly one <svg> with exactly one <polyline> for ≥2 points", () => {
    const html = render({ trajectory: [0.1, 0.9, 0.5] });
    const svgCount = (html.match(/<svg/g) ?? []).length;
    const polylineCount = (html.match(/<polyline/g) ?? []).length;
    expect(svgCount).toBe(1);
    expect(polylineCount).toBe(1);
  });

  it("min value is normalized to y=height (bottom) and max to y=0 (top)", () => {
    const html = render({ trajectory: [0, 1], width: 100, height: 50 });
    const match = html.match(/points="([^"]+)"/);
    expect(match).not.toBeNull();
    const points = (match![1] ?? "").split(/\s+/);
    expect(points.length).toBe(2);
    const [x0, y0] = points[0]!.split(",").map(Number);
    const [x1, y1] = points[1]!.split(",").map(Number);
    expect(x0).toBe(0);
    expect(y0).toBeCloseTo(50, 1); // min → bottom
    expect(x1).toBeCloseTo(100, 1);
    expect(y1).toBeCloseTo(0, 1); // max → top
  });

  it("handles constant trajectory without NaN / divide-by-zero", () => {
    const html = render({ trajectory: [0.5, 0.5, 0.5] });
    expect(html).toContain("<polyline");
    expect(html).not.toMatch(/NaN/);
  });
});

describe("AwarenessTrajectory — accessibility (NFR-02)", () => {
  it("exposes role=img and an Arabic aria-label", () => {
    const html = render({ trajectory: [0.2, 0.8] });
    expect(html).toContain('role="img"');
    const ariaMatch = html.match(/aria-label="([^"]+)"/);
    expect(ariaMatch).not.toBeNull();
    // Arabic characters: Unicode range U+0600–U+06FF.
    expect(ariaMatch![1]).toMatch(/[\u0600-\u06FF]/);
  });
});

describe("AwarenessTrajectory — no chart library imports (YIR-11, NFR-08)", () => {
  it("source file contains zero imports from recharts, chart.js, d3, or victory", () => {
    const src = readFileSync(
      resolve(__dirname, "AwarenessTrajectory.tsx"),
      "utf8",
    );
    expect(src).not.toMatch(/\brecharts\b/);
    expect(src).not.toMatch(/\bchart\.js\b/);
    expect(src).not.toMatch(/\bd3\b/);
    expect(src).not.toMatch(/\bvictory\b/);
  });
});
