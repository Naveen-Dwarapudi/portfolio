"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A <details> that also closes on an outside pointer press or Esc (Esc returns
 * focus to its <summary>). Without JS it is a plain <details>.
 */
export function DismissibleDetails({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const details = ref.current;
      if (details?.open && !details.contains(event.target as Node)) {
        details.open = false;
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      const details = ref.current;
      // Only when focus is inside, so Esc elsewhere (e.g. closing the command
      // palette) never moves focus back here.
      if (
        event.key !== "Escape" ||
        !details?.open ||
        !details.contains(document.activeElement)
      )
        return;
      details.open = false;
      details.querySelector("summary")?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details ref={ref} className={className}>
      {children}
    </details>
  );
}
