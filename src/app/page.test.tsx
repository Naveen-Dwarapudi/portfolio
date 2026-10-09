import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home", () => {
  it("renders the full name as the only h1", () => {
    render(<Home />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveAccessibleName(
      "Bhavani Sankar Naveen Dwarapudi.",
    );
  });

  it("wraps content in a main landmark that the skip link targets", () => {
    render(<Home />);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });

  it("renders every section the header links to, in order", () => {
    const { container } = render(<Home />);
    const ids = [...container.querySelectorAll("section[id]")].map((s) => s.id);
    expect(ids).toEqual([
      "about",
      "experience",
      "skills",
      "projects",
      "credentials",
      "contact",
    ]);
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
});
