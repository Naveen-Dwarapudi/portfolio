import { PaletteTrigger } from "@/components/palette/palette-trigger";
import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { SectionNav } from "@/components/site/section-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Container } from "@/components/ui/container";
import { LOCALES, type Locale } from "@/content/locales";
import type { HomeContent } from "@/content/types";
import { localizedPath } from "@/lib/i18n";
import type { PaletteData } from "@/lib/palette/commands";

export function SiteHeader({
  site,
  nav,
  locale,
  path,
  palette,
}: {
  site: HomeContent["site"];
  nav: HomeContent["nav"];
  locale: Locale;
  /** Locale-free path of the current page, for the language switcher. */
  path: string;
  palette: PaletteData;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-md">
      <Container className="flex items-center justify-between gap-4 py-4">
        {/* Visible "ND." stays in the accessible name (WCAG 2.5.3). */}
        <a
          href={localizedPath(locale, "/")}
          className="font-display text-xl font-extrabold tracking-[-0.04em]"
        >
          ND<span className="text-accent">.</span>
          <span className="sr-only"> {site.homeLabel}</span>
        </a>
        <div className="flex items-center gap-3 md:gap-6">
          {/* Highlights the section in view on the home page only. */}
          <SectionNav
            label={site.navLabel}
            spy={path === "/"}
            items={nav.map((item) => ({
              id: item.href.slice(2),
              label: item.label,
              href: localizedPath(locale, item.href),
            }))}
          />
          <PaletteTrigger
            input={{ ...palette, locale, path, locales: LOCALES }}
          />
          <LocaleSwitcher
            current={locale}
            path={path}
            locales={LOCALES}
            labels={site}
          />
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}
