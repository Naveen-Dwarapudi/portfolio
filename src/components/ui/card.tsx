import type { ReactNode } from "react";

/** Static surface card. For the pointer spotlight and tilt, use InteractiveCard. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[14px] border border-line bg-surface p-6 ${className}`}
    >
      {children}
    </div>
  );
}
