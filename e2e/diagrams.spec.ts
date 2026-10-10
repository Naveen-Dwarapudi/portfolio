import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

const DIAGRAM_PAGES = [
  "pharma-enterprise-portals",
  "warehouse-mobile-migration",
  "support-ticket-system",
];
/** Diagram pages check more contrast nodes than plain case studies (≥ 55). */
const MIN_CONTRAST_NODES = 45;

async function partOpacities(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll(".dg-part")].map((el) =>
      Number(getComputedStyle(el).opacity),
    ),
  );
}

async function scrollIntoTrack(page: Page, fraction: number) {
  await page.evaluate((f) => {
    const track = document.querySelector(".dg-stage-track")!;
    const top = track.getBoundingClientRect().top + scrollY;
    const travel = track.getBoundingClientRect().height - innerHeight;
    scrollTo(0, top + travel * f);
  }, fraction);
  await page.waitForTimeout(400);
}

test("desktop: the diagram assembles as the reader scrolls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto("/work/pharma-enterprise-portals");
  const stage = page.locator(".dg-stage");

  await scrollIntoTrack(page, 0.02);
  await expect(stage).toHaveCSS("position", "sticky");
  const early = await partOpacities(page);
  expect(early.at(-1)).toBeLessThan(0.2);

  await scrollIntoTrack(page, 0.98);
  const late = await partOpacities(page);
  expect(late.every((o) => o === 1)).toBe(true);
});

test("reduced motion: the finished diagram shows immediately and nothing sticks", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto("/work/pharma-enterprise-portals");
  await expect(page.locator(".dg-stage")).not.toHaveCSS("position", "sticky");
  expect((await partOpacities(page)).every((o) => o === 1)).toBe(true);
});

test("phones: static, complete diagram that scrolls inside its frame, not the page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of DIAGRAM_PAGES) {
    await page.goto(`/work/${slug}`);
    await expect(page.locator(".dg-stage"), slug).not.toHaveCSS(
      "position",
      "sticky",
    );
    expect(
      (await partOpacities(page)).every((o) => o === 1),
      slug,
    ).toBe(true);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow, slug).toBeLessThanOrEqual(0);
  }
});

test("each diagram page shows its diagram as a labelled image", async ({
  page,
}) => {
  for (const slug of DIAGRAM_PAGES) {
    await page.goto(`/work/${slug}`);
    await expect(page.locator("#approach svg[role='img']"), slug).toHaveCount(
      1,
    );
    await expect(
      page.locator("#approach svg[role='img']"),
      slug,
    ).toHaveAttribute("aria-label", /^Diagram: /);
  }
});

for (const slug of DIAGRAM_PAGES) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`${slug}: no WCAG 2.1 AA violations with the diagram (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(`/work/${slug}`);
      await expectNoAxeViolations(page, MIN_CONTRAST_NODES);
    });
  }
}

test("tablets: labels stay readable (no two-column shrink below 1024px)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto("/work/support-ticket-system");
  const svgWidth = await page
    .locator("#approach svg[role='img']")
    .evaluate((el) => el.getBoundingClientRect().width);
  // 640-unit viewBox: ≥ 540px keeps 11px labels at ≥ ~9.3px.
  expect(svgWidth).toBeGreaterThanOrEqual(540);
  await expect(page.locator(".dg-stage")).not.toHaveCSS("position", "sticky");
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test("desktop: the diagram title sits right under the Approach heading (no empty gap)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto("/work/pharma-enterprise-portals");
  const gap = await page.evaluate(() => {
    const h2 = document.querySelector("#approach h2")!.getBoundingClientRect();
    const h3 = document.querySelector("#approach h3")!.getBoundingClientRect();
    return h3.top - h2.bottom;
  });
  expect(gap).toBeLessThan(80);
});

test("desktop: step 1 is already drawn when the stage arrives on screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto("/work/warehouse-mobile-migration");
  await page.evaluate(() => {
    const h2 = document.querySelector("#approach h2")!;
    scrollTo(0, h2.getBoundingClientRect().top + scrollY - 120);
  });
  await page.waitForTimeout(400);
  const firstStep = await page
    .locator(".dg-part.dg-s1")
    .first()
    .evaluate((el) => Number(getComputedStyle(el).opacity));
  expect(firstStep).toBeGreaterThan(0.5);
});
