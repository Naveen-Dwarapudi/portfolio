import {
  isTheme,
  nextTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/lib/theme";

// Client-only theme state, shared by the toggle and the command palette.

function readStored(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function currentTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (isTheme(attr)) return attr;
  return resolveTheme(
    readStored(),
    window.matchMedia("(prefers-color-scheme: light)").matches,
  );
}

const listeners = new Set<() => void>();

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: light)");
  media.addEventListener("change", listener);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", listener);
  };
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage unavailable (private mode): the choice lasts for this page only.
  }
  listeners.forEach((l) => l());
}

/**
 * Flips the theme with a circular wipe from `origin` (viewport px). Without
 * View Transitions, or with reduced motion, it switches instantly.
 */
export function switchTheme(origin: { x: number; y: number }) {
  const next = nextTheme(currentTheme());
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduce) {
    applyTheme(next);
    return;
  }
  const { x, y } = origin;
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
    // A second switch before this one is ready skips it; that's expected.
    .catch(() => {});
}
