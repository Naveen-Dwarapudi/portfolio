"use client";

import { useSyncExternalStore } from "react";
import { nextTheme } from "@/lib/theme";
import { currentTheme, subscribeTheme, switchTheme } from "@/lib/theme-switch";

/**
 * Where the circular wipe starts: the pointer for mouse clicks, the button's
 * centre for keyboard activation (detail === 0 reports clientX/Y as 0,0).
 */
export function wipeOrigin(
  event: { clientX: number; clientY: number; detail: number },
  rect: DOMRect,
): { x: number; y: number } {
  if (event.detail === 0) {
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }
  return { x: event.clientX, y: event.clientY };
}

export function ThemeToggle() {
  // Server snapshot is null: the label renders after hydration to avoid a mismatch.
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, () => null);
  const target = theme ? nextTheme(theme) : null;

  function onClick(event: React.MouseEvent<HTMLButtonElement>) {
    switchTheme(wipeOrigin(event, event.currentTarget.getBoundingClientRect()));
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={target ? `Switch to ${target} theme` : "Toggle theme"}
      className="inline-flex size-10 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:text-text"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </svg>
    </button>
  );
}
