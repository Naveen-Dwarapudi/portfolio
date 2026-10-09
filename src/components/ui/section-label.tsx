export function SectionLabel({
  index,
  children,
}: {
  index: string;
  children: string;
}) {
  return (
    <p className="font-mono text-label tracking-[0.1em] text-muted uppercase">
      <span className="text-accent">{index}</span> / {children}
    </p>
  );
}
