import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

/** Every route, with the minimum contrast nodes axe must have checked. */
const ROUTES: [string, number][] = [
  ["/", 150],
  ["/work/pharma-enterprise-portals", 45],
  ["/work/municipal-bill-payment", 45],
  ["/work/workflow-portal", 45],
  ["/work/warehouse-mobile-migration", 45],
  ["/work/healthcare-ecommerce-app", 45],
  ["/work/support-ticket-system", 45],
  ["/no-such-page", 10],
];

for (const [route, minNodes] of ROUTES) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`${route}: no WCAG 2.1 AA violations (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(route);
      await expectNoAxeViolations(page, minNodes);
    });
  }
}

async function focusRing(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const style = getComputedStyle(el);
    return {
      name:
        el.getAttribute("aria-label") ??
        el.textContent?.replace(/\s+/g, " ").trim(),
      outline: style.outlineStyle,
    };
  });
}

test("the header is keyboard-reachable in order, each stop with a visible ring", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const expected = [
    /^Skip to/,
    /^ND\./,
    /^About$/,
    /^Experience$/,
    /^Skills$/,
    /^Projects$/,
    /^Contact$/,
    /^Search the site$/,
    /^English, Language$/,
    /^Switch to (light|dark) theme$/,
  ];
  for (const name of expected) {
    await page.keyboard.press("Tab");
    const { name: actual, outline } = await focusRing(page);
    expect(actual, String(name)).toMatch(name);
    expect(outline, String(name)).not.toBe("none");
  }
});

test("the 404 page starts with a skip link", async ({ page }) => {
  await page.goto("/no-such-page");
  await page.keyboard.press("Tab");
  expect((await focusRing(page)).name).toMatch(/^Skip to/);
});

// The card spotlight (B8) is a gradient, which axe can't measure, so its
// contrast is pinned by src/test/accent-contrast.test.ts from the real tokens.
