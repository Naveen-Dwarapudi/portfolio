import type { ReactNode } from "react";
import { Container } from "./container";
import { SectionLabel } from "./section-label";

export function Section({
  id,
  index,
  label,
  children,
}: {
  id: string;
  index: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="py-20">
      <Container>
        <SectionLabel index={index}>{label}</SectionLabel>
        {children}
      </Container>
    </section>
  );
}
