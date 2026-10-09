import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Container } from "@/components/ui/container";

export function SiteHeader() {
  return (
    <header className="relative z-10">
      <Container className="flex items-center justify-between py-5">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- removed in Task 7 */}
        <a
          href="/"
          aria-label="Naveen Dwarapudi, home"
          className="font-display text-xl font-extrabold tracking-[-0.04em]"
        >
          ND<span className="text-accent">.</span>
        </a>
        <ThemeToggle />
      </Container>
    </header>
  );
}
