import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import type { HomeContent } from "@/content/types";

export function Skills({ skills }: { skills: HomeContent["skills"] }) {
  return (
    <Section id="skills" index="04" label={skills.label}>
      <Heading level="h2" id="skills-heading" className="scroll-reveal mt-4">
        {skills.heading}
      </Heading>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skills.groups.map((g, i) => (
          <li
            key={g.name}
            className="scroll-reveal"
            style={{ "--i": i % 3 } as React.CSSProperties}
          >
            <Card
              className={`hover-lift h-full ${g.accent ? "border-accent/60" : ""}`}
            >
              <Heading
                level="h3"
                className={g.accent ? "text-accent" : undefined}
              >
                {g.name}
              </Heading>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {g.items.map((item) => (
                  <li key={item}>
                    <Chip>{item}</Chip>
                  </li>
                ))}
              </ul>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
