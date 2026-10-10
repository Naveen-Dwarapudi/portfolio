import { InteractiveCard } from "@/components/motion/pointer-effects";
import { Chip } from "@/components/ui/chip";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { TextLink } from "@/components/ui/text-link";
import type { Locale } from "@/content/locales";
import type { HomeContent } from "@/content/types";
import { localizedPath } from "@/lib/i18n";

export function Experience({
  experience,
  techStackLabel,
  readCaseStudyLabel,
  locale,
}: {
  experience: HomeContent["experience"];
  techStackLabel: string;
  readCaseStudyLabel: string;
  locale: Locale;
}) {
  return (
    <Section id="experience" index="03" label={experience.label}>
      <Heading
        level="h2"
        id="experience-heading"
        className="scroll-reveal mt-4"
      >
        {experience.heading}
      </Heading>
      <div className="scroll-reveal mt-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="font-display text-h3 font-extrabold tracking-[-0.02em]">
          {experience.role}
          <span className="text-muted"> · </span>
          {experience.company}
        </p>
        <p className="font-mono text-label tracking-[0.08em] text-muted uppercase">
          {experience.period}
        </p>
      </div>
      <p className="scroll-reveal mt-1 text-sm text-muted">
        {experience.companyNote}
      </p>
      <p className="mt-3 font-mono text-label tracking-[0.08em] text-muted uppercase">
        {experience.confidentialityNote}
      </p>

      <ol className="relative mt-10 space-y-6 pl-8 md:pl-12">
        <span
          aria-hidden="true"
          className="timeline-line absolute top-2 bottom-2 left-[7px] w-px bg-gradient-to-b from-accent via-line-strong to-line md:left-[11px]"
        />
        {experience.engagements.map((e, i) => (
          <li
            key={e.title}
            className="scroll-reveal relative"
            style={{ "--i": i } as React.CSSProperties}
          >
            <span
              aria-hidden="true"
              className="absolute top-7 -left-8 size-[15px] rounded-full border-2 border-accent bg-bg md:-left-12 md:size-[23px] md:border-[3px]"
            />
            <InteractiveCard>
              <p className="kicker">{e.kicker}</p>
              <Heading level="h3" className="mt-2.5">
                {e.title}
              </Heading>
              <p className="mt-2 text-muted">{e.summary}</p>
              <ul className="bullets mt-4 space-y-2 text-sm">
                {e.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <ul
                className="mt-5 flex flex-wrap gap-1.5"
                aria-label={techStackLabel}
              >
                {e.stack.map((s) => (
                  <li key={s}>
                    <Chip>{s}</Chip>
                  </li>
                ))}
              </ul>
              <TextLink
                href={localizedPath(locale, `/work/${e.slug}`)}
                aria-label={`${readCaseStudyLabel}: ${e.title}`}
                className="mt-5 inline-block text-sm"
              >
                {readCaseStudyLabel}
                <span aria-hidden="true"> →</span>
              </TextLink>
            </InteractiveCard>
          </li>
        ))}
      </ol>
    </Section>
  );
}
