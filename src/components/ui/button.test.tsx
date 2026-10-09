import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, ButtonLink } from "./button";

describe("ButtonLink", () => {
  it("renders a plain anchor with its href and accessible name", () => {
    render(
      <ButtonLink href="#work" arrow="→">
        View work
      </ButtonLink>,
    );
    const link = screen.getByRole("link", { name: "View work" });
    expect(link).toHaveAttribute("href", "#work");
  });

  it("hides the decorative arrow from assistive tech", () => {
    render(
      <ButtonLink href="#work" arrow="→">
        View work
      </ButtonLink>,
    );
    expect(screen.getByText("→")).toHaveAttribute("aria-hidden", "true");
  });

  it("uses the accent fill for primary and a hairline for secondary", () => {
    render(
      <>
        <ButtonLink href="#a">Primary</ButtonLink>
        <ButtonLink href="#b" variant="secondary">
          Secondary
        </ButtonLink>
      </>,
    );
    expect(screen.getByRole("link", { name: "Primary" }).className).toContain(
      "bg-accent",
    );
    expect(screen.getByRole("link", { name: "Secondary" }).className).toContain(
      "border-line",
    );
  });
});

describe("Button", () => {
  it("defaults to type=button so it never submits a form by accident", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button", { name: "Go" })).toHaveAttribute(
      "type",
      "button",
    );
  });
});
