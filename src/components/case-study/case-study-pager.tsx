import { Container } from "@/components/ui/container";
import { TextLink } from "@/components/ui/text-link";
import type { CaseStudy, CaseStudyUi } from "@/content/types";

export function CaseStudyPager({
  previous,
  next,
  ui,
}: {
  previous: CaseStudy;
  next: CaseStudy;
  ui: CaseStudyUi;
}) {
  return (
    <nav aria-label={ui.pagerLabel} className="border-t border-line">
      <Container className="grid gap-6 py-12 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <a
          href={`/work/${previous.slug}`}
          className="group block rounded-[14px] border border-line p-5 transition-colors hover:border-accent/45"
        >
          <span className="font-mono text-label tracking-[0.1em] text-muted uppercase">
            <span aria-hidden="true">← </span>
            {ui.previous}
          </span>
          <span className="mt-1.5 block font-display text-h3 font-extrabold tracking-[-0.02em]">
            {previous.title}
          </span>
        </a>
        <TextLink href="/#experience" className="justify-self-center text-sm">
          {ui.backToWork}
        </TextLink>
        <a
          href={`/work/${next.slug}`}
          className="group block rounded-[14px] border border-line p-5 text-right transition-colors hover:border-accent/45"
        >
          <span className="font-mono text-label tracking-[0.1em] text-muted uppercase">
            {ui.next}
            <span aria-hidden="true"> →</span>
          </span>
          <span className="mt-1.5 block font-display text-h3 font-extrabold tracking-[-0.02em]">
            {next.title}
          </span>
        </a>
      </Container>
    </nav>
  );
}
