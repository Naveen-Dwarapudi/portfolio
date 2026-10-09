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
