export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/** Effective theme: a stored choice wins; otherwise the OS preference; otherwise dark. */
export function resolveTheme(
  stored: string | null,
  prefersLight: boolean,
): Theme {
  if (isTheme(stored)) return stored;
  return prefersLight ? "light" : "dark";
}

export function nextTheme(current: Theme): Theme {
  return current === "dark" ? "light" : "dark";
}

/**
 * Runs inline in <head> before first paint. Only applies a stored choice;
 * with no choice, CSS follows prefers-color-scheme on its own.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
