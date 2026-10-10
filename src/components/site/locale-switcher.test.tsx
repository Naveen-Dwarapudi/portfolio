import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LOCALES } from "@/content/locales";
import { LocaleSwitcher } from "./locale-switcher";

const labels = { languageLabel: "Language", comingSoon: "Coming soon" };

describe("LocaleSwitcher", () => {
  it("names the control with the current language", () => {
    const { container } = render(
      <LocaleSwitcher
        current="en"
        path="/"
        locales={LOCALES}
        labels={labels}
      />,
    );
    expect(container.querySelector("summary")).toHaveAttribute(
      "aria-label",
      "Language: English",
    );
  });

  it("marks the current language and shows unpublished ones as coming soon, not links", () => {
    render(
      <LocaleSwitcher
        current="en"
        path="/"
        locales={LOCALES}
        labels={labels}
      />,
    );
    const list = screen.getByRole("list");
    expect(
      within(list).getByText("English").closest("[aria-current]"),
    ).toHaveAttribute("aria-current", "true");
    for (const name of ["हिन्दी", "తెలుగు"]) {
      const item = within(list).getByText(name).closest("[aria-disabled]");
      expect(item, name).toHaveAttribute("aria-disabled", "true");
      expect(item).toHaveTextContent("Coming soon");
    }
    expect(within(list).queryAllByRole("link")).toEqual([]);
  });

  it("links a published language to the same page in that language", () => {
    const published = LOCALES.map((l) =>
      l.code === "hi" ? { ...l, published: true } : l,
    );
    render(
      <LocaleSwitcher
        current="en"
        path="/work/x"
        locales={published}
        labels={labels}
      />,
    );
    const link = screen.getByRole("link", { name: "हिन्दी" });
    expect(link).toHaveAttribute("href", "/hi/work/x");
    expect(link).toHaveAttribute("hreflang", "hi");
    expect(link).toHaveAttribute("lang", "hi");
  });
});
