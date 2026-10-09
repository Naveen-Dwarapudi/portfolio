import { describe, expect, it } from "vitest";
import { isTheme, nextTheme, resolveTheme, themeInitScript } from "./theme";

describe("resolveTheme", () => {
  it("uses a stored light choice even when the OS prefers dark", () => {
    expect(resolveTheme("light", false)).toBe("light");
  });

  it("uses a stored dark choice even when the OS prefers light", () => {
    expect(resolveTheme("dark", true)).toBe("dark");
  });

  it("follows the OS when nothing is stored", () => {
    expect(resolveTheme(null, true)).toBe("light");
    expect(resolveTheme(null, false)).toBe("dark");
  });

  it("ignores a garbage stored value and follows the OS", () => {
    expect(resolveTheme("blue", true)).toBe("light");
    expect(resolveTheme("", false)).toBe("dark");
  });
});

describe("nextTheme", () => {
  it("flips between light and dark", () => {
    expect(nextTheme("dark")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
  });
});

describe("isTheme", () => {
  it("accepts only light and dark", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("system")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });
});

describe("themeInitScript", () => {
  function run(stored: string | null) {
    document.documentElement.removeAttribute("data-theme");
    if (stored === null) localStorage.removeItem("theme");
    else localStorage.setItem("theme", stored);
    new Function(themeInitScript)();
    return document.documentElement.getAttribute("data-theme");
  }

  it("applies a stored valid choice", () => {
    expect(run("light")).toBe("light");
    expect(run("dark")).toBe("dark");
  });

  it("leaves the attribute unset when nothing valid is stored", () => {
    expect(run(null)).toBeNull();
    expect(run("blue")).toBeNull();
  });
});
