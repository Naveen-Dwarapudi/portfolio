import { CopyEmailButton } from "@/components/contact/copy-email-button";
import { Magnetic } from "@/components/motion/pointer-effects";
import { ButtonLink } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import type { HomeContent } from "@/content/types";

export function Contact({
  contact,
  newTabLabel,
}: {
  contact: HomeContent["contact"];
  newTabLabel: string;
}) {
  return (
    <Section id="contact" index="07" label={contact.label}>
      <Heading
        level="h2"
        id="contact-heading"
        className="scroll-reveal mt-4 text-[clamp(2.5rem,7vw,5rem)]"
      >
        {contact.heading}
      </Heading>
      <p className="scroll-reveal mt-4 text-lg text-muted">{contact.line}</p>
      <p className="scroll-reveal mt-8">
        <a
          href={`mailto:${contact.email}`}
          className="font-display text-[clamp(1.25rem,4vw,2rem)] font-extrabold tracking-[-0.02em] break-all text-accent underline-offset-4 hover:underline"
        >
          {contact.email}
        </a>
      </p>
      <div className="scroll-reveal mt-6 flex flex-wrap gap-3">
        <CopyEmailButton email={contact.email} labels={contact.copy} />
        <Magnetic>
          <ButtonLink
            href={contact.linkedin.url}
            variant="secondary"
            arrow="↗"
            newTabLabel={newTabLabel}
          >
            {contact.linkedin.label}
          </ButtonLink>
        </Magnetic>
        <Magnetic>
          <ButtonLink
            href={contact.github.url}
            variant="secondary"
            arrow="↗"
            newTabLabel={newTabLabel}
          >
            {contact.github.label}
          </ButtonLink>
        </Magnetic>
      </div>
      <p className="mt-6 font-mono text-label tracking-[0.1em] text-muted uppercase">
        {contact.location}
      </p>
    </Section>
  );
}
