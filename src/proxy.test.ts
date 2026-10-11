import { describe, expect, it } from "vitest";
import { RESUME_PATH } from "@/lib/resume";
import { NextRequest } from "next/server";
import { config, isShareImage, proxy } from "./proxy";

// Next compiles the matcher with path-to-regexp; for this pattern (one
// capture group, no named params) a plain anchored RegExp is equivalent.
const matcher = new RegExp(`^${config.matcher[0]}$`);

describe("proxy matcher", () => {
  it("skips Next internals and the real static files", () => {
    for (const path of [
      "/_next/static/chunks/a.js",
      "/_next/image",
      "/icon.svg",
      "/api/contact",
      "/robots.txt",
      "/sitemap.xml",
      "/apple-icon",
      RESUME_PATH,
    ]) {
      expect(matcher.test(path), path).toBe(false);
    }
  });

  it("runs for every other path, including ones with a dot", () => {
    for (const path of [
      "/",
      "/work/pharma-enterprise-portals",
      "/hi",
      "/favicon.ico",
      "/en/work/x.pdf",
      "/work/pharma-enterprise-portals.x",
    ]) {
      expect(matcher.test(path), path).toBe(true);
    }
  });
});

describe("share images", () => {
  it.each([
    ["/opengraph-image", true],
    ["/work/workflow-portal/opengraph-image/card", true],
    ["/work/nope/opengraph-image/card", false],
    ["/work/workflow-portal/other", false],
    ["/opengraph-image/x/y", false],
  ])("isShareImage(%s) = %s", (rest, expected) => {
    expect(isShareImage(rest)).toBe(expected);
  });

  it("serves /en share-image URLs directly instead of redirecting", () => {
    const res = proxy(
      new NextRequest(
        "https://site.example/en/work/workflow-portal/opengraph-image/card",
      ),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("still redirects other /en URLs", () => {
    const res = proxy(
      new NextRequest("https://site.example/en/work/workflow-portal"),
    );
    expect(res.status).toBe(308);
  });
});
