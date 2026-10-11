import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The `accent` button variant draws accent text on an opaque accent tint
// (mixed into --surface) and fills solid accent on hover. Project cards draw
// accent text over a spotlight glow (--card-glow) on --surface. Check every
// pair meets AA (4.5:1) in both themes, from the real tokens in globals.css.

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const button = readFileSync(
  join(process.cwd(), "src/components/ui/button.tsx"),
  "utf8",
);
/** The accent variant's opaque tint, "var(--accent)_8%" in its class → 0.08. */
const TINT = Number(/var\(--accent\)_(\d+)%/.exec(button)![1]) / 100;

function block(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  return css.slice(start, css.indexOf("}", start));
}

function token(scope: string, name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i").exec(scope);
  if (!match) throw new Error(`--${name} not found`);
  return match[1]!;
}

type Rgb = [number, number, number];
const rgb = (hex: string): Rgb =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
const mix = (top: Rgb, under: Rgb, alpha: number): Rgb =>
  top.map((c, i) => c * alpha + under[i]! * (1 - alpha)) as Rgb;
const luminance = (c: Rgb) => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

const themes = {
  dark: block(":root"),
  light: block(':root[data-theme="light"]'),
};

describe.each(Object.entries(themes))("accent button (%s)", (_, scope) => {
  const accent = rgb(token(scope, "accent"));
  const onAccent = rgb(token(scope, "on-accent"));

  const surface = rgb(token(scope, "surface"));

  it("accent text on the opaque tint ≥ 4.5:1 (any background)", () => {
    expect(contrast(accent, mix(accent, surface, TINT))).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("accent text on a card under the full spotlight glow ≥ 4.5:1", () => {
    const glow = Number(/--card-glow:\s*(\d+)%/.exec(scope)![1]) / 100;
    expect(contrast(accent, mix(accent, surface, glow))).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("on-accent text on the solid hover fill ≥ 4.5:1", () => {
    expect(contrast(onAccent, accent)).toBeGreaterThanOrEqual(4.5);
  });
});
