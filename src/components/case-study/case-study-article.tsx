import { InteractiveCard } from "@/components/motion/pointer-effects";
import { BrowserFrame } from "@/components/ui/browser-frame";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Container } from "@/components/ui/container";
import { Screenshot } from "@/components/ui/screenshot";
import { screenshots } from "@/components/ui/screenshots";
import type { CaseStudy, CaseStudyUi } from "@/content/types";
import type { ReactNode } from "react";

function Part({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="border-t border-line py-12"
    >
      <h2
        id={`${id}-heading`}
        className="font-display text-h3 font-extrabold tracking-[-0.02em]"
      >
        <span
          aria-hidden="true"
          className="mr-3 font-mono text-label text-accent"
        >
          {String(index).padStart(2, "0")}
        </span>
        {title}
      </h2>
      <div className="mt-5 max-w-[720px] text-muted">{children}</div>
    </section>
  );
}

export function CaseStudyArticle({
  study,
  ui,
  newTabLabel,
}: {
  study: CaseStudy;
  ui: CaseStudyUi;
  newTabLabel: string;
}) {
  const s = ui.sections;
  return (
    <article>
      <header className="pt-10 pb-12">
        <Container>
          <p className="kicker fade-up">{study.kicker}</p>
          <h1 className="fade-up mt-4 font-display text-[clamp(2.25rem,6vw,4rem)] leading-[1] font-extrabold tracking-[-0.04em]">
            {study.title}
          </h1>
          <p className="fade-up mt-5 max-w-[680px] text-lg text-muted">
            {study.summary}
          </p>
          <ul className="fade-up mt-6 flex flex-wrap gap-2">
            <li>
              <Chip>{`${ui.roleLabel}: ${study.facts.role}`}</Chip>
            </li>
            <li>
              <Chip>{`${ui.platformLabel}: ${study.facts.platform}`}</Chip>
            </li>
          </ul>
        </Container>
      </header>

      {study.live ? (
        <Container className="pb-12">
          <BrowserFrame>
            <Screenshot
              src={screenshots[study.live.image]}
              alt={study.live.imageAlt}
              sizes="(max-width: 1040px) 100vw, 992px"
              eager
            />
          </BrowserFrame>
          <div className="mt-6">
            <ButtonLink
              href={study.live.url}
              arrow="↗"
              newTabLabel={newTabLabel}
              aria-label={`${ui.liveSite}: ${study.title} ${newTabLabel}`}
            >
              {ui.liveSite}
            </ButtonLink>
          </div>
        </Container>
      ) : null}

      <Container>
        <Part id="context" index={1} title={s.context}>
          <p>{study.context}</p>
        </Part>
        <Part id="role" index={2} title={s.role}>
          <p>{study.role}</p>
        </Part>
        <Part id="problem" index={3} title={s.problem}>
          <p>{study.problem}</p>
        </Part>
        <Part id="approach" index={4} title={s.approach}>
          <ol className="list-decimal space-y-3 pl-5 marker:font-mono marker:text-accent">
            {study.approach.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </Part>
        <Part id="decisions" index={5} title={s.decisions}>
          <ul className="grid gap-4 md:grid-cols-2">
            {study.decisions.map((d) => (
              <li key={d.decision}>
                <InteractiveCard className="h-full">
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="kicker">{ui.decisionLabel}</dt>
                      <dd className="mt-1 text-base text-text">{d.decision}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-label tracking-[0.1em] text-muted uppercase">
                        {ui.tradeoffLabel}
                      </dt>
                      <dd className="mt-1">{d.tradeoff}</dd>
                    </div>
                  </dl>
                </InteractiveCard>
              </li>
            ))}
          </ul>
        </Part>
        <Part id="impact" index={6} title={s.impact}>
          <ul className="bullets space-y-2 text-text">
            {study.impact.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Part>
        <Part id="stack" index={7} title={s.stack}>
          <ul className="flex flex-wrap gap-1.5">
            {study.stack.map((t) => (
              <li key={t}>
                <Chip>{t}</Chip>
              </li>
            ))}
          </ul>
        </Part>
      </Container>
    </article>
  );
}
