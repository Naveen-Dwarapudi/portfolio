import { describe, expect, it } from "vitest";
import { homeContent } from "./en";

function collectStrings(
  value: unknown,
  path = "homeContent",
): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value))
    return value.flatMap((v, i) => collectStrings(v, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) =>
      collectStrings(v, `${path}.${k}`),
    );
  }
  return [];
}

const strings = collectStrings(homeContent);

describe("homeContent", () => {
  it("has no empty or whitespace-only strings", () => {
    const empty = strings.filter(([, s]) => s.trim() === "").map(([p]) => p);
    expect(empty).toEqual([]);
  });

  it("uses only absolute https URLs for external links", () => {
    const urls = strings.filter(([p]) => /(Url|url)$/.test(p));
    expect(urls.length).toBeGreaterThan(0);
    for (const [path, url] of urls) {
      expect(url, path).toMatch(/^https:\/\/[^\s]+$/);
    }
  });

  it("links the nav to home-page sections, so it works from any route", () => {
    const ids = ["about", "experience", "skills", "projects", "contact"];
    expect(homeContent.nav.map((n) => n.href)).toEqual(
      ids.map((id) => `/#${id}`),
    );
  });

  it("describes five engagements, each with highlights and a stack", () => {
    expect(homeContent.experience.engagements).toHaveLength(5);
    for (const e of homeContent.experience.engagements) {
      expect(e.highlights.length, e.title).toBeGreaterThanOrEqual(2);
      expect(e.stack.length, e.title).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps the nine resume skill groups in resume order", () => {
    expect(homeContent.skills.groups.map((g) => g.name)).toEqual([
      "Frontend Development",
      "Backend & APIs",
      "Databases",
      "Testing",
      "Mobile Development",
      "Cloud & DevOps",
      "Monitoring & Analytics",
      "Project Tools",
      "AI-Assisted Development",
    ]);
  });

  it("never shows a phone number", () => {
    const phoneLike = strings.filter(([, s]) => /\+?\d[\d\s-]{8,}\d/.test(s));
    expect(phoneLike).toEqual([]);
  });
});
