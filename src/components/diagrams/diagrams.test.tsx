import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { caseStudies } from "@/content/en";
import type { CaseStudy, CaseStudyDiagram } from "@/content/types";
import { Diagram } from "./diagram";
import { ScrollDiagram } from "./scroll-diagram";

const withDiagram = caseStudies.filter(
  (c): c is CaseStudy & { diagram: CaseStudyDiagram } => Boolean(c.diagram),
);

describe("Diagram", () => {
  for (const study of withDiagram) {
    it(`renders the ${study.diagram.kind} SVG as one labelled image with every label`, () => {
      const { container } = render(<Diagram diagram={study.diagram} />);
      const svg = screen.getByRole("img", { name: study.diagram.ariaLabel });
      expect(svg.tagName.toLowerCase()).toBe("svg");
      const text = container.textContent ?? "";
      for (const label of Object.values(study.diagram.labels)) {
        expect(text, label).toContain(label);
      }
    });
  }

  it("tags every animated part with a step class within the study's step count", () => {
    for (const study of withDiagram) {
      const { container, unmount } = render(
        <Diagram diagram={study.diagram} />,
      );
      const steps = new Set(
        [...container.querySelectorAll("[class*='dg-s']")]
          .flatMap((el) => (el.getAttribute("class") ?? "").split(/\s+/))
          .filter((c) => /^dg-s\d$/.test(c)),
      );
      expect([...steps].sort(), study.slug).toEqual(
        study.approach.map((_, i) => `dg-s${i + 1}`),
      );
      unmount();
    }
  });
});

describe("ScrollDiagram", () => {
  it("shows the title and the steps as an ordered list beside the diagram", () => {
    const study = withDiagram[0]!;
    render(<ScrollDiagram diagram={study.diagram} steps={study.approach} />);
    expect(
      screen.getByRole("heading", { level: 3, name: study.diagram.title }),
    ).toBeInTheDocument();
    const list = screen.getByRole("list");
    expect(list.tagName.toLowerCase()).toBe("ol");
    // WebKit drops the list role when list-style is none; keep it explicit.
    expect(list).toHaveAttribute("role", "list");
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual(study.approach);
  });

  it("makes the canvas keyboard-focusable, since it scrolls sideways on phones", () => {
    const study = withDiagram[0]!;
    render(<ScrollDiagram diagram={study.diagram} steps={study.approach} />);
    expect(
      screen.getByRole("group", { name: study.diagram.title }),
    ).toHaveAttribute("tabindex", "0");
  });
});
