import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OG_COLORS, THEME_COLORS } from "./colors";

// Share cards and theme-color can't use CSS variables, so they copy the
// tokens. Fail if globals.css changes and these don't.
const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const block = (selector: string) => {
  const start = css.indexOf(`${selector} {`);
  return css.slice(start, css.indexOf("}", start));
};
const token = (scope: string, name: string) =>
  new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i")
    .exec(scope)?.[1]
    ?.toLowerCase();

const dark = block(":root");
const light = block(':root[data-theme="light"]');

describe("share-card and theme colours match the tokens", () => {
  it.each([
    ["bg", "bg"],
    ["surface", "surface"],
    ["line", "line"],
    ["text", "text"],
    ["muted", "muted"],
    ["accent", "accent"],
  ] as const)("OG %s = dark --%s", (key, name) => {
    expect(OG_COLORS[key]).toBe(token(dark, name));
  });

  it("theme-color uses each theme's --bg", () => {
    expect(THEME_COLORS.dark).toBe(token(dark, "bg"));
    expect(THEME_COLORS.light).toBe(token(light, "bg"));
  });
});

describe("share-card renderer", () => {
  it("takes every colour from OG_COLORS (no stray literals)", () => {
    const card = readFileSync(
      join(process.cwd(), "src/lib/og/card.tsx"),
      "utf8",
    );
    expect(card).not.toMatch(/rgba?\(|["'`]#[0-9a-f]{3,8}/i);
  });
});
