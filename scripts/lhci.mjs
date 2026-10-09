/**
 * `npm run lhci`: measure this host's CPU (Lighthouse's own benchmark),
 * calibrate the CPU slowdown (see lhci-calibration.mjs), then run
 * `lhci autorun`. Extra CLI args are passed through to lhci.
 */
import { spawnSync } from "node:child_process";
import { chromium } from "@playwright/test";
import { pageFunctions } from "lighthouse/core/lib/page-functions.js";
import { cpuSlowdownFor } from "./lhci-calibration.mjs";

async function measureBenchmarkIndex() {
  // Same browser Lighthouse will drive: CHROME_PATH locally, system Chrome on CI.
  const browser = await chromium.launch(
    process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : { channel: "chrome" },
  );
  try {
    const page = await browser.newPage();
    const runs = [];
    for (let i = 0; i < 3; i++) {
      runs.push(
        await page.evaluate(`(${pageFunctions.computeBenchmarkIndex})()`),
      );
    }
    return runs.sort((a, b) => a - b)[1];
  } finally {
    await browser.close();
  }
}

const benchmarkIndex = await measureBenchmarkIndex();
const slowdown = cpuSlowdownFor(benchmarkIndex);
console.log(
  `lhci: host benchmarkIndex ${benchmarkIndex}, cpuSlowdownMultiplier ${slowdown}`,
);

const result = spawnSync(
  "lhci",
  [
    "autorun",
    `--collect.settings.throttling.cpuSlowdownMultiplier=${slowdown}`,
    ...process.argv.slice(2),
  ],
  { stdio: "inherit", shell: process.platform === "win32" },
);
process.exit(result.status ?? 1);
