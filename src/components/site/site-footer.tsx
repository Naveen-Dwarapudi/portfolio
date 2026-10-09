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
        <TextLink href="#top">{footer.backToTop}</TextLink>
      </Container>
    </footer>
  );
}
