import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

const palette = (page: Page) =>
  page.getByRole("dialog", { name: "Command palette" });
const search = (page: Page) =>
  page.getByRole("combobox", { name: "Search or jump to…" });

async function openWithShortcut(page: Page) {
  // The shortcut listener attaches on hydration; a real visitor is never
  // faster than that, but a test can be.
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Control+k");
  await expect(palette(page)).toBeVisible();
  await expect(search(page)).toBeFocused();
}

test("Ctrl+K, type, Enter navigates to a case study", async ({ page }) => {
  await page.goto("/");
  await openWithShortcut(page);
  await page.keyboard.type("wareh");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/work\/warehouse-mobile-migration$/);
});

test("the palette chunk loads only when first opened", async ({ page }) => {
  const scripts: string[] = [];
  page.on("request", (r) => {
    if (r.resourceType() === "script") scripts.push(r.url());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const before = scripts.length;
  await openWithShortcut(page);
  await expect.poll(() => scripts.length).toBeGreaterThan(before);
});

test("from a case study, About goes to the home section", async ({ page }) => {
  await page.goto("/work/pharma-enterprise-portals");
  await openWithShortcut(page);
  await page.keyboard.type("about");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/#about$/);
});

test("Esc closes and returns focus to where it was", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Search the site" });
  await trigger.click();
  await expect(palette(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(palette(page)).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("clicking the backdrop closes it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await openWithShortcut(page);
  await page.mouse.click(20, 780);
  await expect(palette(page)).toBeHidden();
});

test("on phones the search button opens it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Search the site" }).click();
  await expect(search(page)).toBeFocused();
});

test("the theme action flips the theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await openWithShortcut(page);
  await page.keyboard.type("theme");
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(palette(page)).toBeHidden();
});

test("copy email puts the address on the clipboard", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await openWithShortcut(page);
  await page.keyboard.type("copy email");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("status").filter({ hasText: "Email copied" }),
  ).toHaveCount(1);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "dbsnaveen@gmail.com",
  );
  await expect(palette(page)).toBeHidden();
});

test("no WCAG 2.1 AA violations when nothing matches", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await openWithShortcut(page);
  await page.keyboard.type("zzzzqqq");
  await expect(palette(page)).toContainText("No results");
  await expectNoAxeViolations(page, 3);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`no WCAG 2.1 AA violations with the palette open (${colorScheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.goto("/");
    await openWithShortcut(page);
    await page.keyboard.press("ArrowDown");
    // The modal makes the page behind it inert, so axe checks the palette
    // only (17 text nodes measured).
    await expectNoAxeViolations(page, 15);
  });
}
