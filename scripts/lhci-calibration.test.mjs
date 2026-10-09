import { describe, expect, it } from "vitest";
import {
  DEFAULT_CPU_SLOWDOWN,
  REFERENCE_BENCHMARK_INDEX,
  cpuSlowdownFor,
} from "./lhci-calibration.mjs";

describe("cpuSlowdownFor", () => {
  it("keeps Lighthouse's default 4x on the reference machine", () => {
    expect(cpuSlowdownFor(REFERENCE_BENCHMARK_INDEX)).toBe(
      DEFAULT_CPU_SLOWDOWN,
    );
  });

  it("throttles a slower host less, so it simulates the same phone", () => {
    // GitHub Actions runner measured 2434.5 (phase 3 CI report).
    expect(cpuSlowdownFor(2434.5)).toBeCloseTo(2.17, 2);
  });

  it("throttles a faster host more", () => {
    expect(cpuSlowdownFor(REFERENCE_BENCHMARK_INDEX * 1.5)).toBe(6);
  });

  it("never goes below 1x or above 8x", () => {
    expect(cpuSlowdownFor(100)).toBe(1);
    expect(cpuSlowdownFor(100_000)).toBe(8);
  });

  it("falls back to the default when the benchmark is unusable", () => {
    expect(cpuSlowdownFor(Number.NaN)).toBe(DEFAULT_CPU_SLOWDOWN);
    expect(cpuSlowdownFor(0)).toBe(DEFAULT_CPU_SLOWDOWN);
  });
});
