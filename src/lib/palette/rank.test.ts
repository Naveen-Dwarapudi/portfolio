import { describe, expect, it } from "vitest";
import { getContent } from "@/content";
import { LOCALES } from "@/content/locales";
import { buildCommands } from "./commands";
import { paletteData } from "./data";
import { normalize, rankCommands, scoreText, withinOneEdit } from "./rank";

const commands = buildCommands(
  {
    ...paletteData(getContent("en")),
    locale: "en",
    path: "/",
    locales: LOCALES,
  },
  "dark",
);
const ids = (query: string) =>
  rankCommands(query, commands).commands.map((c) => c.id);
const best = (query: string) => {
  const r = rankCommands(query, commands);
  return r.commands[r.best]?.id;
};

describe("normalize", () => {
  it("lower-cases, strips diacritics and collapses spaces", () => {
    expect(normalize("  Résumé   PDF ")).toBe("resume pdf");
  });
});

describe("withinOneEdit", () => {
  it.each([
    ["linkedin", "linkedin", true],
    ["lnkedin", "linkedin", true], // deletion
    ["linkkedin", "linkedin", true], // insertion
    ["linkedon", "linkedin", true], // substitution
    ["lnikedin", "linkedin", true], // transposition
    ["lnkdin", "linkedin", false], // two edits
  ])("%s vs %s → %s", (a, b, expected) => {
    expect(withinOneEdit(a, b)).toBe(expected);
  });
});

describe("scoreText", () => {
  it("ranks prefix > word start > substring > subsequence > typo", () => {
    const prefix = scoreText("ware", "warehouse app");
    const wordStart = scoreText("app", "warehouse app");
    const substring = scoreText("rehou", "warehouse app");
    const subsequence = scoreText("wrhs", "warehouse app");
    const typo = scoreText("wraehouse", "warehouse");
    expect(prefix).toBeGreaterThan(wordStart);
    expect(wordStart).toBeGreaterThan(substring);
    expect(substring).toBeGreaterThan(subsequence);
    expect(subsequence).toBeGreaterThan(typo);
    expect(typo).toBeGreaterThan(0);
  });

  it("returns 0 for no match and for short typo-only queries", () => {
    expect(scoreText("zzz", "warehouse")).toBe(0);
    expect(scoreText("abd", "about")).toBe(0);
  });
});

describe("rankCommands", () => {
  it("returns every command in order for an empty query", () => {
    expect(rankCommands("   ", commands)).toEqual({ commands, best: 0 });
  });

  it("finds a case study by abbreviation", () => {
    expect(ids("wrhs")[0]).toBe("work:warehouse-mobile-migration");
  });

  it("forgives one typo", () => {
    expect(ids("lnkedin")).toContain("action:linkedin");
  });

  it("matches case-study domain and stack keywords", () => {
    expect(ids("pharma")[0]).toBe("work:pharma-enterprise-portals");
    expect(ids("react native")).toContain("work:warehouse-mobile-migration");
  });

  it("drops non-matches", () => {
    expect(ids("qqqqzz")).toEqual([]);
  });

  it("keeps groups in order: go to, actions, language", () => {
    const groups = rankCommands("e", commands).commands.map((c) => c.group);
    const order = ["goto", "actions", "language"];
    const indexes = groups.map((g) => order.indexOf(g));
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
  });

  it("hides loose matches when a strong one exists", () => {
    expect(ids("theme")).toEqual(["action:theme"]);
  });

  it("highlights the best match even when its group comes later", () => {
    expect(best("github")).toBe("action:github");
    expect(best("wrhs")).toBe("work:warehouse-mobile-migration");
  });
});
