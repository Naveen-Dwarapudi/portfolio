import { buttonClass } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { TextLink } from "@/components/ui/text-link";
import { CopyrightYear } from "./copyright-year";
import type { HomeContent } from "@/content/types";

export function SiteFooter({
  footer,
  newTabLabel,
}: {
  footer: HomeContent["footer"];
  newTabLabel: string;
}) {
  return (
    <footer className="border-t border-line">
      <Container className="flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-muted">
        <p>
          © <CopyrightYear /> {footer.name} · {footer.builtWith} ·{" "}
          <TextLink href={footer.sourceUrl} newTabLabel={newTabLabel}>
            {footer.sourceLabel}
          </TextLink>
        </p>
        <a href="#top" className={buttonClass("secondary", "sm")}>
          {footer.backToTop}
          <span
            aria-hidden="true"
            className="transition-transform duration-300 ease-spring group-hover:-translate-y-0.5"
          >
            ↑
          </span>
        </a>
      </Container>
    </footer>
  );
}
