import { describe, expect, it } from "vitest";
import { getContent } from ".";
import * as en from "./en";
import { DEFAULT_LOCALE, LOCALES } from "./locales";

describe("locales", () => {
  it("has unique codes and a published default", () => {
    const codes = LOCALES.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(LOCALES.find((l) => l.code === DEFAULT_LOCALE)?.published).toBe(
      true,
    );
  });

  it("keeps Hindi and Telugu unpublished until translated and reviewed", () => {
    expect(LOCALES.filter((l) => l.published).map((l) => l.code)).toEqual([
      "en",
    ]);
  });
});

describe("getContent", () => {
  it("serves the English content for every locale until translations exist", () => {
    for (const { code } of LOCALES) {
      const c = getContent(code);
      expect(c.homeContent, code).toBe(en.homeContent);
      expect(c.caseStudies, code).toBe(en.caseStudies);
      expect(c.caseStudyUi, code).toBe(en.caseStudyUi);
    }
  });
});
