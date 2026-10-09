"use client";

import { useSyncExternalStore } from "react";
import {
  isTheme,
  nextTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/lib/theme";

function readStored(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function currentTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (isTheme(attr)) return attr;
  return resolveTheme(
    readStored(),
    window.matchMedia("(prefers-color-scheme: light)").matches,
  );
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: light)");
  media.addEventListener("change", listener);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", listener);
  };
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage unavailable (private mode): the choice lasts for this page only.
  }
  listeners.forEach((l) => l());
}

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
  const theme = useSyncExternalStore(subscribe, currentTheme, () => null);
  const target = theme ? nextTheme(theme) : null;

  function onClick(event: React.MouseEvent<HTMLButtonElement>) {
    const next = nextTheme(currentTheme());
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!document.startViewTransition || reduce) {
      applyTheme(next);
      return;
    }
    const { x, y } = wipeOrigin(
      event,
      event.currentTarget.getBoundingClientRect(),
    );
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );
    // Scopes the "no default cross-fade" CSS to this wipe only, so page-to-page
    // navigation keeps the browser's cross-fade (globals.css).
    const root = document.documentElement;
    root.classList.add("theme-wipe");
    const transition = document.startViewTransition(() => applyTheme(next));
    transition.finished
      .finally(() => root.classList.remove("theme-wipe"))
      .catch(() => {});
    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 650,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      // A second click before this one is ready skips it; that's expected.
      .catch(() => {});
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
