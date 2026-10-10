import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { homeContent } from "@/content/en";
import { HomePage } from "./home-page";

function renderHome() {
  return render(<HomePage content={homeContent} locale="en" />);
}

describe("HomePage", () => {
  it("renders the full name as the only h1", () => {
    renderHome();
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveAccessibleName(
      "Bhavani Sankar Naveen Dwarapudi.",
    );
  });

  it("wraps content in a main landmark that the skip link targets", () => {
    renderHome();
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });

  it("renders every section the header links to, in order", () => {
    const { container } = renderHome();
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
    renderHome();
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

  it("includes the header with the language switcher", () => {
    renderHome();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getAllByText("Coming soon")).toHaveLength(2);
  });
});
