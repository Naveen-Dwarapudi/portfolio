import { expect, test } from "@playwright/test";

test("reduced motion shows the final state with no movement", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByText("client engagements")).toBeVisible();
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
    page.getByRole("heading", { name: "Production apps, not side quests." }),
  ).toBeVisible();
});
