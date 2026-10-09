import { expect, test } from "@playwright/test";

const NEW_TAB = "(opens in a new tab)";

test("each header link scrolls to its section", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Sections" });
  for (const [label, id] of [
    ["About", "about"],
    ["Experience", "experience"],
    ["Skills", "skills"],
    ["Projects", "projects"],
    ["Contact", "contact"],
  ] as const) {
    await nav.getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
});

test("the header nav is hidden on phones", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Sections" })).toBeHidden();
});

test("the resume downloads as a PDF that search engines must not index", async ({
  request,
}) => {
  const res = await request.get("/naveen-dwarapudi-resume.pdf");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");
  expect(res.headers()["x-robots-tag"]).toBe("noindex");
});

test("the home page itself stays indexable", async ({ request }) => {
  const res = await request.get("/");
  expect(res.headers()["x-robots-tag"]).toBeUndefined();
});

test("external links announce that they open a new tab", async ({ page }) => {
  await page.goto("/");
  for (const name of [
    `Live site: Support Ticket Management System ${NEW_TAB}`,
    `Live site: Payments Portal ${NEW_TAB}`,
    `Live site: Mom Tribute ${NEW_TAB}`,
    `LinkedIn ${NEW_TAB}`,
    `GitHub ${NEW_TAB}`,
    `Source on GitHub ${NEW_TAB}`,
  ]) {
    const link = page.getByRole("link", { name, exact: true });
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
});

test("copy email puts the address on the clipboard", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("button", { name: "Copy email" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "Email address copied" }),
  ).toBeAttached();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "dbsnaveen@gmail.com",
  );
});

test("the footer shows the full name and current year", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("contentinfo")).toContainText(
    `© ${new Date().getFullYear()} Bhavani Sankar Naveen Dwarapudi`,
  );
});

test("no phone number appears anywhere on the page", async ({ page }) => {
  await page.goto("/");
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/\+?\d[\d\s-]{8,}\d/);
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
});

test("images are served as AVIF to browsers that accept it", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const src = await page
    .getByRole("img", { name: "Portrait of Bhavani Sankar Naveen Dwarapudi" })
    .evaluate((img: HTMLImageElement) => img.currentSrc);
  const res = await request.get(src, {
    headers: { accept: "image/avif,image/webp,*/*" },
  });
  expect(res.headers()["content-type"]).toBe("image/avif");
});

test("the site icon is the small SVG monogram, not the default favicon", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const href = await page
    .locator('link[rel="icon"]')
    .first()
    .getAttribute("href");
  expect(href).toMatch(/\/icon\.svg/);
  expect((await request.get("/favicon.ico")).status()).toBe(404);
});
