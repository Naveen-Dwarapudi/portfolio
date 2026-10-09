"use client";

import { useEffect, useRef } from "react";
import { easeOutQuart, prefersReducedMotion } from "@/lib/motion";

type CountUpProps = {
  value: number;
  durationMs?: number;
  delayMs?: number;
};

/**
 * The delay only lines the count up with the page-load intro. Measured from
 * navigation start, so metrics first seen later (scrolled to) start at once
 * instead of sitting at 0.
 */
export function introDelay(delayMs: number, now: number): number {
  return Math.max(0, delayMs - now);
}

/**
 * Server-renders the final value (readable without JS, by crawlers, and under
 * reduced motion). On first view it counts up from 0, once.
 */
export function CountUp({
  value,
  durationMs = 1400,
  delayMs = 0,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const now = performance.now();
        const start = now + introDelay(delayMs, now);
        el.textContent = "0";
        const tick = (now: number) => {
          const progress = (now - start) / durationMs;
          el.textContent = String(Math.round(value * easeOutQuart(progress)));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = String(value);
    };
  }, [value, durationMs, delayMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
    </span>
  );
}
