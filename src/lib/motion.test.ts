import { describe, expect, it } from "vitest";
import { mockMatchMedia } from "@/test/setup";
import {
  canHoverPrecisely,
  easeOutQuart,
  prefersReducedMotion,
} from "./motion";

describe("easeOutQuart", () => {
  it("starts at 0 and ends at 1", () => {
    expect(easeOutQuart(0)).toBe(0);
    expect(easeOutQuart(1)).toBe(1);
  });

  it("is past halfway at the midpoint (fast start)", () => {
    expect(easeOutQuart(0.5)).toBeCloseTo(0.9375);
  });

  it("clamps out-of-range input", () => {
    expect(easeOutQuart(-1)).toBe(0);
    expect(easeOutQuart(2)).toBe(1);
  });
});

describe("media helpers", () => {
  it("report false when nothing matches", () => {
    expect(prefersReducedMotion()).toBe(false);
    expect(canHoverPrecisely()).toBe(false);
  });

  it("report true when the query matches", () => {
    mockMatchMedia([
      "(prefers-reduced-motion: reduce)",
      "(hover: hover) and (pointer: fine)",
    ]);
    expect(prefersReducedMotion()).toBe(true);
    expect(canHoverPrecisely()).toBe(true);
  });
});
