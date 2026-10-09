import type { ReactNode } from "react";

/** Decorative browser chrome around a screenshot. */
export function BrowserFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface-2 shadow-[0_24px_60px_-30px_rgb(0_0_0/0.6)]">
      <div
        aria-hidden="true"
        className="flex gap-1.5 border-b border-line px-3 py-2.5"
      >
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="size-2.5 rounded-full bg-line-strong" />
      </div>
      {children}
    </div>
  );
}
