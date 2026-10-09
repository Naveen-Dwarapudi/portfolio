import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Portrait } from "./portrait";

const image = {
  src: "/_next/static/media/mypic-2.jpeg",
  width: 886,
  height: 886,
};

describe("Portrait", () => {
  it("renders an optimized, eagerly loaded image with alt text", () => {
    render(
      <Portrait
        src={image}
        alt="Portrait of Bhavani Sankar Naveen Dwarapudi"
      />,
    );
    const img = screen.getByRole("img", {
      name: "Portrait of Bhavani Sankar Naveen Dwarapudi",
    });
    expect(img).toHaveAttribute(
      "srcset",
      expect.stringContaining("/_next/image?url="),
    );
    expect(img).toHaveAttribute("fetchpriority", "high");
    expect(img).not.toHaveAttribute("loading", "lazy");
  });

  it("renders the badge when given", () => {
    render(<Portrait src={image} alt="Portrait" badge="4+ yrs" />);
    expect(screen.getByText("4+ yrs")).toBeInTheDocument();
  });
});
