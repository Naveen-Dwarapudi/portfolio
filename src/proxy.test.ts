import { describe, expect, it } from "vitest";
import { RESUME_PATH } from "@/lib/resume";
import { config } from "./proxy";

// Next compiles the matcher with path-to-regexp; for this pattern (one
// capture group, no named params) a plain anchored RegExp is equivalent.
const matcher = new RegExp(`^${config.matcher[0]}$`);

describe("proxy matcher", () => {
  it("skips Next internals and the real static files", () => {
    for (const path of [
      "/_next/static/chunks/a.js",
      "/_next/image",
      "/icon.svg",
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
      "/robots.txt",
      "/en/work/x.pdf",
      "/work/pharma-enterprise-portals.x",
    ]) {
      expect(matcher.test(path), path).toBe(true);
    }
  });
});
