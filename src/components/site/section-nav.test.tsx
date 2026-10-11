import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { activeSection, SectionNav } from "./section-nav";

const items = [
  { id: "about", label: "About", href: "/#about" },
  { id: "experience", label: "Experience", href: "/#experience" },
  { id: "skills", label: "Skills", href: "/#skills" },
];

describe("activeSection", () => {
  const tops = (about: number, experience: number, skills: number) => [
    { id: "about", top: about },
    { id: "experience", top: experience },
    { id: "skills", top: skills },
  ];

  it("is none above the first section (the hero)", () => {
    expect(activeSection(tops(500, 1500, 2500), 200, false)).toBeNull();
  });

  it("is the last section whose top has passed the line", () => {
    expect(activeSection(tops(-800, 150, 1200), 200, false)).toBe("experience");
  });

  it("is the last section at the bottom of the page", () => {
    expect(activeSection(tops(-2000, -1000, 400), 200, true)).toBe("skills");
  });
});

/** Places each section's top at the given viewport offset. */
function placeSections(offsets: Record<string, number>) {
  document.getElementById("sections")?.remove();
  const root = document.createElement("div");
  root.id = "sections";
  for (const [id, top] of Object.entries(offsets)) {
    const el = document.createElement("section");
    el.id = id;
    el.getBoundingClientRect = () => ({ top }) as DOMRect;
    root.append(el);
  }
  document.body.append(root);
}

afterEach(() => {
  document.getElementById("sections")?.remove();
});

describe("SectionNav", () => {
  it("renders a labelled nav with every link", () => {
    render(<SectionNav label="Sections" items={items} spy={false} />);
    const nav = screen.getByRole("navigation", { name: "Sections" });
    expect(nav.querySelectorAll("a")).toHaveLength(3);
  });

  it("marks nothing current when not spying (other pages)", () => {
    placeSections({ about: -100, experience: 800, skills: 1600 });
    render(<SectionNav label="Sections" items={items} spy={false} />);
    fireEvent.scroll(window);
    expect(document.querySelector("[aria-current]")).toBeNull();
  });

  it("marks the section in view as current while scrolling", () => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    placeSections({ about: 900, experience: 1800, skills: 2600 });
    render(<SectionNav label="Sections" items={items} spy />);
    expect(document.querySelector("[aria-current]")).toBeNull();

    placeSections({ about: -600, experience: 100, skills: 900 });
    act(() => {
      fireEvent.scroll(window);
    });
    expect(screen.getByRole("link", { name: "Experience" })).toHaveAttribute(
      "aria-current",
      "location",
    );
    vi.unstubAllGlobals();
  });

  it("highlights a link as soon as it is clicked", () => {
    render(<SectionNav label="Sections" items={items} spy />);
    const skills = screen.getByRole("link", { name: "Skills" });
    fireEvent.click(skills);
    expect(skills).toHaveAttribute("aria-current", "location");
  });
});
