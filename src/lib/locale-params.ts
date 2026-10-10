import { notFound } from "next/navigation";
import type { Locale } from "@/content/locales";
import { isLocale, publishedLocales } from "@/lib/i18n";

/** Static params for `[lang]`: published locales only. */
export function localeParams() {
  return publishedLocales().map((l) => ({ lang: l.code }));
}

/** The route's locale, or a 404 if it isn't a published locale. */
export function requirePublishedLocale(lang: string): Locale {
  if (!isLocale(lang) || !publishedLocales().some((l) => l.code === lang)) {
    notFound();
  }
  return lang;
}
