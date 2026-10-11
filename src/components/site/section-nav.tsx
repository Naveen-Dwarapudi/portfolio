"use client";

import { useEffect, useRef, useState } from "react";

export type SectionNavItem = { id: string; label: string; href: string };

/**
 * The section being read: the last one whose top has passed `line` (px from
 * the viewport top), or the last section once the page is scrolled to the
 * bottom. Null above the first section (the hero).
 */
export function activeSection(
  tops: { id: string; top: number }[],
  line: number,
  atBottom: boolean,
): string | null {
  if (atBottom && tops.length) return tops[tops.length - 1]!.id;
  let current: string | null = null;
  for (const { id, top } of tops) if (top <= line) current = id;
  return current;
}

/** Ignore scroll updates for this long after a click if `scrollend` never fires. */
const CLICK_LOCK_MS = 1000;

/**
 * Header section links. With `spy` (the home page), the link for the section
 * in view gets `aria-current="location"` and the accent colour; clicking a
 * link highlights it immediately. Without JS the links still work, unmarked.
 */
export function SectionNav({
  label,
  items,
  spy,
}: {
  label: string;
  items: SectionNavItem[];
  spy: boolean;
}) {
  const [active, setActive] = useState<string | null>(null);
  // While a clicked link's smooth scroll runs, don't flicker through the
  // sections in between.
  const locked = useRef(false);

  useEffect(() => {
    if (!spy) return;
    let frame = 0;
    let unlockTimer = 0;

    function measure() {
      frame = 0;
      if (locked.current) return;
      const header = document.querySelector("header");
      const line =
        (header?.getBoundingClientRect().bottom ?? 0) +
        window.innerHeight * 0.25;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight > window.innerHeight;
      const atBottom =
        scrollable &&
        window.innerHeight + window.scrollY >= doc.scrollHeight - 2;
      const tops = items.flatMap(({ id }) => {
        const el = document.getElementById(id);
        return el ? [{ id, top: el.getBoundingClientRect().top }] : [];
      });
      setActive(activeSection(tops, line, atBottom));
    }

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(measure);
    }

    function unlock() {
      window.clearTimeout(unlockTimer);
      locked.current = false;
      onScroll();
    }

    function onClick(event: MouseEvent) {
      const link = (event.target as Element | null)?.closest?.(
        "a[data-section]",
      );
      if (!link) return;
      locked.current = true;
      window.clearTimeout(unlockTimer);
      unlockTimer = window.setTimeout(unlock, CLICK_LOCK_MS);
    }

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("scrollend", unlock);
    document.addEventListener("click", onClick, true);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(unlockTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scrollend", unlock);
      document.removeEventListener("click", onClick, true);
    };
  }, [spy, items]);

  return (
    <nav aria-label={label} className="hidden md:block">
      <ul className="flex gap-6 text-sm text-muted">
        {items.map((item) => {
          const current = spy && active === item.id;
          return (
            <li key={item.id}>
              <a
                href={item.href}
                data-section={item.id}
                aria-current={current ? "location" : undefined}
                onClick={spy ? () => setActive(item.id) : undefined}
                className={`relative py-1 transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:origin-left after:rounded-full after:bg-accent after:transition-transform after:duration-300 after:ease-spring motion-reduce:after:transition-none ${
                  current
                    ? "text-accent after:scale-x-100"
                    : "after:scale-x-0 hover:text-text"
                }`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
