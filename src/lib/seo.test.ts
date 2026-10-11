import { describe, expect, it } from "vitest";
import { absoluteUrl, pageMetadata } from "./seo";

describe("absoluteUrl", () => {
  it("joins paths onto the canonical origin", () => {
    const base = new URL("https://site.example");
    expect(absoluteUrl("/work/x", base)).toBe("https://site.example/work/x");
    expect(absoluteUrl("/", base)).toBe("https://site.example/");
  });
});

describe("pageMetadata", () => {
  const meta = pageMetadata({
    title: "T",
    description: "D",
    path: "/work/x",
    type: "article",
    siteName: "S",
  });

  it("sets the canonical path (made absolute by metadataBase)", () => {
    expect(meta.alternates).toEqual({ canonical: "/work/x" });
  });

  it("fills Open Graph and a large Twitter card", () => {
    expect(meta.openGraph).toEqual({
      type: "article",
      url: "/work/x",
      title: "T",
      description: "D",
      siteName: "S",
      locale: "en",
    });
    expect(meta.twitter).toEqual({
      card: "summary_large_image",
      title: "T",
      description: "D",
    });
  });
});
