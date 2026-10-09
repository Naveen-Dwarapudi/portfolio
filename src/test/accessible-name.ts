/**
 * jsdom's accessible-name algorithm drops whitespace at an sr-only span
 * boundary ("Live site(opens in a new tab)"), unlike browsers. Match names that
 * end in a screen-reader-only suffix with optional whitespace; the exact names
 * are asserted in Chromium by e2e/home.spec.ts.
 */
export function nameWithSuffix(text: string, suffix: string): RegExp {
  const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escape(text)}\\s*${escape(suffix)}$`);
}
