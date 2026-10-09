export function Chip({ children }: { children: string }) {
  return (
    <span className="rounded-md border border-line px-2 py-1 font-mono text-[11px] text-muted">
      {children}
    </span>
  );
}
