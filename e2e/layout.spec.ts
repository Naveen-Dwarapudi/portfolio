import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

async function headerBottom(page: Page) {
  const box = await page.locator("header").first().boundingBox();
  return box!.y + box!.height;
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
});

for (const path of ["/", "/work/pharma-enterprise-portals"]) {
  test(`the header stays pinned to the top while scrolling ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const header = page.locator("header").first();
    await expect(header).toBeInViewport();
    expect((await header.boundingBox())!.y).toBe(0);
  });

  test(`back to top is a button that returns to the top of ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const footer = page.getByRole("contentinfo");
    await footer.getByRole("link", { name: "Back to top" }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });
}

test("sections start below the header after a nav jump", async ({ page }) => {
  // Instant jumps, so we measure where the scroll ends, not mid-animation.
  await page.emulateMedia({ reducedMotion: "reduce" });
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
    const top = (await page.locator(`#${id}`).boundingBox())!.y;
    // The last section can't scroll all the way up; it only needs to be clear.
    expect(top, id).toBeGreaterThanOrEqual(await headerBottom(page));
  }
});

test("the sticky diagram stage sits below the header", async ({ page }) => {
  await page.goto("/work/pharma-enterprise-portals");
  const track = page.locator(".dg-stage-track");
  await track.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const t = document.querySelector(".dg-stage-track")!;
    window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY + 600);
  });
  const stage = page.locator(".dg-stage");
  expect((await stage.boundingBox())!.y).toBeGreaterThanOrEqual(
    await headerBottom(page),
  );
});

test.describe("active section in the header nav", () => {
  const nav = (page: Page) =>
    page.getByRole("navigation", { name: "Sections" });
  const current = (page: Page) =>
    nav(page).locator('[aria-current="location"]');

  test("a clicked link turns orange and is marked current", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(current(page)).toHaveCount(0);
    const link = nav(page).getByRole("link", { name: "Experience" });
    await link.click();
    await expect(link).toHaveAttribute("aria-current", "location");
    const accent = await page.evaluate(() => {
      const probe = document.createElement("span");
      probe.style.color = "var(--accent)";
      document.body.append(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    });
    // The colour eases in (transition-colors), so wait for it to settle.
    await expect
      .poll(() => link.evaluate((el) => getComputedStyle(el).color))
      .toBe(accent);
    await expect(current(page)).toHaveCount(1);
  });

  test("the highlight follows scrolling and clears at the top", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator("#skills").evaluate((el) => el.scrollIntoView());
    await expect(current(page)).toHaveText("Skills");
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(current(page)).toHaveCount(0);
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    await expect(current(page)).toHaveText("Contact");
  });

  test("no link is current on a case study", async ({ page }) => {
    await page.goto("/work/pharma-enterprise-portals");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => window.scrollTo(0, 2000));
    await expect(current(page)).toHaveCount(0);
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`no WCAG 2.1 AA violations with a current link (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await nav(page).getByRole("link", { name: "Projects" }).click();
      await expect(current(page)).toHaveText("Projects");
      await expectNoAxeViolations(page, 150);
    });
  }
});
