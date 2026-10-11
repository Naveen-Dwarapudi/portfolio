import { describe, expect, it } from "vitest";
import { composing, isPaletteShortcut } from "./keys";

const key = (init: KeyboardEventInit & { keyCode?: number }) => {
  const e = new KeyboardEvent("keydown", init);
  if (init.keyCode !== undefined)
    Object.defineProperty(e, "keyCode", { value: init.keyCode });
  return e;
};

describe("isPaletteShortcut", () => {
  it("is Ctrl+K off Apple devices, and not ⌘K there", () => {
    expect(
      isPaletteShortcut(key({ key: "k", code: "KeyK", ctrlKey: true }), false),
    ).toBe(true);
    expect(
      isPaletteShortcut(key({ key: "k", code: "KeyK", metaKey: true }), false),
    ).toBe(false);
  });

  it("is ⌘K on Apple devices, leaving Ctrl+K to text editing", () => {
    expect(
      isPaletteShortcut(key({ key: "k", code: "KeyK", metaKey: true }), true),
    ).toBe(true);
    expect(
      isPaletteShortcut(key({ key: "k", code: "KeyK", ctrlKey: true }), true),
    ).toBe(false);
  });

  it("matches the physical K key on non-Latin layouts", () => {
    // Cyrillic layout: the K key types "л".
    expect(
      isPaletteShortcut(key({ key: "л", code: "KeyK", ctrlKey: true }), false),
    ).toBe(true);
  });

  it.each([
    ["Shift", { shiftKey: true }],
    ["Alt", { altKey: true }],
    ["a repeat", { repeat: true }],
    ["IME composition", { isComposing: true }],
    ["Safari IME (keyCode 229)", { keyCode: 229 }],
  ])("ignores %s", (_, extra) => {
    expect(
      isPaletteShortcut(
        key({ key: "k", code: "KeyK", ctrlKey: true, ...extra }),
        false,
      ),
    ).toBe(false);
  });

  it("follows the typed letter on remapped Latin layouts (Dvorak)", () => {
    // Dvorak: the physical K key types "t"; Ctrl+T must stay "new tab".
    expect(
      isPaletteShortcut(key({ key: "t", code: "KeyK", ctrlKey: true }), false),
    ).toBe(false);
    // ...and the key that types "k" (physical V) opens the palette.
    expect(
      isPaletteShortcut(key({ key: "k", code: "KeyV", ctrlKey: true }), false),
    ).toBe(true);
  });

  it("doesn't throw on synthetic keydowns without key or code (autofill)", () => {
    const e = new Event("keydown") as KeyboardEvent;
    expect(() => isPaletteShortcut(e, false)).not.toThrow();
    expect(isPaletteShortcut(e, false)).toBe(false);
  });

  it("ignores other keys", () => {
    expect(
      isPaletteShortcut(key({ key: "j", code: "KeyJ", ctrlKey: true }), false),
    ).toBe(false);
  });
});

describe("composing", () => {
  it("is true for isComposing or keyCode 229", () => {
    expect(composing({ isComposing: true, keyCode: 0 })).toBe(true);
    expect(composing({ isComposing: false, keyCode: 229 })).toBe(true);
    expect(composing({ isComposing: false, keyCode: 13 })).toBe(false);
  });
});
