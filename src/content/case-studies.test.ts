import { describe, expect, it } from "vitest";
import {
  adjacentCaseStudies,
  findCaseStudy,
  getAdjacent,
  getCaseStudy,
} from "./case-studies";
import { caseStudies, homeContent } from "./en";
import type { CaseStudy } from "./types";

describe("caseStudies content", () => {
  it("has six studies with unique slugs", () => {
    const slugs = caseStudies.map((c) => c.slug);
    expect(slugs).toHaveLength(6);
    expect(new Set(slugs).size).toBe(6);
  });

  it("fills every part of the outline for each study", () => {
    for (const c of caseStudies) {
      for (const field of [
        c.kicker,
        c.title,
        c.summary,
        c.context,
        c.role,
        c.problem,
      ]) {
        expect(field.trim(), c.slug).not.toBe("");
      }
      expect(c.approach.length, c.slug).toBeGreaterThanOrEqual(3);
      expect(c.approach.length, c.slug).toBeLessThanOrEqual(5);
      expect(c.decisions.length, c.slug).toBeGreaterThanOrEqual(2);
      expect(c.decisions.length, c.slug).toBeLessThanOrEqual(4);
      for (const d of c.decisions) {
        expect(d.decision.trim(), c.slug).not.toBe("");
        expect(d.tradeoff.trim(), c.slug).not.toBe("");
      }
      expect(c.impact.length, c.slug).toBeGreaterThanOrEqual(1);
      expect(c.stack.length, c.slug).toBeGreaterThanOrEqual(3);
    }
  });

  it("shows a live site and screenshot only for the self-owned project", () => {
    expect(caseStudies.filter((c) => c.live).map((c) => c.slug)).toEqual([
      "support-ticket-system",
    ]);
  });

  it("gives every home-page link a case study to open", () => {
    const linked = [
      ...homeContent.experience.engagements.map((e) => e.slug),
      homeContent.projects.independent.slug,
    ];
    for (const slug of linked) expect(getCaseStudy(slug), slug).toBeDefined();
  });

  it("describes client work with the role the owner chose", () => {
    for (const c of caseStudies.filter((c) => !c.live)) {
      expect(c.facts.role, c.slug).toBe("Frontend developer");
    }
  });
});

describe("case study diagrams", () => {
  it("puts the three signature diagrams on the right studies", () => {
    const kinds = Object.fromEntries(
      caseStudies.map((c) => [c.slug, c.diagram?.kind ?? null]),
    );
    expect(kinds).toEqual({
      "pharma-enterprise-portals": "rbac",
      "municipal-bill-payment": null,
      "workflow-portal": null,
      "warehouse-mobile-migration": "migration",
      "healthcare-ecommerce-app": null,
      "support-ticket-system": "lifecycle",
    });
  });

  it("gives every diagram a title, an aria summary and non-empty labels", () => {
    for (const c of caseStudies) {
      if (!c.diagram) continue;
      expect(c.diagram.title.trim(), c.slug).not.toBe("");
      expect(c.diagram.ariaLabel.trim(), c.slug).not.toBe("");
      for (const [key, label] of Object.entries(c.diagram.labels)) {
        expect(label.trim(), `${c.slug}.${key}`).not.toBe("");
      }
    }
  });
});

describe("case study lookup", () => {
  const list = [{ slug: "a" }, { slug: "b" }, { slug: "c" }] as CaseStudy[];

  it("finds by slug and returns undefined for unknown slugs", () => {
    expect(findCaseStudy(list, "b")?.slug).toBe("b");
    expect(findCaseStudy(list, "nope")).toBeUndefined();
    expect(getCaseStudy("nope")).toBeUndefined();
  });

  it("returns previous and next, wrapping at both ends", () => {
    expect(adjacentCaseStudies(list, "a")).toEqual({
      previous: list[2],
      next: list[1],
    });
    expect(adjacentCaseStudies(list, "c")).toEqual({
      previous: list[1],
      next: list[0],
    });
    expect(adjacentCaseStudies(list, "nope")).toBeUndefined();
  });

  it("works on the real list", () => {
    const first = caseStudies[0]!;
    expect(getAdjacent(first.slug)?.previous.slug).toBe(
      caseStudies.at(-1)!.slug,
    );
  });
});

describe("municipal bill payment copy", () => {
  // The owner joined an existing large-scale platform and built features
  // (void, refund); the copy must not claim the apps were built from scratch.
  const study = caseStudies.find((c) => c.slug === "municipal-bill-payment")!;
  const card = homeContent.experience.engagements.find(
    (e) => e.slug === "municipal-bill-payment",
  )!;
  const texts = [JSON.stringify(study), card.summary, ...card.highlights].join(
    "\n",
  );

  it("credits feature work such as void and refund", () => {
    expect(study.role).toMatch(/void/i);
    expect(study.role).toMatch(/refund/i);
    expect(card.highlights.join(" ")).toMatch(/void.*refund/i);
  });

  it("never claims building the apps or the component set", () => {
    expect(texts).not.toMatch(/built (both|two)/i);
    expect(texts).not.toMatch(/developed a reusable/i);
    expect(texts).not.toMatch(/non-technical staff publish/i);
  });

  it("describes Strapi as multilingual content management", () => {
    expect(texts).toMatch(/Strapi[^.]*(languages|multilingual)/i);
  });
});
