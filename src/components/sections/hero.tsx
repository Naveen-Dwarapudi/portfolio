import portraitImage from "@/images/mypic-2.jpeg";
import { CountUp } from "@/components/motion/count-up";
import { HeroBackground } from "@/components/motion/hero-background";
import { Magnetic } from "@/components/motion/pointer-effects";
import { Portrait } from "@/components/motion/portrait";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading, LineReveal } from "@/components/ui/heading";
import { SectionLabel } from "@/components/ui/section-label";
import type { HomeContent } from "@/content/types";
import { RESUME_PATH } from "@/lib/resume";

export function Hero({
  hero,
  metrics,
}: {
  hero: HomeContent["hero"];
  metrics: HomeContent["metrics"];
}) {
  const [first, second, third] = hero.nameLines;
  return (
    <div
      id="top"
      className="relative -mt-[80px] overflow-hidden border-b border-line pt-[80px]"
    >
      <HeroBackground />
      <Container className="relative grid items-center gap-12 py-16 md:grid-cols-[1.25fr_0.75fr] md:py-20">
        <div>
          <div className="fade-up">
            <SectionLabel index="01">{hero.label}</SectionLabel>
          </div>
          <Heading level="display" className="mt-5 mb-6">
            <LineReveal
              lines={[
                {
                  text: first,
                  className: "text-[0.38em] tracking-[-0.02em] text-muted",
                },
                { text: second },
                { text: third, className: "text-accent" },
              ]}
            />
          </Heading>
          <p
            className="fade-up max-w-[620px] text-lg text-muted"
            style={{ "--delay": "350ms" } as React.CSSProperties}
          >
            {hero.role}
          </p>
          <div
            className="fade-up mt-8 flex flex-wrap gap-3.5"
            style={{ "--delay": "500ms" } as React.CSSProperties}
          >
            <Magnetic>
              <ButtonLink href="#experience" arrow="→">
                {hero.viewWork}
              </ButtonLink>
            </Magnetic>
            <Magnetic>
              <ButtonLink
                href={RESUME_PATH}
                download
                variant="secondary"
                arrow="↓"
              >
                {hero.downloadResume}
              </ButtonLink>
            </Magnetic>
          </div>
        </div>
        <div className="order-first justify-self-start md:order-none md:justify-self-end">
          <Portrait
            src={portraitImage}
            alt={hero.portraitAlt}
            badge={
              <>
                <span className="text-accent">{hero.badgeEmphasis}</span> ·{" "}
                {hero.badgeText}
              </>
            }
          />
        </div>
      </Container>
      <Container className="relative pb-16">
        <dl
          className="fade-up grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-line bg-line md:grid-cols-4"
          style={{ "--delay": "650ms" } as React.CSSProperties}
        >
          {metrics.map((m) => (
            <div
              key={m.label}
              className="flex flex-col-reverse bg-surface/85 p-5 backdrop-blur-md"
            >
              <dt className="mt-1 text-sm text-muted">{m.label}</dt>
              <dd className="font-display text-[clamp(1.75rem,4vw,2.625rem)] font-extrabold tracking-[-0.04em]">
                <CountUp value={m.value} delayMs={700} />
                {m.suffix ? (
                  <span className="text-accent">{m.suffix}</span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </div>
  );
}
