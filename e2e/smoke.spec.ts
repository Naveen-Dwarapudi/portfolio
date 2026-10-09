import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectNoAxeViolations(page: Page) {
  // Let entrance animations settle so axe sees final colours and opacity.
  await page.waitForTimeout(1500);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations).toEqual([]);
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
