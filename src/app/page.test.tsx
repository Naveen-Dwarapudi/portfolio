import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("@/images/mypic-2.jpeg", () => ({
  default: { src: "/_next/static/media/mypic-2.jpeg", width: 886, height: 886 },
}));

describe("Home (design-system showcase)", () => {
  it("renders the full name as the only h1", () => {
    render(<Home />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveAccessibleName(
      "Bhavani Sankar Naveen Dwarapudi.",
    );
  });

  it("renders the resume positioning line", () => {
    render(<Home />);
    expect(
      screen.getByText(
        "React.js Developer | React Native Developer | Full-Stack (MERN) Engineer",
      ),
    ).toBeInTheDocument();
  });

  it("wraps content in a main landmark that the skip link targets", () => {
    render(<Home />);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });

  it("shows the portrait with the full name in its alt text", () => {
    render(<Home />);
    expect(
      screen.getByRole("img", {
        name: "Portrait of Bhavani Sankar Naveen Dwarapudi",
      }),
    ).toBeInTheDocument();
  });

  it("shows all four metrics with their final values", () => {
    render(<Home />);
    for (const label of [
      "years in production",
      "client engagements",
      "faster component builds",
      "industries",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("states that client names are withheld", () => {
    // Names themselves are guarded repo-wide by src/test/confidentiality.test.ts.
    render(<Home />);
    expect(
      screen.getByText(/names withheld under confidentiality/i),
    ).toBeInTheDocument();
  });
});
