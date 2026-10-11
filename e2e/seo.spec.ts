import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

const ROUTES = [
  "/",
  "/work/pharma-enterprise-portals",
  "/work/municipal-bill-payment",
  "/work/workflow-portal",
  "/work/warehouse-mobile-migration",
  "/work/healthcare-ecommerce-app",
  "/work/support-ticket-system",
];

const meta = (page: Page, attr: "property" | "name", key: string) =>
  page.locator(`meta[${attr}="${key}"]`).first().getAttribute("content");

/** Width and height from a PNG's IHDR chunk. */
function pngSize(buf: Buffer) {
  expect(buf.subarray(1, 4).toString()).toBe("PNG");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** Fetch a site URL as the test server sees it (og URLs use NEXT_PUBLIC_SITE_URL). */
async function fetchSitePath(request: APIRequestContext, absolute: string) {
  const { pathname, search } = new URL(absolute);
  return request.get(pathname + search, { maxRedirects: 0 });
}

for (const route of ROUTES) {
  test(`${route} has canonical, Open Graph and Twitter metadata`, async ({
    page,
    request,
  }) => {
    await page.goto(route);
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(new URL(canonical!).pathname).toBe(route);
    expect(await meta(page, "property", "og:title")).toBeTruthy();
    expect(await meta(page, "property", "og:description")).toBeTruthy();
    expect(await meta(page, "property", "og:url")).toBe(canonical);
    expect(await meta(page, "property", "og:type")).toBe(
      route === "/" ? "website" : "article",
    );
    expect(await meta(page, "name", "twitter:card")).toBe(
      "summary_large_image",
    );
    expect(await meta(page, "property", "og:image:alt")).toBeTruthy();

    const image = await meta(page, "property", "og:image");
    expect(image).toMatch(/^https?:\/\//);
    const res = await fetchSitePath(request, image!);
    expect(res.status(), image!).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
    expect(pngSize(await res.body())).toEqual({ width: 1200, height: 630 });
  });
}

test("sitemap.xml lists the home page and every case study", async ({
  request,
}) => {
  const res = await request.get("/sitemap.xml", { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  const locs = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (m) => new URL(m[1]!).pathname,
  );
  expect(locs).toEqual(ROUTES);
});

test("robots.txt keeps crawlers off the API and names the sitemap", async ({
  request,
}) => {
  const res = await request.get("/robots.txt", { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain("Disallow: /api/");
  expect(body).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/);
});

test("the home page describes the owner as a Person", async ({ page }) => {
  await page.goto("/");
  const graphs = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  const person = graphs
    .flatMap((g) => JSON.parse(g)["@graph"] ?? [])
    .find((n: { "@type": string }) => n["@type"] === "Person");
  expect(person.name).toBe("Bhavani Sankar Naveen Dwarapudi");
  expect(person.sameAs).toContain("https://github.com/Naveen-Dwarapudi");
});

test("each case study is a CreativeWork", async ({ page }) => {
  await page.goto("/work/workflow-portal");
  const data = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent())!,
  );
  expect(data["@type"]).toBe("CreativeWork");
});

test("the Apple touch icon and theme colours are declared and served", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const href = await page
    .locator('link[rel="apple-touch-icon"]')
    .getAttribute("href");
  const res = await request.get(href!, { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  expect(pngSize(await res.body())).toEqual({ width: 180, height: 180 });
  await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);
});
