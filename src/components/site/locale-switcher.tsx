import type { Locale, LocaleInfo } from "@/content/locales";
import { localizedPath } from "@/lib/i18n";

/**
 * Native <details> disclosure (zero JS). Current language is marked; published
 * languages link to the same page; unpublished ones show "Coming soon".
 */
export function LocaleSwitcher({
  current,
  path,
  locales,
  labels,
}: {
  current: Locale;
  /** Locale-free path of this page, e.g. "/" or "/work/x". */
  path: string;
  locales: readonly LocaleInfo[];
  labels: { languageLabel: string; comingSoon: string };
}) {
  const active = locales.find((l) => l.code === current);
  return (
    <details className="group relative">
      <summary
        aria-label={`${labels.languageLabel}: ${active?.nativeName ?? current}`}
        className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-line px-3 text-sm text-muted transition-colors hover:text-text [&::-webkit-details-marker]:hidden"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
        </svg>
        <span lang={active?.htmlLang}>{active?.nativeName}</span>
      </summary>
      <ul className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-[0_16px_40px_-20px_rgb(0_0_0/0.6)]">
        {locales.map((l) => (
          <li key={l.code}>
            {l.code === current ? (
              <span
                aria-current="true"
                lang={l.htmlLang}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-text"
              >
                {l.nativeName}
                <span aria-hidden="true" className="text-accent">
                  ✓
                </span>
              </span>
            ) : l.published ? (
              <a
                href={localizedPath(l.code, path)}
                lang={l.htmlLang}
                hrefLang={l.htmlLang}
                className="block rounded-lg px-3 py-2 text-sm text-text transition-colors hover:bg-surface-2"
              >
                {l.nativeName}
              </a>
            ) : (
              <span
                aria-disabled="true"
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-muted"
              >
                <span lang={l.htmlLang}>{l.nativeName}</span>
                <span className="font-mono text-[11px] tracking-[0.06em] uppercase">
                  {labels.comingSoon}
                </span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
