/**
 * Share-card colours. ImageResponse can't read CSS custom properties, so these
 * copy the dark theme tokens from globals.css (src/lib/og/colors.test.ts
 * fails if they drift).
 */
export const OG_COLORS = {
  bg: "#0b0d12",
  surface: "#141821",
  line: "#262b36",
  text: "#e7e9ee",
  muted: "#9aa3b2",
  accent: "#ff8a3d",
} as const;

/** Browser UI colour per scheme (the --bg token of each theme). */
export const THEME_COLORS = { dark: "#0b0d12", light: "#f6f7f9" } as const;
