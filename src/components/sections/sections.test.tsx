import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { homeContent as c } from "@/content/en";
import { nameWithSuffix } from "@/test/accessible-name";
import { About } from "./about";
import { Contact } from "./contact";
import { Credentials } from "./credentials";
import { Experience } from "./experience";
import { Hero } from "./hero";
import { Projects } from "./projects";
import { Skills } from "./skills";

describe("Hero", () => {
  it("links View work to the experience section and downloads the resume", () => {
    render(<Hero hero={c.hero} metrics={c.metrics} />);
    expect(screen.getByRole("link", { name: "View work" })).toHaveAttribute(
      "href",
      "#experience",
    );
    const resume = screen.getByRole("link", { name: "Download resume" });
    expect(resume).toHaveAttribute("href", "/naveen-dwarapudi-resume.pdf");
    expect(resume).toHaveAttribute("download");
  });
});

describe("About", () => {
  it("is a labelled region with the photo, prose and facts", () => {
    render(<About about={c.about} />);
    const region = screen.getByRole("region", { name: c.about.heading });
    expect(
      within(region).getByRole("img", { name: c.about.photoAlt }),
    ).toHaveAttribute("loading", "lazy");
    expect(within(region).getByText(c.about.body)).toBeInTheDocument();
    for (const fact of c.about.facts)
      expect(within(region).getByText(fact)).toBeInTheDocument();
  });
});

describe("Experience", () => {
  it("lists the role and all five engagements as an ordered list", () => {
    render(
      <Experience experience={c.experience} techStackLabel={c.techStack} />,
    );
    expect(
      screen.getByText(c.experience.company, { exact: false }),
    ).toBeInTheDocument();
    const titles = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(titles).toEqual(c.experience.engagements.map((e) => e.title));
  });

  it("contains no links until case studies exist", () => {
    render(
      <Experience experience={c.experience} techStackLabel={c.techStack} />,
    );
    expect(screen.queryAllByRole("link")).toEqual([]);
  });

  it("states that client names are withheld", () => {
    render(
      <Experience experience={c.experience} techStackLabel={c.techStack} />,
    );
    expect(
      screen.getByText(/names withheld under confidentiality/i),
    ).toBeInTheDocument();
  });
});

describe("Skills", () => {
  it("renders all nine groups with their items", () => {
    render(<Skills skills={c.skills} />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(9);
    expect(screen.getByText("RTK Query")).toBeInTheDocument();
  });
});

describe("Projects", () => {
  it("shows the independent project with a new-tab live link and lazy screenshot", () => {
    render(
      <Projects
        projects={c.projects}
        newTabLabel={c.newTab}
        techStackLabel={c.techStack}
      />,
    );
    const live = screen.getByRole("link", {
      name: nameWithSuffix(
        `Live site: ${c.projects.independent.title}`,
        c.newTab,
      ),
    });
    expect(live).toHaveAttribute("href", c.projects.independent.liveUrl);
    expect(live).toHaveAttribute("target", "_blank");
    expect(
      screen.getByRole("img", { name: c.projects.independent.imageAlt }),
    ).toHaveAttribute("loading", "lazy");
  });

  it("labels side projects as practice projects, each with its own link", () => {
    render(
      <Projects
        projects={c.projects}
        newTabLabel={c.newTab}
        techStackLabel={c.techStack}
      />,
    );
    expect(screen.getAllByText(c.projects.sideBadge)).toHaveLength(
      c.projects.side.length,
    );
    for (const s of c.projects.side) {
      expect(
        screen.getByRole("link", {
          name: nameWithSuffix(`Live site: ${s.title}`, c.newTab),
        }),
      ).toHaveAttribute("href", s.liveUrl);
    }
  });
});

describe("Projects headings", () => {
  it("marks each side-project title as a heading under Side projects", () => {
    render(
      <Projects
        projects={c.projects}
        newTabLabel={c.newTab}
        techStackLabel={c.techStack}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 3, name: c.projects.sideLabel }),
    ).toBeInTheDocument();
    for (const s of c.projects.side) {
      expect(
        screen.getByRole("heading", { level: 4, name: s.title }),
      ).toBeInTheDocument();
    }
  });
});

describe("Credentials", () => {
  it("shows the degree and every certification", () => {
    render(<Credentials credentials={c.credentials} />);
    expect(screen.getByText(c.credentials.degree.title)).toBeInTheDocument();
    for (const g of c.credentials.certifications) {
      for (const t of g.titles) expect(screen.getByText(t)).toBeInTheDocument();
    }
  });
});

describe("Contact", () => {
  it("offers a mailto link, copy button and new-tab profile links, with no phone", () => {
    render(<Contact contact={c.contact} newTabLabel={c.newTab} />);
    expect(screen.getByRole("link", { name: c.contact.email })).toHaveAttribute(
      "href",
      `mailto:${c.contact.email}`,
    );
    expect(
      screen.getByRole("button", { name: c.contact.copy.idle }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: nameWithSuffix("LinkedIn", c.newTab) }),
    ).toHaveAttribute("target", "_blank");
    expect(
      screen.getByRole("link", { name: nameWithSuffix("GitHub", c.newTab) }),
    ).toHaveAttribute("target", "_blank");
    expect(screen.queryByRole("link", { name: /tel:|\+91/ })).toBeNull();
  });
});
