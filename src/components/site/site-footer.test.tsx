import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buttonClass } from "@/components/ui/button";
import { homeContent as c } from "@/content/en";
import { SiteFooter } from "./site-footer";

// CopyrightYear is an async "use cache" server component; RTL renders sync.
vi.mock("./copyright-year", () => ({ CopyrightYear: () => "2026" }));

describe("SiteFooter", () => {
  it("renders back to top as a small secondary button with an up arrow", () => {
    render(<SiteFooter footer={c.footer} newTabLabel={c.newTab} />);
    const top = screen.getByRole("link", { name: c.footer.backToTop });
    expect(top).toHaveAttribute("href", "#top");
    expect(top.className).toBe(buttonClass("secondary", "sm"));
    expect(top.querySelector('[aria-hidden="true"]')).toHaveTextContent("↑");
  });
});
