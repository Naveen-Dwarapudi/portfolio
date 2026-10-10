import {
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
  type LocaleInfo,
} from "@/content/locales";

const CODES = new Set<string>(LOCALES.map((l) => l.code));

export function isLocale(value: string): value is Locale {
  return CODES.has(value);
}

export function publishedLocales(
  list: readonly LocaleInfo[] = LOCALES,
): readonly LocaleInfo[] {
  return list.filter((l) => l.published);
}

export function localeInfo(code: Locale): LocaleInfo {
  const info = LOCALES.find((l) => l.code === code);
  if (!info) throw new Error(`Unknown locale: ${code}`);
  return info;
}

/** URL for `path` (e.g. "/work/x") in `locale`; the default locale has no prefix. */
export function localizedPath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  if (clean === "/") return `/${locale}`;
  // "/#about" → "/hi#about" (home-page anchors)
  if (clean.startsWith("/#")) return `/${locale}${clean.slice(1)}`;
  return `/${locale}${clean}`;
}

/** Splits a leading locale segment off a pathname, if there is one. */
export function splitLocale(pathname: string): {
  locale: Locale | null;
  rest: string;
} {
  const [, first = "", ...more] = pathname.split("/");
  if (!isLocale(first)) return { locale: null, rest: pathname || "/" };
  const rest = `/${more.join("/")}`;
  return {
    locale: first,
    rest: rest.length > 1 && rest.endsWith("/") ? rest.slice(0, -1) : rest,
  };
}
