import { describe, expect, it } from "vitest";
import { isSameOrigin } from "./origin";

const h = (init: Record<string, string>) => new Headers(init);

describe("isSameOrigin", () => {
  it("accepts a matching origin and host", () => {
    expect(
      isSameOrigin(h({ origin: "https://site.example", host: "site.example" })),
    ).toBe(true);
  });

  it("prefers x-forwarded-host behind a proxy", () => {
    expect(
      isSameOrigin(
        h({
          origin: "https://site.example",
          host: "internal:3000",
          "x-forwarded-host": "site.example",
        }),
      ),
    ).toBe(true);
  });

  it.each([
    [
      "a different origin",
      { origin: "https://evil.example", host: "site.example" },
    ],
    ["no origin", { host: "site.example" }],
    ["a malformed origin", { origin: "not a url", host: "site.example" }],
  ])("refuses %s", (_, init) => {
    expect(isSameOrigin(h(init))).toBe(false);
  });
});
