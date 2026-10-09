import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/**
 * WCAG 2.1 AA scan of the whole page. Reduced motion puts every
 * scroll-reveal in its final, visible state (the caller's colorScheme is
 * kept). axe skips invisible nodes, so `minContrastNodes` guards against a
 * scan that silently checked only part of the page.
 */
export async function expectNoAxeViolations(
  page: Page,
  minContrastNodes: number,
) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(500);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations).toEqual([]);
  const contrastChecked =
    results.passes.find((r) => r.id === "color-contrast")?.nodes.length ?? 0;
  expect(contrastChecked).toBeGreaterThan(minContrastNodes);
}
