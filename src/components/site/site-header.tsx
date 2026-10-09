import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Container } from "@/components/ui/container";
import type { HomeContent } from "@/content/types";

export function SiteHeader({
  site,
  nav,
}: {
  site: HomeContent["site"];
  nav: HomeContent["nav"];
}) {
  return (
    <header className="relative z-10">
      <Container className="flex items-center justify-between py-5">
        {/* Visible "ND." stays in the accessible name (WCAG 2.5.3). */}
        <a
          href="/"
          className="font-display text-xl font-extrabold tracking-[-0.04em]"
        >
          ND<span className="text-accent">.</span>
          <span className="sr-only"> {site.homeLabel}</span>
        </a>
        <div className="flex items-center gap-6">
          <nav aria-label={site.navLabel} className="hidden md:block">
            <ul className="flex gap-6 text-sm text-muted">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="transition-colors hover:text-text"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}
