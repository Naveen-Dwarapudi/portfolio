/**
 * Lighthouse simulates a phone by multiplying the host's CPU time by a fixed
 * 4x, so a slower host simulates a slower phone and the same page scores
 * worse (phase 3: GitHub's runner benchmarked 2434 vs 4480 on the machine the
 * budget was set on, and LCP failed only on CI).
 *
 * Lighthouse's docs recommend calibrating the multiplier to the host
 * (docs/throttling.md, "Calibrating the CPU slowdown"). We scale it so every
 * host simulates the same phone the budgets in lighthouserc.json were set
 * against. The budgets themselves never change.
 */

/** benchmarkIndex of the machine the budgets were calibrated on (2026-10). */
export const REFERENCE_BENCHMARK_INDEX = 4480;
export const DEFAULT_CPU_SLOWDOWN = 4;
const MIN_SLOWDOWN = 1;
const MAX_SLOWDOWN = 8;

/** CPU slowdown that makes this host simulate the reference phone. */
export function cpuSlowdownFor(benchmarkIndex) {
  if (!Number.isFinite(benchmarkIndex) || benchmarkIndex <= 0) {
    return DEFAULT_CPU_SLOWDOWN;
  }
  const scaled =
    (DEFAULT_CPU_SLOWDOWN * benchmarkIndex) / REFERENCE_BENCHMARK_INDEX;
  const clamped = Math.min(MAX_SLOWDOWN, Math.max(MIN_SLOWDOWN, scaled));
  return Math.round(clamped * 100) / 100;
}
