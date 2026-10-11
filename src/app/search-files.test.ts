import { afterEach, describe, expect, it, vi } from "vitest";
import { caseStudies } from "@/content/en/case-studies";
import { siteUrl } from "@/lib/site-url";
import { confidentialTermsIn } from "@/test/confidential-terms";
import robots from "./robots";
import sitemap from "./sitemap";

describe("sitemap.xml", () => {
  const entries = sitemap();

  it("lists the home page and every case study, absolute", () => {
    expect(entries.map((e) => e.url)).toEqual([
      new URL("/", siteUrl).toString(),
      ...caseStudies.map((c) => new URL(`/work/${c.slug}`, siteUrl).toString()),
    ]);
    expect(entries).toHaveLength(7);
  });

  it("never names a client", () => {
    expect(confidentialTermsIn(JSON.stringify(entries))).toEqual([]);
  });
});

describe("sitemap lastModified", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses the build time stamped in next.config.ts", () => {
    vi.stubEnv("BUILD_TIME", "2026-10-11T00:00:00.000Z");
    expect(
      sitemap().every((e) => e.lastModified === "2026-10-11T00:00:00.000Z"),
    ).toBe(true);
  });
});

describe("robots.txt", () => {
  it("allows the site, keeps crawlers off the API and points at the sitemap", () => {
    expect(robots()).toEqual({
      rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
      sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    });
  });
});
