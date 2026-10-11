import { describe, expect, it } from "vitest";
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

describe("robots.txt", () => {
  it("allows the site, keeps crawlers off the API and points at the sitemap", () => {
    expect(robots()).toEqual({
      rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
      sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    });
  });
});
