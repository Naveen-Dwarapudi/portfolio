import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home (placeholder)", () => {
  it("renders the owner's name as the only h1", () => {
    render(<Home />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("Naveen Dwarapudi");
  });

  it("renders the resume positioning line", () => {
    render(<Home />);
    expect(
      screen.getByText(
        "React.js Developer | React Native Developer | Full-Stack (MERN) Engineer",
      ),
    ).toBeInTheDocument();
  });

  it("wraps content in a main landmark", () => {
    render(<Home />);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
