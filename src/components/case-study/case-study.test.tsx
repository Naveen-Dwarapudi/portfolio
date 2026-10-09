import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { caseStudies, caseStudyUi, homeContent } from "@/content/en";
import { CaseStudyArticle } from "./case-study-article";
import { CaseStudyPager } from "./case-study-pager";

const client = caseStudies.find((c) => c.slug === "pharma-enterprise-portals")!;
const owned = caseStudies.find((c) => c.slug === "support-ticket-system")!;

function renderStudy(study = client) {
  return render(
    <CaseStudyArticle
      study={study}
      ui={caseStudyUi}
      newTabLabel={homeContent.newTab}
    />,
  );
}

describe("CaseStudyArticle", () => {
  it("has one h1 and the seven outline sections in order", () => {
    renderStudy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const s = caseStudyUi.sections;
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((h) => h.textContent?.replace(/^\d+/, "")),
    ).toEqual([
      s.context,
      s.role,
      s.problem,
      s.approach,
      s.decisions,
      s.impact,
      s.stack,
    ]);
  });

  it("keeps outline text fully visible without scrolling (no scroll-linked fade)", () => {
    const { container } = renderStudy();
    expect(container.querySelectorAll("section.scroll-reveal")).toHaveLength(0);
  });

  it("shows every decision with its trade-off", () => {
    renderStudy();
    for (const d of client.decisions) {
      expect(screen.getByText(d.decision)).toBeInTheDocument();
      expect(screen.getByText(d.tradeoff)).toBeInTheDocument();
    }
    expect(screen.getAllByText(caseStudyUi.tradeoffLabel)).toHaveLength(
      client.decisions.length,
    );
  });

  it("shows no screenshot or live link for client work", () => {
    renderStudy();
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("shows the eager screenshot and a new-tab live link for the self-owned project", () => {
    renderStudy(owned);
    expect(
      screen.getByRole("img", { name: owned.live!.imageAlt }),
    ).toHaveAttribute("loading", "eager");
    const live = screen.getByRole("link", {
      name: `${caseStudyUi.liveSite}: ${owned.title} ${homeContent.newTab}`,
    });
    expect(live).toHaveAttribute("href", owned.live!.url);
    expect(live).toHaveAttribute("target", "_blank");
  });
});

describe("CaseStudyPager", () => {
  it("links previous, next and back to all work", () => {
    const [a, b] = caseStudies;
    render(<CaseStudyPager previous={a!} next={b!} ui={caseStudyUi} />);
    const nav = screen.getByRole("navigation", {
      name: caseStudyUi.pagerLabel,
    });
    expect(
      within(nav).getByRole("link", { name: new RegExp(a!.title) }),
    ).toHaveAttribute("href", `/work/${a!.slug}`);
    expect(
      within(nav).getByRole("link", { name: new RegExp(b!.title) }),
    ).toHaveAttribute("href", `/work/${b!.slug}`);
    expect(
      within(nav).getByRole("link", { name: caseStudyUi.backToWork }),
    ).toHaveAttribute("href", "/#experience");
  });
});
