import { InteractiveCard } from "@/components/motion/pointer-effects";
import { BrowserFrame } from "@/components/ui/browser-frame";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Heading } from "@/components/ui/heading";
import { Screenshot } from "@/components/ui/screenshot";
import { screenshots } from "@/components/ui/screenshots";
import { Section } from "@/components/ui/section";
import { TextLink } from "@/components/ui/text-link";
import type { Locale } from "@/content/locales";
import type { HomeContent } from "@/content/types";
import { localizedPath } from "@/lib/i18n";

export function Projects({
  projects,
  newTabLabel,
  techStackLabel,
  readCaseStudyLabel,
  locale,
}: {
  projects: HomeContent["projects"];
  newTabLabel: string;
  techStackLabel: string;
  readCaseStudyLabel: string;
  locale: Locale;
}) {
  const p = projects.independent;
  return (
    <Section id="projects" index="05" label={projects.label}>
      <Heading level="h2" id="projects-heading" className="scroll-reveal mt-4">
        {projects.heading}
      </Heading>

      <article className="scroll-reveal mt-10">
        <InteractiveCard>
          <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <BrowserFrame>
              <Screenshot
                src={screenshots[p.image]}
                alt={p.imageAlt}
                sizes="(max-width: 1024px) 100vw, 560px"
              />
            </BrowserFrame>
            <div>
              <p className="kicker">{projects.independentLabel}</p>
              <Heading level="h3" className="mt-2.5">
                {p.title}
              </Heading>
              <p className="mt-1 text-sm text-muted">{p.subtitle}</p>
              <ul className="bullets mt-4 space-y-2 text-sm">
                {p.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <ul
                className="mt-5 flex flex-wrap gap-1.5"
                aria-label={techStackLabel}
              >
                {p.stack.map((s) => (
                  <li key={s}>
                    <Chip>{s}</Chip>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <ButtonLink
                  href={p.liveUrl}
                  arrow="↗"
                  newTabLabel={newTabLabel}
                  aria-label={`${projects.liveSite}: ${p.title} ${newTabLabel}`}
                >
                  {projects.liveSite}
                </ButtonLink>
                <TextLink
                  href={localizedPath(locale, `/work/${p.slug}`)}
                  aria-label={`${readCaseStudyLabel}: ${p.title}`}
                  className="text-sm"
                >
                  {readCaseStudyLabel}
                  <span aria-hidden="true"> →</span>
                </TextLink>
              </div>
            </div>
          </div>
        </InteractiveCard>
      </article>

      <h3 className="scroll-reveal mt-14 font-mono text-label tracking-[0.1em] text-muted uppercase">
        {projects.sideLabel}
      </h3>
      <ul className="mt-4 grid gap-4 md:grid-cols-2">
        {projects.side.map((s, i) => (
          <li
            key={s.title}
            className="scroll-reveal"
            style={{ "--i": i } as React.CSSProperties}
          >
            <InteractiveCard className="h-full">
              <BrowserFrame>
                <Screenshot
                  src={screenshots[s.image]}
                  alt={s.imageAlt}
                  sizes="(max-width: 768px) 100vw, 500px"
                />
              </BrowserFrame>
              <p className="mt-5 font-mono text-label tracking-[0.1em] text-muted uppercase">
                {projects.sideBadge}
              </p>
              <h4 className="mt-1.5 font-display text-h3 font-extrabold tracking-[-0.02em]">
                {s.title}
              </h4>
              <p className="mt-2 text-sm text-muted">{s.summary}</p>
              <ul
                className="mt-4 flex flex-wrap gap-1.5"
                aria-label={techStackLabel}
              >
                {s.stack.map((t) => (
                  <li key={t}>
                    <Chip>{t}</Chip>
                  </li>
                ))}
              </ul>
              <TextLink
                href={s.liveUrl}
                newTabLabel={newTabLabel}
                aria-label={`${projects.liveSite}: ${s.title} ${newTabLabel}`}
                className="mt-4 inline-block text-sm"
              >
                {projects.liveSite}
              </TextLink>
            </InteractiveCard>
          </li>
        ))}
      </ul>
    </Section>
  );
}
