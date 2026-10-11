import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

const TURNSTILE = "https://challenges.cloudflare.com/turnstile/v0/api.js*";

/**
 * Stands in for Cloudflare's script: renders nothing and issues a token at
 * once (window.__tsToken overrides it, e.g. "fail"). The server runs with
 * CONTACT_DRY_RUN=1, which accepts any token except "fail".
 */
const FAKE_TURNSTILE = `window.turnstile = {
  render(el, opts) { setTimeout(() => opts.callback(window.__tsToken || "e2e-token")); return "w1"; },
  reset() {}, remove() {}
};`;

async function setup(page: Page, { token }: { token?: string } = {}) {
  // A unique "IP" per test (workers run in parallel against one server), so
  // the in-memory rate limit never leaks between tests.
  await page.setExtraHTTPHeaders({ "x-forwarded-for": crypto.randomUUID() });
  await page.route(TURNSTILE, (route) =>
    route.fulfill({ contentType: "text/javascript", body: FAKE_TURNSTILE }),
  );
  if (token)
    await page.addInitScript(
      (t) => ((window as unknown as { __tsToken: string }).__tsToken = t),
      token,
    );
  await page.goto("/#contact");
  await page.waitForLoadState("networkidle");
  const form = page.getByRole("form", { name: "Send a message" });
  return {
    form,
    name: form.getByLabel("Name"),
    email: form.getByLabel("Email"),
    message: form.getByLabel("Message"),
    submit: form.getByRole("button", { name: "Send message" }),
  };
}

async function fill(f: Awaited<ReturnType<typeof setup>>) {
  await f.name.fill("Ada Lovelace");
  await f.email.fill("ada@example.com");
  await f.message.fill("Hello! I enjoyed your portfolio.");
}

test("sending a message shows the success panel", async ({ page }) => {
  const f = await setup(page);
  await fill(f);
  await f.submit.click();
  const panel = page.getByRole("status").filter({
    hasText: "Thanks, your message is on its way.",
  });
  await expect(panel).toBeFocused();
  await page.getByRole("button", { name: "Send another message" }).click();
  await expect(f.name).toHaveValue("");
});

test("an empty submit shows three errors and focuses Name", async ({
  page,
}) => {
  const f = await setup(page);
  await f.submit.click();
  await expect(f.name).toBeFocused();
  await expect(f.name).toHaveAttribute("aria-invalid", "true");
  await expect(f.form.getByText("Please enter your name.")).toBeVisible();
  await expect(
    f.form.getByText("Please enter a valid email address."),
  ).toBeVisible();
  await expect(
    f.form.getByText("Please write at least 10 characters."),
  ).toBeVisible();
});

test("a failed human check shows the verification alert", async ({ page }) => {
  const f = await setup(page, { token: "fail" });
  await fill(f);
  await f.submit.click();
  const alert = f.form.getByRole("alert");
  await expect(alert).toContainText("We couldn't confirm you're human");
  await expect(alert).toBeFocused();
  await expect(
    alert.getByRole("link", { name: "dbsnaveen@gmail.com" }),
  ).toBeVisible();
});

test("the fourth message from one visitor is rate limited", async ({
  page,
}) => {
  const f = await setup(page);
  for (let i = 0; i < 3; i++) {
    await fill(f);
    await f.submit.click();
    await page.getByRole("button", { name: "Send another message" }).click();
  }
  await fill(f);
  await f.submit.click();
  await expect(f.form.getByRole("alert")).toContainText(
    "You've sent a few messages already",
  );
});

test("Cloudflare's script isn't requested until the form is focused", async ({
  page,
}) => {
  const requested: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("challenges.cloudflare.com")) requested.push(r.url());
  });
  const f = await setup(page);
  expect(requested).toEqual([]);
  await f.name.focus();
  await expect.poll(() => requested.length).toBe(1);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`no WCAG 2.1 AA violations on the form, with errors (${colorScheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    const f = await setup(page);
    await expectNoAxeViolations(page, 150);
    await f.submit.click();
    await expect(f.name).toBeFocused();
    await expectNoAxeViolations(page, 150);
  });
}
