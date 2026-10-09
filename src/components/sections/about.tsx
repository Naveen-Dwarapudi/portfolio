import photo from "@/images/mypic-1.jpeg";
import { Chip } from "@/components/ui/chip";
import { Heading } from "@/components/ui/heading";
import { Screenshot } from "@/components/ui/screenshot";
import { Section } from "@/components/ui/section";
import type { HomeContent } from "@/content/types";

export function About({ about }: { about: HomeContent["about"] }) {
  return (
    <Section id="about" index="02" label={about.label}>
      <div className="mt-4 grid items-start gap-10 md:grid-cols-[0.8fr_1.2fr]">
        <div className="scroll-reveal order-last w-[280px] max-w-full overflow-hidden rounded-[28px] border border-line md:order-first md:w-auto">
          <Screenshot
            src={photo}
            alt={about.photoAlt}
            sizes="(max-width: 768px) 280px, 400px"
          />
        </div>
        <div>
          <Heading level="h2" id="about-heading" className="scroll-reveal">
            {about.heading}
          </Heading>
          <p className="scroll-reveal mt-6 text-lg text-muted">{about.body}</p>
          <ul className="scroll-reveal mt-6 flex flex-wrap gap-2">
            {about.facts.map((fact) => (
              <li key={fact}>
                <Chip>{fact}</Chip>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
