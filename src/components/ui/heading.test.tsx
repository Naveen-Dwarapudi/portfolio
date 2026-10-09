import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Heading, LineReveal } from "./heading";

describe("Heading", () => {
  it("maps display to h1, and h2/h3 to themselves", () => {
    render(
      <>
        <Heading level="display">Display</Heading>
        <Heading level="h2">Two</Heading>
        <Heading level="h3">Three</Heading>
      </>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Display" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Two" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Three" }),
    ).toBeInTheDocument();
  });
});

describe("LineReveal", () => {
  it("keeps the full text as the heading's accessible name", () => {
    render(
      <Heading level="display">
        <LineReveal
          lines={[
            { text: "Bhavani Sankar" },
            { text: "Naveen" },
            { text: "Dwarapudi." },
          ]}
        />
      </Heading>,
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Bhavani Sankar Naveen Dwarapudi.",
      }),
    ).toBeInTheDocument();
  });

  it("hides the animated fragments from assistive tech", () => {
    const { container } = render(
      <LineReveal lines={[{ text: "A" }, { text: "B" }]} />,
    );
    expect(
      container
        .querySelector(".line-reveal-line")
        ?.closest("[aria-hidden='true']"),
    ).not.toBeNull();
  });

  it("staggers each line with an index", () => {
    const { container } = render(
      <LineReveal lines={[{ text: "A" }, { text: "B" }]} />,
    );
    const lines = container.querySelectorAll<HTMLElement>(".line-reveal-line");
    expect(lines).toHaveLength(2);
    expect(lines[1]?.style.getPropertyValue("--i")).toBe("1");
  });
});
