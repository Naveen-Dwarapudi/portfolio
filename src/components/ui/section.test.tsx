import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "./card";
import { Chip } from "./chip";
import { Section } from "./section";
import { TextLink } from "./text-link";

describe("Section", () => {
  it("is a labelled region with its numbered label", () => {
    render(
      <Section id="work" index="02" label="Selected work">
        <h2 id="work-heading">Work</h2>
      </Section>,
    );
    expect(screen.getByRole("region", { name: "Work" })).toHaveAttribute(
      "id",
      "work",
    );
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText(/Selected work/)).toBeInTheDocument();
  });
});

describe("Chip", () => {
  it("renders its text", () => {
    render(<Chip>React</Chip>);
    expect(screen.getByText("React")).toBeInTheDocument();
  });
});

describe("TextLink", () => {
  it("renders an accent-underlined anchor", () => {
    render(<TextLink href="/resume">Resume</TextLink>);
    const link = screen.getByRole("link", { name: "Resume" });
    expect(link).toHaveAttribute("href", "/resume");
    expect(link.className).toContain("text-accent");
  });
});

describe("Card", () => {
  it("renders a surface with a hairline border", () => {
    render(<Card>Body</Card>);
    const card = screen.getByText("Body");
    expect(card.className).toContain("bg-surface");
    expect(card.className).toContain("border-line");
  });
});
