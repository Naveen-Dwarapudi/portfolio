import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { homeContent as c } from "@/content/en";
import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("keeps the visible logo text in the home link's accessible name (WCAG 2.5.3)", () => {
    render(<SiteHeader site={c.site} nav={c.nav} locale="en" path="/" />);
    const home = screen.getByRole("link", { name: /^ND\./ });
    expect(home).toHaveAttribute("href", "/");
    expect(home).toHaveAccessibleName(
      expect.stringContaining(c.site.homeLabel),
    );
  });
});
