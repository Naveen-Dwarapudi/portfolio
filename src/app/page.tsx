import portraitImage from "@/images/mypic-2.jpeg";
import { CountUp } from "@/components/motion/count-up";
import { HeroBackground } from "@/components/motion/hero-background";
import { InteractiveCard, Magnetic } from "@/components/motion/pointer-effects";
import { Portrait } from "@/components/motion/portrait";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Container } from "@/components/ui/container";
import { Heading, LineReveal } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { SectionLabel } from "@/components/ui/section-label";

const metrics = [
  { value: 4, suffix: "+", label: "years in production" },
  { value: 5, suffix: "", label: "client engagements" },
  { value: 30, suffix: "%+", label: "faster component builds" },
  { value: 4, suffix: "", label: "industries" },
];

const work = [
  {
    kicker: "Pharma · Enterprise web",
    title: "Multi-portal enterprise platform",
    body: "Three role-based portals (admin, partner and customer) with two-tier access control.",
    chips: ["React", "RTK Query", "RBAC"],
  },
  {
    kicker: "Payments · Public sector",
    title: "Municipal bill payment",
    body: "Admin and citizen single-page apps for paying civic bills online.",
    chips: ["React", "TypeScript"],
  },
  {
    kicker: "Logistics · Mobile",
    title: "Warehouse operations apps",
    body: "Migrated hybrid Ionic apps to React Native for a global e-commerce company.",
    chips: ["React Native", "Migration"],
  },
];

export default function Home() {
  return (
    <main id="main" className="flex-1">
      <div className="relative -mt-[80px] overflow-hidden border-b border-line pt-[80px]">
        <HeroBackground />
        <Container className="relative grid items-center gap-12 py-16 md:grid-cols-[1.25fr_0.75fr] md:py-20">
          <div>
            <div className="fade-up">
              <SectionLabel index="01">
                React · React Native · Next.js
              </SectionLabel>
            </div>
            <Heading level="display" className="mt-5 mb-6">
              <LineReveal
                lines={[
                  {
                    text: "Bhavani Sankar",
                    className: "text-[0.38em] tracking-[-0.02em] text-muted",
                  },
                  { text: "Naveen" },
                  { text: "Dwarapudi.", className: "text-accent" },
                ]}
              />
            </Heading>
            <p
              className="fade-up max-w-[620px] text-lg text-muted"
              style={{ "--delay": "350ms" } as React.CSSProperties}
            >
              React.js Developer | React Native Developer | Full-Stack (MERN)
              Engineer
            </p>
            <div
              className="fade-up mt-8 flex flex-wrap gap-3.5"
              style={{ "--delay": "500ms" } as React.CSSProperties}
            >
              <Magnetic>
                <ButtonLink href="#work" arrow="→">
                  View work
                </ButtonLink>
              </Magnetic>
              <Magnetic>
                <ButtonLink href="#work" variant="secondary" arrow="↓">
                  Download resume
                </ButtonLink>
              </Magnetic>
            </div>
          </div>
          <div className="order-first justify-self-start md:order-none md:justify-self-end">
            <Portrait
              src={portraitImage}
              alt="Portrait of Bhavani Sankar Naveen Dwarapudi"
              badge={
                <>
                  <span className="text-accent">4+ yrs</span> · React &amp;
                  React Native
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
                  <span className="text-accent">{m.suffix}</span>
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </div>

      <Section id="work" index="02" label="Selected work">
        <Heading level="h2" id="work-heading" className="scroll-reveal mt-4">
          Production apps, not side quests.
        </Heading>
        <p className="mt-3 mb-8 font-mono text-label tracking-[0.08em] text-muted uppercase">
          Client work · names withheld under confidentiality
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {work.map((w, i) => (
            <div
              key={w.title}
              className="scroll-reveal"
              style={{ "--i": i } as React.CSSProperties}
            >
              <InteractiveCard className="h-full">
                <p className="font-mono text-label tracking-[0.1em] text-accent uppercase">
                  {w.kicker}
                </p>
                <Heading level="h3" className="mt-2.5 mb-2">
                  {w.title}
                </Heading>
                <p className="mb-4 text-sm text-muted">{w.body}</p>
                <div className="flex flex-wrap gap-1.5">
                  {w.chips.map((c) => (
                    <Chip key={c}>{c}</Chip>
                  ))}
                </div>
              </InteractiveCard>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
