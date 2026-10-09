import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import type { HomeContent } from "@/content/types";

export function Credentials({
  credentials,
}: {
  credentials: HomeContent["credentials"];
}) {
  const { degree } = credentials;
  return (
    <Section id="credentials" index="06" label={credentials.label}>
      <Heading
        level="h2"
        id="credentials-heading"
        className="scroll-reveal mt-4"
      >
        {credentials.heading}
      </Heading>
      <div className="mt-10 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
        <Card className="scroll-reveal">
          <p className="kicker">{degree.year}</p>
          <Heading level="h3" className="mt-2.5">
            {degree.title}
          </Heading>
          <p className="mt-2 text-muted">{degree.school}</p>
        </Card>
        <Card className="scroll-reveal">
          <Heading level="h3">{credentials.certificationsHeading}</Heading>
          <div className="mt-4 space-y-5">
            {credentials.certifications.map((group) => (
              <div key={group.issuer}>
                <p className="font-mono text-label tracking-[0.1em] text-muted uppercase">
                  {group.issuer}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {group.titles.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Section>
  );
}
