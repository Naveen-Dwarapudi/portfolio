import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectNoAxeViolations(page: Page) {
  // Reduced motion puts every scroll-reveal in its final, visible state, so
  // axe checks the whole page rather than skipping not-yet-revealed sections.
  // (colorScheme set by the caller is kept.)
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(500);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations).toEqual([]);
  // Guard against silently skipping content: axe ignores invisible nodes, so
  // the contrast rule must actually have checked the whole page.
  const contrastChecked =
    results.passes.find((r) => r.id === "color-contrast")?.nodes.length ?? 0;
  expect(contrastChecked).toBeGreaterThan(150);
}

test("home renders server-side content", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Bhavani Sankar Naveen Dwarapudi.",
    }),
  ).toBeVisible();
  await expect(page).toHaveTitle(/^Naveen Dwarapudi/);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`no WCAG 2.1 AA violations with OS ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");
    await expectNoAxeViolations(page);
  });

  test(`no WCAG 2.1 AA violations when toggled to ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({
      colorScheme: colorScheme === "light" ? "dark" : "light",
    });
    await page.goto("/");
    await page
      .getByRole("button", { name: `Switch to ${colorScheme} theme` })
      .click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      colorScheme,
    );
    await expectNoAxeViolations(page);
  });
}

for (const width of [320, 375]) {
  test(`no horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto("/");
    await page.waitForTimeout(1500);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test(`the portrait badge is fully on screen at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto("/");
    await page.waitForTimeout(1500);
    const box = await page
      .getByText("React & React Native", { exact: false })
      .first()
      .boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  });
}
