import { describe, expect, it } from "vitest";
import { EXCLUDED_PATH_PREFIXES, isExcludedPath } from "./excludedPaths";

describe("isExcludedPath", () => {
  describe("sacred paths (excluded)", () => {
    it("excludes /day exactly", () => {
      expect(isExcludedPath("/day")).toBe(true);
    });

    it("excludes /day/7", () => {
      expect(isExcludedPath("/day/7")).toBe(true);
    });

    it("excludes /reflection/abc", () => {
      expect(isExcludedPath("/reflection/abc")).toBe(true);
    });

    it("excludes /book", () => {
      expect(isExcludedPath("/book")).toBe(true);
    });

    it("excludes /book/chapter-1", () => {
      expect(isExcludedPath("/book/chapter-1")).toBe(true);
    });

    it("excludes /program/day/5", () => {
      expect(isExcludedPath("/program/day/5")).toBe(true);
    });

    it("excludes /api/guide/ask", () => {
      expect(isExcludedPath("/api/guide/ask")).toBe(true);
    });

    it("excludes /guide/session/1", () => {
      expect(isExcludedPath("/guide/session/1")).toBe(true);
    });
  });

  describe("non-sacred paths (allowed)", () => {
    it("allows /", () => {
      expect(isExcludedPath("/")).toBe(false);
    });

    it("allows /pricing", () => {
      expect(isExcludedPath("/pricing")).toBe(false);
    });

    it("allows /account", () => {
      expect(isExcludedPath("/account")).toBe(false);
    });

    it("allows /program (only /program/day/* is excluded)", () => {
      expect(isExcludedPath("/program")).toBe(false);
    });
  });

  describe("EXCLUDED_PATH_PREFIXES export", () => {
    it("exposes the prefix array for Plan 06.06 CI grep reuse", () => {
      expect(Array.isArray(EXCLUDED_PATH_PREFIXES)).toBe(true);
      expect(EXCLUDED_PATH_PREFIXES).toContain("/day");
      expect(EXCLUDED_PATH_PREFIXES).toContain("/reflection");
      expect(EXCLUDED_PATH_PREFIXES).toContain("/book");
      expect(EXCLUDED_PATH_PREFIXES).toContain("/program/day");
      expect(EXCLUDED_PATH_PREFIXES).toContain("/api/guide");
      expect(EXCLUDED_PATH_PREFIXES).toContain("/guide");
    });
  });
});
