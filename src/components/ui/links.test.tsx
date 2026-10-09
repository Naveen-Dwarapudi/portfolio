import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { nameWithSuffix } from "@/test/accessible-name";
import { ButtonLink } from "./button";
import { TextLink } from "./text-link";

const NEW_TAB = "(opens in a new tab)";

describe("new-tab links", () => {
  it("ButtonLink opens in a new tab and says so to screen readers", () => {
    render(
      <ButtonLink href="https://example.com" newTabLabel={NEW_TAB}>
        Live site
      </ButtonLink>,
    );
    const link = screen.getByRole("link", {
      name: nameWithSuffix("Live site", NEW_TAB),
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("TextLink opens in a new tab and says so to screen readers", () => {
    render(
      <TextLink href="https://example.com" newTabLabel={NEW_TAB}>
        Source
      </TextLink>,
    );
    const link = screen.getByRole("link", {
      name: nameWithSuffix("Source", NEW_TAB),
    });
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("same-tab links get no target or extra label", () => {
    render(<TextLink href="#top">Back to top</TextLink>);
    const link = screen.getByRole("link", { name: "Back to top" });
    expect(link).not.toHaveAttribute("target");
  });
});
