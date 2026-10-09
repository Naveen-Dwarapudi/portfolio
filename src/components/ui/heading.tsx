import type { ReactNode } from "react";

type Level = "display" | "h2" | "h3";

const styles: Record<Level, string> = {
  display: "font-display text-display font-extrabold tracking-[-0.045em]",
  h2: "font-display text-h2 font-extrabold tracking-[-0.035em]",
  h3: "font-display text-h3 font-extrabold tracking-[-0.02em]",
};

const tags = { display: "h1", h2: "h2", h3: "h3" } as const;

export function Heading({
  level,
  id,
  className = "",
  children,
}: {
  level: Level;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const Tag = tags[level];
  return (
    <Tag id={id} className={`${styles[level]} ${className}`}>
      {children}
    </Tag>
  );
}

export type RevealLine = { text: string; className?: string };

/**
 * Lines rise into view one after another. Assistive tech reads the full text
 * once (sr-only); the animated fragments are hidden from it.
 */
export function LineReveal({ lines }: { lines: RevealLine[] }) {
  return (
    <>
      <span className="sr-only">{lines.map((l) => l.text).join(" ")}</span>
      <span aria-hidden="true">
        {lines.map((line, i) => (
          <span
            key={line.text}
            className={`line-reveal-line ${line.className ?? ""}`}
            style={{ "--i": i } as React.CSSProperties}
          >
            <span>{line.text}</span>
          </span>
        ))}
      </span>
    </>
  );
}
