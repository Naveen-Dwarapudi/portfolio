import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

/** Case-study pages check 55–68 contrast nodes (measured in phase 4a). */
const CASE_STUDY_MIN_CONTRAST_NODES = 45;

const SLUGS = [
  "pharma-enterprise-portals",
  "municipal-bill-payment",
  "workflow-portal",
  "warehouse-mobile-migration",
  "healthcare-ecommerce-app",
  "support-ticket-system",
];

test("each home-page case-study link opens its page", async ({ page }) => {
  await page.goto("/");
  const links = page.getByRole("link", { name: /^Read case study: / });
  await expect(links).toHaveCount(SLUGS.length);
  const hrefs = await links.evaluateAll((els) =>
    els.map((el) => el.getAttribute("href")),
  );
  expect(hrefs.sort()).toEqual(SLUGS.map((s) => `/work/${s}`).sort());

  await links.first().click();
  await expect(page).toHaveURL(/\/work\/pharma-enterprise-portals$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Pharmaceutical B2B ordering platform",
  );
});

test("next walks through all six case studies and wraps", async ({ page }) => {
  await page.goto(`/work/${SLUGS[0]}`);
  const pager = page.getByRole("navigation", { name: "More case studies" });
  for (const slug of [...SLUGS.slice(1), SLUGS[0]]) {
    await pager.getByRole("link", { name: /^Next/ }).click();
    await expect(page).toHaveURL(new RegExp(`/work/${slug}$`));
  }
});

test("previous wraps from the first study to the last", async ({ page }) => {
  await page.goto(`/work/${SLUGS[0]}`);
  await page
    .getByRole("navigation", { name: "More case studies" })
    .getByRole("link", { name: /^← ?Previous|^Previous/ })
    .click();
  await expect(page).toHaveURL(new RegExp(`/work/${SLUGS.at(-1)}$`));
});

test("back to all work returns to the experience section", async ({ page }) => {
  await page.goto("/work/workflow-portal");
  await page.getByRole("link", { name: "Back to all work" }).click();
  await expect(page).toHaveURL(/\/#experience$/);
  await expect(page.locator("#experience")).toBeInViewport();
});

test("header links work from a case-study page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/work/workflow-portal");
  await page
    .getByRole("navigation", { name: "Sections" })
    .getByRole("link", { name: "Skills" })
    .click();
  await expect(page).toHaveURL(/\/#skills$/);
});

test("unknown case studies return a real 404", async ({ request }) => {
  for (const path of ["/work/nope", "/work/nope/deeper", "/work"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
  for (const slug of SLUGS) {
    expect((await request.get(`/work/${slug}`)).status(), slug).toBe(200);
  }
});

test("each case study has its own title and description", async ({ page }) => {
  await page.goto("/work/municipal-bill-payment");
  await expect(page).toHaveTitle(
    "Municipal bill payment platform | Naveen Dwarapudi",
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /^Two single-page apps/,
  );
});

for (const slug of ["pharma-enterprise-portals", "support-ticket-system"]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`${slug}: no WCAG 2.1 AA violations (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(`/work/${slug}`);
      await expectNoAxeViolations(page, CASE_STUDY_MIN_CONTRAST_NODES);
    });
  }
}

test("case studies have no horizontal scroll at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const slug of SLUGS) {
    await page.goto(`/work/${slug}`);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow, slug).toBeLessThanOrEqual(0);
  }
});

test("client case studies show no screenshots", async ({ page }) => {
  for (const slug of SLUGS.filter((s) => s !== "support-ticket-system")) {
    await page.goto(`/work/${slug}`);
    await expect(page.locator("main img"), slug).toHaveCount(0);
  }
});

for (const target of ["light", "dark"] as const) {
  test(`case study: no WCAG 2.1 AA violations when toggled to ${target}`, async ({
    page,
  }) => {
    await page.emulateMedia({
      colorScheme: target === "light" ? "dark" : "light",
    });
    await page.goto("/work/pharma-enterprise-portals");
    await page
      .getByRole("button", { name: `Switch to ${target} theme` })
      .click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", target);
    await expectNoAxeViolations(page, CASE_STUDY_MIN_CONTRAST_NODES);
  });
}

test("navigating home → case study cross-fades (theme-wipe CSS doesn't suppress it)", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.addEventListener("pagereveal", (event) => {
      const vt = (event as Event & { viewTransition?: unknown }).viewTransition;
      requestAnimationFrame(() => {
        (window as unknown as { __vt: unknown }).__vt = {
          active: Boolean(vt),
          fades: document
            .getAnimations()
            .map(
              (a) => (a.effect as KeyframeEffect | null)?.pseudoElement ?? "",
            )
            .filter((p) => p.startsWith("::view-transition-")),
        };
      });
    });
  });
  await page.goto("/");
  await page
    .getByRole("link", { name: /^Read case study: / })
    .first()
    .click();
  await expect(page).toHaveURL(/\/work\//);
  const vt = await page.waitForFunction(
    () => (window as unknown as { __vt?: unknown }).__vt,
  );
  const { active, fades } = (await vt.jsonValue()) as {
    active: boolean;
    fades: string[];
  };
  expect(active).toBe(true);
  expect(fades).toContain("::view-transition-new(root)");
});
