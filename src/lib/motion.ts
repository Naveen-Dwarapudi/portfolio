export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Pointer-driven effects (tilt, magnetic, parallax) only on mouse/trackpad devices. */
export function canHoverPrecisely(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/** ease-out-quart: fast start, gentle landing. Input and output in [0, 1]. */
export function easeOutQuart(t: number): number {
  const clamped = Math.min(Math.max(t, 0), 1);
  return 1 - Math.pow(1 - clamped, 4);
}
