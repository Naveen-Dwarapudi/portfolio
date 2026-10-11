/**
 * Every language the site knows about. Only published locales are served
 * (Proxy 404s the rest) and linked from the switcher; unpublished ones show
 * there as "Coming soon". Publishing a language: see the runbook in
 * docs/superpowers/specs/2026-10-10-i18n-design.md §6.
 */
export const LOCALES = [
  {
    code: "en",
    nativeName: "English",
    englishName: "English",
    htmlLang: "en",
    published: true,
  },
  {
    code: "hi",
    nativeName: "हिन्दी",
    englishName: "Hindi",
    htmlLang: "hi",
    published: false,
  },
  {
    code: "te",
    nativeName: "తెలుగు",
    englishName: "Telugu",
    htmlLang: "te",
    published: false,
  },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];
export type LocaleInfo = {
  code: Locale;
  nativeName: string;
  /** For search (command palette): "hindi" finds हिन्दी. */
  englishName: string;
  htmlLang: string;
  published: boolean;
};

/** Served without a URL prefix (`/`, `/work/…`). */
export const DEFAULT_LOCALE: Locale = "en";
