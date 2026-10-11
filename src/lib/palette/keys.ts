/** Keyboard helpers shared by the palette trigger and the palette. */

/** True while an IME is composing (Safari reports keyCode 229 instead). */
export const composing = (e: { isComposing: boolean; keyCode: number }) =>
  e.isComposing || e.keyCode === 229;

/**
 * ⌘K on Apple devices, Ctrl+K elsewhere (Ctrl+K on a Mac is the system
 * "delete to end of line" in text fields). Matched by the typed letter, or by
 * the physical K key when the layout types a non-Latin character. Repeats,
 * Shift/Alt and IME composition are ignored.
 */
export function isPaletteShortcut(e: KeyboardEvent, apple: boolean): boolean {
  const mod = apple ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
  // Modifier first: synthetic keydowns (e.g. Chrome autofill) carry no key.
  if (!mod || composing(e) || e.repeat || e.altKey || e.shiftKey) return false;
  const key = typeof e.key === "string" ? e.key : "";
  // The typed letter wins on Latin layouts (so Dvorak's Ctrl+T stays "new
  // tab"); the physical K key is the fallback only for non-Latin layouts.
  return /^[a-z]$/i.test(key) ? key.toLowerCase() === "k" : e.code === "KeyK";
}
