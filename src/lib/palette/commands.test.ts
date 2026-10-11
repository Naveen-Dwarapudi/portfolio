import { describe, expect, it } from "vitest";
import { getContent } from "@/content";
import { homeContent, caseStudies } from "@/content/en";
import { LOCALES, type LocaleInfo } from "@/content/locales";
import { RESUME_PATH } from "@/lib/resume";
import { buildCommands, type PaletteInput } from "./commands";
import { paletteData } from "./data";

function input(overrides: Partial<PaletteInput> = {}): PaletteInput {
  return {
    ...paletteData(getContent("en")),
    locale: "en",
    path: "/",
    locales: LOCALES,
    ...overrides,
  };
}
const byId = (cmds: ReturnType<typeof buildCommands>, id: string) =>
  cmds.find((c) => c.id === id)!;

describe("paletteData", () => {
  it("derives case-study keywords from the kicker and stack", () => {
    const data = paletteData(getContent("en"));
    const pharma = data.caseStudies.find(
      (c) => c.slug === "pharma-enterprise-portals",
    )!;
    expect(pharma.keywords).toContain("Pharma");
    expect(pharma.keywords).toContain("React.js");
    expect(data.resumePath).toBe(RESUME_PATH);
    expect(data.email).toBe(homeContent.contact.email);
  });
});

describe("buildCommands", () => {
  it("lists every section and every case study under Go to", () => {
    const cmds = buildCommands(input(), "dark");
    const goto = cmds.filter((c) => c.group === "goto").map((c) => c.label);
    expect(goto).toEqual([
      ...homeContent.nav.map((n) => n.label),
      ...caseStudies.map((s) => s.title),
    ]);
  });

  it("localizes section and case-study links", () => {
    const en = buildCommands(input(), "dark");
    expect(byId(en, "section:about").run).toEqual({
      kind: "link",
      href: "/#about",
    });
    const hi = buildCommands(input({ locale: "hi" }), "dark");
    expect(byId(hi, "section:about").run).toEqual({
      kind: "link",
      href: "/hi#about",
    });
    expect(byId(hi, "work:workflow-portal").run).toEqual({
      kind: "link",
      href: "/hi/work/workflow-portal",
    });
  });

  it("offers the opposite theme", () => {
    expect(byId(buildCommands(input(), "dark"), "action:theme").label).toBe(
      homeContent.palette.switchTheme.light,
    );
    expect(byId(buildCommands(input(), "light"), "action:theme").label).toBe(
      homeContent.palette.switchTheme.dark,
    );
  });

  it("marks external links, the resume download and the email copy", () => {
    const cmds = buildCommands(input(), "dark");
    expect(byId(cmds, "action:github").run).toEqual({
      kind: "link",
      href: homeContent.contact.github.url,
      external: true,
    });
    expect(byId(cmds, "action:resume").run).toEqual({
      kind: "link",
      href: RESUME_PATH,
      download: true,
    });
    expect(byId(cmds, "action:copy-email").run).toEqual({
      kind: "copy",
      text: homeContent.contact.email,
    });
  });

  it("marks the current language and disables unpublished ones", () => {
    const cmds = buildCommands(input(), "dark");
    expect(byId(cmds, "language:en")).toMatchObject({ current: true });
    expect(byId(cmds, "language:hi")).toMatchObject({
      disabled: true,
      hint: homeContent.site.comingSoon,
      lang: "hi",
    });
  });

  it("links a published language to the same page", () => {
    const locales: LocaleInfo[] = LOCALES.map((l) =>
      l.code === "hi" ? { ...l, published: true } : l,
    );
    const cmds = buildCommands(
      input({ locales, path: "/work/workflow-portal" }),
      "dark",
    );
    expect(byId(cmds, "language:hi").run).toEqual({
      kind: "link",
      href: "/hi/work/workflow-portal",
    });
  });
});
