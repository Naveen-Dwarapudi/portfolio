import { describe, expect, it } from "vitest";
import { resolveSiteUrl, SITE_URL_FALLBACK } from "./site-url";

describe("resolveSiteUrl", () => {
  it("falls back to localhost when unset", () => {
    expect(resolveSiteUrl(undefined).href).toBe(`${SITE_URL_FALLBACK}/`);
  });

  it("falls back to localhost when blank", () => {
    expect(resolveSiteUrl("   ").href).toBe(`${SITE_URL_FALLBACK}/`);
  });

  it("keeps a well-formed https origin", () => {
    expect(resolveSiteUrl("https://naveen.dev").origin).toBe("https://naveen.dev");
  });

  it("assumes https when the protocol is missing", () => {
    expect(resolveSiteUrl("portfolio.vercel.app").origin).toBe(
      "https://portfolio.vercel.app",
    );
  });

  it("drops trailing slash, path, query and hash", () => {
    const url = resolveSiteUrl("https://naveen.dev/some/path/?a=1#top");
    expect(url.href).toBe("https://naveen.dev/");
  });

  it("trims surrounding whitespace", () => {
    expect(resolveSiteUrl("  https://naveen.dev  ").origin).toBe("https://naveen.dev");
  });

  it("throws a message naming the env var when malformed", () => {
    expect(() => resolveSiteUrl("https://not a url")).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });
});
