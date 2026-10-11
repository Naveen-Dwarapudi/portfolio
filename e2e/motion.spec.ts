import { expect, test } from "@playwright/test";

test("reduced motion shows the final state with no movement", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByText("client engagements", { exact: true }),
  ).toBeVisible();
  const metric = page.locator("dd").filter({ hasText: "30" });
  await expect(metric).toContainText("30");

  const animations = await page.evaluate(
    () =>
      document.getAnimations().filter((a) => a.playState === "running").length,
  );
  expect(animations).toBe(0);
});

test("content is complete when app JavaScript fails to load", async ({
  page,
}) => {
  await page.route("**/_next/static/chunks/**/*.js", (route) => route.abort());
  await page.goto("/");
  await page.waitForTimeout(1500);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Bhavani Sankar Naveen Dwarapudi.",
    }),
  ).toBeVisible();
  for (const value of ["4", "5", "30"]) {
    await expect(
      page.locator("dd").filter({ hasText: value }).first(),
    ).toBeVisible();
  }
  await expect(
    page.getByRole("img", { name: /Portrait of Bhavani Sankar/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Five client engagements, one standard.",
    }),
  ).toBeVisible();
});

for (const route of ["/", "/work/warehouse-mobile-migration"]) {
  test(`reduced motion on ${route}: nothing animates on load, scroll or theme switch`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const running = () =>
      page.evaluate(
        () =>
          document.getAnimations().filter((a) => a.playState === "running")
            .length,
      );
    expect(await running()).toBe(0);
    expect(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      ),
    ).toBe("auto");
    // Reveal content is fully visible without scrolling.
    const hidden = await page.evaluate(
      () =>
        [
          ...document.querySelectorAll<HTMLElement>(
            ".scroll-reveal, .fade-up, .dg-part",
          ),
        ].filter((el) => Number(getComputedStyle(el).opacity) < 1).length,
    );
    expect(hidden).toBe(0);
    await page.mouse.wheel(0, 2500);
    expect(await running()).toBe(0);
    await page
      .getByRole("button", { name: /^Switch to (light|dark) theme$/ })
      .click();
    expect(await running()).toBe(0);
  });
}
