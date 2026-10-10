import { describe, expect, it } from "vitest";
import {
  isLocale,
  localeInfo,
  localizedPath,
  publishedLocales,
  splitLocale,
} from "./i18n";

describe("isLocale", () => {
  it("accepts known locale codes only", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("hi")).toBe(true);
    expect(isLocale("te")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("work")).toBe(false);
    expect(isLocale("")).toBe(false);
  });
});

describe("localizedPath", () => {
  it("keeps English unprefixed", () => {
    expect(localizedPath("en", "/")).toBe("/");
    expect(localizedPath("en", "/work/x")).toBe("/work/x");
    expect(localizedPath("en", "/#about")).toBe("/#about");
  });

  it("prefixes other locales without a trailing slash or slash-before-hash", () => {
    expect(localizedPath("hi", "/")).toBe("/hi");
    expect(localizedPath("te", "/work/x")).toBe("/te/work/x");
    expect(localizedPath("hi", "/#about")).toBe("/hi#about");
  });

  it("tolerates a path without a leading slash", () => {
    expect(localizedPath("hi", "work/x")).toBe("/hi/work/x");
  });
});

describe("splitLocale", () => {
  it("returns no locale for unprefixed paths", () => {
    expect(splitLocale("/")).toEqual({ locale: null, rest: "/" });
    expect(splitLocale("/work/x")).toEqual({ locale: null, rest: "/work/x" });
  });

  it("splits a leading locale and normalises the rest", () => {
    expect(splitLocale("/hi")).toEqual({ locale: "hi", rest: "/" });
    expect(splitLocale("/hi/")).toEqual({ locale: "hi", rest: "/" });
    expect(splitLocale("/en/work/x")).toEqual({
      locale: "en",
      rest: "/work/x",
    });
    expect(splitLocale("/te/work/x/")).toEqual({
      locale: "te",
      rest: "/work/x",
    });
  });

  it("round-trips with localizedPath for every locale", () => {
    for (const locale of ["en", "hi", "te"] as const) {
      for (const path of ["/", "/work/pharma-enterprise-portals"]) {
        const { rest } = splitLocale(localizedPath(locale, path));
        expect(rest, `${locale} ${path}`).toBe(path);
      }
    }
  });
});

describe("publishedLocales / localeInfo", () => {
  it("publishes only English for now", () => {
    expect(publishedLocales().map((l) => l.code)).toEqual(["en"]);
  });

  it("filters any list it is given", () => {
    const list = [
      { code: "en", nativeName: "English", htmlLang: "en", published: true },
      { code: "hi", nativeName: "हिन्दी", htmlLang: "hi", published: true },
      { code: "te", nativeName: "తెలుగు", htmlLang: "te", published: false },
    ] as const;
    expect(publishedLocales(list).map((l) => l.code)).toEqual(["en", "hi"]);
  });

  it("describes each locale", () => {
    expect(localeInfo("te")).toMatchObject({
      nativeName: "తెలుగు",
      htmlLang: "te",
    });
  });
});
