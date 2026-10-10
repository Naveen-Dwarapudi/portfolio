import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

test("English pages keep their unprefixed URLs and declare lang=en", async ({
  page,
}) => {
  for (const path of ["/", "/work/pharma-enterprise-portals"]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    await expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, "\\/")}$`));
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  }
});

test("/en URLs redirect permanently to the unprefixed URL", async ({
  request,
}) => {
  for (const [from, to] of [
    ["/en", "/"],
    ["/en/work/workflow-portal", "/work/workflow-portal"],
  ] as const) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(308);
    expect(new URL(res.headers()["location"]!, "http://x").pathname, from).toBe(
      to,
    );
  }
});

test("unpublished languages return a real 404", async ({ request }) => {
  for (const path of [
    "/hi",
    "/te",
    "/hi/work/pharma-enterprise-portals",
    "/te/work/x",
  ]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});

test("paths with a dot go through locale routing, never a soft or bare 404", async ({
  page,
  request,
}) => {
  const redirect = await request.get("/en/work/x.pdf", { maxRedirects: 0 });
  expect(redirect.status()).toBe(308);
  for (const path of [
    "/work/x.pdf",
    "/work/pharma-enterprise-portals.x",
    "/favicon.ico",
    "/hi/work/x.pdf",
  ]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(404);
    await expect(page.locator("html"), path).toHaveAttribute("lang", "en");
  }
});

test("the 404 page is branded, declares its language and isn't indexed", async ({
  page,
}) => {
  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "This page doesn't exist.",
  );
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
    "content",
    /noindex/,
  );
  await page.getByRole("link", { name: /Go to the home page/ }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("the language switcher opens from the keyboard and shows coming-soon languages", async ({
  page,
}) => {
  await page.goto("/");
  const summary = page.locator("header details summary");
  await expect(summary).toHaveAttribute("aria-label", "Language: English");
  await summary.focus();
  await page.keyboard.press("Enter");
  const menu = page.locator("header details ul");
  await expect(menu).toBeVisible();
  await expect(menu.getByText("Coming soon")).toHaveCount(2);
  await expect(menu.getByRole("link")).toHaveCount(0);
  await page.keyboard.press("Enter");
  await expect(menu).toBeHidden();
});

test("the switcher is available on phones too", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto("/");
  await expect(page.locator("header details summary")).toBeVisible();
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`no WCAG 2.1 AA violations with the switcher open (${colorScheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");
    await page.locator("header details summary").click();
    await expectNoAxeViolations(page, 150);
  });
}

test("the 404 page has no WCAG 2.1 AA violations", async ({ page }) => {
  await page.goto("/no-such-page");
  await expectNoAxeViolations(page, 10);
});
