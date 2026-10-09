import { expect, test } from "@playwright/test";

const DARK_BG = "rgb(11, 13, 18)";
const LIGHT_BG = "rgb(246, 247, 249)";

function htmlBackground() {
  return getComputedStyle(document.documentElement).backgroundColor;
}

test("follows the OS when no choice is stored", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  expect(await page.evaluate(htmlBackground)).toBe(LIGHT_BG);

  await page.emulateMedia({ colorScheme: "dark" });
  expect(await page.evaluate(htmlBackground)).toBe(DARK_BG);
});

test("a stored choice applies before any app JavaScript runs (no flash)", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  // Block every app chunk: only the inline <head> script can set the theme.
  await page.route("**/_next/static/chunks/**/*.js", (route) => route.abort());
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(htmlBackground)).toBe(LIGHT_BG);
});
test("the toggle persists across reloads and keeps its label in sync", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(
    page.getByRole("button", { name: "Switch to dark theme" }),
  ).toBeVisible();

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(
    page.getByRole("button", { name: "Switch to dark theme" }),
  ).toBeVisible();
});

test("the toggle label follows a live OS change when nothing is stored", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Switch to light theme" }),
  ).toBeVisible();
  await page.emulateMedia({ colorScheme: "light" });
  await expect(
    page.getByRole("button", { name: "Switch to dark theme" }),
  ).toBeVisible();
});
