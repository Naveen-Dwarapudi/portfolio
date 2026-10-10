# Scroll-Assembled Case-Study Diagrams (Phase 4b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three inline-SVG diagrams that assemble step by step as the reader scrolls, in the Approach section of the pharma, warehouse and Support Ticket case studies. They use CSS scroll timelines only and never hide content.

**Architecture:**
- **Content:** `CaseStudy` gains an optional typed `diagram`, a discriminated union by `kind` whose labels are enforced by `tsc`. On those three studies, `approach` holds the diagram's steps.
- **Components:** `ScrollDiagram` (a sticky stage with the step list) plus one server component per SVG, selected by an exhaustive `Diagram` switch.
- **CSS:** all animation lives in `globals.css` behind `@supports (animation-timeline: view())` + `prefers-reduced-motion: no-preference` + `min-width: 768px`. Outside those conditions the diagram is static and complete.

**Tech Stack:** Next.js 16.4, React 19.3, Tailwind 4 + plain CSS scroll-driven animations, Vitest + RTL, Playwright + axe, calibrated LHCI.

**Spec:** `docs/superpowers/specs/2026-10-10-case-study-diagrams-design.md`

**Prototype evidence:** every file below was built and verified in a throwaway worktree before the plan was written.
- **Unit tests:** 109/109 passed.
- **E2E:** 53/53 passed.
- **Calibrated LHCI:** `/` at LCP 2403–2413 ms; `/work/pharma-enterprise-portals` (now with a diagram) at 2171–2172 ms. Accessibility 1.0 on both.
- **Visual checks:** screenshots in both themes, on desktop (early and assembled states) and on a phone.

## Global Constraints

- **Zero client JavaScript** for the diagrams.
- **Copy and labels:** spec §3 verbatim. Domain-only, resume-backed, no client or system names; the confidentiality guard must pass.
- **Content is never gated:** with no scroll-timeline support, reduced motion, or a width under 768px, every part is visible.
- **Colours:** existing tokens only. No new assets, no new dependencies.
- **Budgets unchanged.** Never edit `lighthouserc.json` assertions.
- **No commits during execution.** The owner reviews at the end.
- Branch: `feat/case-study-diagrams` (it already holds the spec commit).

## Deviations from the demo (found while prototyping)

1. **Step text is never faded below contrast.** The demo dimmed upcoming steps to 28% opacity, which fails AA (the same class of issue as 4a's scroll fade). Upcoming steps now animate their colour from `--muted` (7.6:1 dark, 5.9:1 light) to `--text`.
2. **Phones keep labels readable.** At 390px a 640-unit SVG shrinks its 11–13px labels to about 6px. Below 768px the SVG keeps a 560px minimum width and the canvas scrolls sideways *inside itself*; the page never overflows. Because the canvas scrolls, it is focusable (`tabIndex=0`, `role="group"`, `aria-label` = the diagram title), per axe `scrollable-region-focusable`.
3. **The client-screenshot test now checks `<img>`, not `role="img"`.** The diagram SVG is legitimately `role="img"`; the rule being protected is "no client screenshots".

## Review Focus

1. **Firefox, or any browser without `animation-timeline`:** the diagram must be fully visible and static, with no sticky gap. The `@supports` gate covers it, and e2e checks the reduced-motion equivalent (Task 4). Reviewer: confirm nothing outside `@supports` hides a part.
2. **Step text contrast mid-scroll:** muted, never faded. Pinned by axe in Task 4 and LHCI accessibility 1.0.
3. **Phone widths:** a readable diagram with no page overflow, and a keyboard-scrollable canvas. Pinned in Task 4 and the Task 2 unit test.
4. **Another kind added to `CaseStudyDiagram` without an SVG:** the exhaustive `never` in `diagram.tsx` must fail `tsc`. Reviewer check.
5. **Step count versus step classes:** a diagram must not reference `dg-s5` when its study has 4 steps (that part would stay hidden until a timeline range that lights no step). Pinned by the Task 2 unit test.

---

### Task 1: Diagram content model and copy

**Files:**
- Modify: `src/content/types.ts` (full replace), `src/content/en/case-studies.ts` (full replace), `src/content/case-studies.test.ts` (full replace)

**Interfaces:**
- Produces:
  - `RbacDiagram`, `MigrationDiagram`, `LifecycleDiagram` and `CaseStudyDiagram` types
  - `CaseStudy.diagram?: CaseStudyDiagram`
  - On the three diagram studies, `approach` holds the spec §3 steps

- [ ] **Step 1: Write the failing test.** Replace `src/content/case-studies.test.ts` (it adds the "case study diagrams" block):

```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/content/case-studies.test.ts`
Expected: FAIL. The kinds map shows `null` for all six slugs.

- [ ] **Step 3: Replace `src/content/types.ts`**

```ts
/**
 * Shape of all home-page copy. Every locale module (en now; hi and te in
 * phase 5) must satisfy this type, so a missing translation fails `tsc`.
 */
export type ExternalUrl = `https://${string}`;

/** Screenshots live in src/images/; components map these keys to imports. */
export type ScreenshotKey =
  "support-ticket" | "payments-portal" | "mom-tribute";

/** Root-relative so the header works from any route (e.g. /work/* in phase 4). */
export type NavItem = { label: string; href: `/#${string}` };

export type Metric = { value: number; suffix?: string; label: string };

export type Engagement = {
  /** Case study at /work/{slug}. */
  slug: string;
  kicker: string;
  title: string;
  summary: string;
  highlights: string[];
  stack: string[];
};

export type SkillGroup = { name: string; items: string[]; accent?: boolean };

export type Project = {
  /** Case study at /work/{slug}. */
  slug: string;
  title: string;
  subtitle: string;
  points: string[];
  stack: string[];
  liveUrl: ExternalUrl;
  image: ScreenshotKey;
  imageAlt: string;
};

export type SideProject = {
  title: string;
  summary: string;
  stack: string[];
  liveUrl: ExternalUrl;
  image: ScreenshotKey;
  imageAlt: string;
};

export type HomeContent = {
  site: { homeLabel: string; navLabel: string };
  nav: NavItem[];
  hero: {
    label: string;
    nameLines: [string, string, string];
    role: string;
    viewWork: string;
    downloadResume: string;
    portraitAlt: string;
    badgeEmphasis: string;
    badgeText: string;
  };
  metrics: Metric[];
  about: {
    label: string;
    heading: string;
    body: string;
    facts: string[];
    photoAlt: string;
  };
  experience: {
    label: string;
    heading: string;
    role: string;
    company: string;
    period: string;
    companyNote: string;
    confidentialityNote: string;
    engagements: Engagement[];
  };
  skills: { label: string; heading: string; groups: SkillGroup[] };
  projects: {
    label: string;
    heading: string;
    independentLabel: string;
    independent: Project;
    sideLabel: string;
    sideBadge: string;
    side: SideProject[];
    liveSite: string;
  };
  credentials: {
    label: string;
    heading: string;
    degree: { title: string; school: string; year: string };
    certificationsHeading: string;
    certifications: { issuer: string; titles: string[] }[];
  };
  contact: {
    label: string;
    heading: string;
    line: string;
    email: string;
    linkedin: { label: string; url: ExternalUrl };
    github: { label: string; url: ExternalUrl };
    location: string;
    copy: { idle: string; done: string; announced: string; failed: string };
  };
  footer: {
    name: string;
    builtWith: string;
    sourceLabel: string;
    sourceUrl: ExternalUrl;
    backToTop: string;
  };
  newTab: string;
  techStack: string;
  readCaseStudy: string;
};

/** Scroll-assembled diagram on a case study's Approach (spec 2026-10-10). */
type DiagramBase = {
  /** Shown above the steps, under the Approach heading. */
  title: string;
  /** Summary for the SVG's role="img". */
  ariaLabel: string;
};

export type RbacDiagram = DiagramBase & {
  kind: "rbac";
  labels: {
    who: string;
    how: string;
    where: string;
    superAdmin: string;
    limitedAdmin: string;
    staff: string;
    customer: string;
    adminPortal: string;
    staffPortal: string;
    customerPortal: string;
    model: string;
    modelNote: string;
    tierAll: string;
    tierSubset: string;
    blocked: string;
  };
};

export type MigrationDiagram = DiagramBase & {
  kind: "migration";
  labels: {
    before: string;
    after: string;
    shell: string;
    webview: string;
    webCode: string;
    webUi: string;
    plugins: string;
    rn: string;
    rnState: string;
    nativeUi: string;
    platforms: string;
    scanning: string;
    scanningNote: string;
    monitoring: string;
    monitoringNote: string;
    dev: string;
    staging: string;
    prod: string;
  };
};

export type LifecycleDiagram = DiagramBase & {
  kind: "lifecycle";
  labels: {
    auth: string;
    authNote: string;
    lifecycle: string;
    created: string;
    assigned: string;
    inProgress: string;
    tracked: string;
    escalated: string;
    resolved: string;
  };
};

export type CaseStudyDiagram =
  RbacDiagram | MigrationDiagram | LifecycleDiagram;

export type CaseStudy = {
  slug: string;
  kicker: string;
  title: string;
  /** One line; also the page's meta description. */
  summary: string;
  facts: { role: string; platform: "Web" | "Mobile" | "Web & API" };
  context: string;
  role: string;
  problem: string;
  /** 3–5 steps. With a diagram, these are the diagram's steps (dg-s1…dg-s5). */
  approach: string[];
  /** Scroll-assembled diagram; replaces the plain Approach list. */
  diagram?: CaseStudyDiagram;
  /** 2–4 decisions, each with its trade-off. */
  decisions: { decision: string; tradeoff: string }[];
  /** Resume-backed outcomes only. */
  impact: string[];
  stack: string[];
  /** Self-owned projects only: live site and real screenshot. */
  live?: { url: ExternalUrl; image: ScreenshotKey; imageAlt: string };
};

/** Labels for the case-study template. */
export type CaseStudyUi = {
  sections: {
    context: string;
    role: string;
    problem: string;
    approach: string;
    decisions: string;
    impact: string;
    stack: string;
  };
  roleLabel: string;
  platformLabel: string;
  decisionLabel: string;
  tradeoffLabel: string;
  liveSite: string;
  previous: string;
  next: string;
  backToWork: string;
  pagerLabel: string;
  titleSuffix: string;
};
```

- [ ] **Step 4: Replace `src/content/en/case-studies.ts`**

```ts
import type { CaseStudy, CaseStudyUi } from "../types";

/**
 * Case studies (spec 2026-10-09-case-studies-design.md §5). Facts trace to the
 * resume; every trade-off is owner-approved reasoning. Clients are described
 * by domain only (CLAUDE.md, Confidentiality). Array order = pager order.
 */
export const caseStudies: CaseStudy[] = [
  {
    slug: "pharma-enterprise-portals",
    kicker: "Pharma · Enterprise web",
    title: "Pharmaceutical B2B ordering platform",
    summary:
      "Rebuilt three enterprise portals on a modern stack with one two-tier access-control model.",
    facts: { role: "Frontend developer", platform: "Web" },
    context:
      "A pharmaceutical company ran B2B ordering for its distributor network across three ageing portals: admin, internal staff and customer. The engagement rebuilt all three on a new technology stack, redesigning the UI and expanding functionality.",
    role: "As a frontend developer, I designed the RBAC and authentication model, owned the Redux Toolkit state architecture for multi-role workflows, shipped the multilingual layer, introduced the AI-assisted component workflow, and integrated REST APIs with the Node.js/Express.js backend team.",
    problem:
      "Three portals serving different audiences had to share one platform without leaking data between roles. The UI also had to be redesigned and new functionality shipped, on schedule.",
    approach: [
      "Three portals serve three audiences: admins, internal staff and customers.",
      "One authentication and RBAC model sits in front of all three.",
      "Two admin tiers: super admin gets everything, limited admin a restricted set.",
      "Cross-role access is blocked: nobody reaches a portal their role doesn't allow.",
    ],
    diagram: {
      kind: "rbac",
      title: "One access model, three portals",
      ariaLabel:
        "Diagram: super admins, limited admins, internal staff and customers pass through one authentication and two-tier RBAC model to their own portal; cross-role access is blocked.",
      labels: {
        who: "WHO",
        how: "HOW",
        where: "WHERE",
        superAdmin: "Super admin",
        limitedAdmin: "Limited admin",
        staff: "Internal staff",
        customer: "Customer",
        adminPortal: "Admin portal",
        staffPortal: "Staff portal",
        customerPortal: "Customer portal",
        model: "Auth + RBAC",
        modelNote: "ONE MODEL",
        tierAll: "Super admin: all",
        tierSubset: "Limited: subset",
        blocked: "CROSS-ROLE ACCESS BLOCKED",
      },
    },
    decisions: [
      {
        decision: "One two-tier RBAC model for all three portals.",
        tradeoff:
          "A single model is simpler to reason about and audit than per-portal rules, but every new permission has to be designed against both tiers up front.",
      },
      {
        decision: "Redux Toolkit for multi-role state.",
        tradeoff:
          "More structure than Context, in exchange for predictable shared state and debugging tools as the workflows grew.",
      },
      {
        decision: "A JSON-driven multilingual layer.",
        tradeoff:
          "New languages need no code changes, but every string has to go through the translation layer from day one.",
      },
      {
        decision: "GitHub Copilot paired with a shared component library.",
        tradeoff:
          "Reusable components build 30%+ faster, but generated code still needs review against the library's conventions.",
      },
    ],
    impact: [
      "30%+ faster reusable-component builds, the largest efficiency gain on the project.",
      "The full three-portal platform delivered on schedule across every sprint and QA cycle.",
      "Zero missed production releases.",
    ],
    stack: [
      "React.js",
      "TypeScript",
      "Material-UI",
      "Redux Toolkit",
      "Node.js",
      "Express.js",
      "AWS",
      "MySQL",
    ],
  },
  {
    slug: "municipal-bill-payment",
    kicker: "Fintech · Municipal payments",
    title: "Municipal bill payment platform",
    summary:
      "Two single-page apps giving municipal staff and residents one place to manage and pay bills online.",
    facts: { role: "Frontend developer", platform: "Web" },
    context:
      "A payments platform for municipalities, with an admin portal for municipal staff and a citizen portal for residents paying their bills online.",
    role: "As a frontend developer, I built both single-page apps, their authentication and a shared component set; integrated Strapi CMS; managed source control across Bitbucket and Azure DevOps Repos; and tracked sprints in JIRA and Azure DevOps Boards.",
    problem:
      "Residents needed a simple way to pay bills. Staff needed to manage them, and to publish content updates without waiting on engineers.",
    approach: [
      "Built two responsive React.js and TypeScript single-page apps with Material-UI.",
      "Implemented authentication with the Context API across both portals.",
      "Developed a reusable, modular component set shared by both portals.",
      "Integrated Strapi CMS so non-technical staff publish content directly.",
    ],
    decisions: [
      {
        decision: "Context API for authentication state.",
        tradeoff:
          "Lighter than Redux for the narrow state two portals share, at the cost of Redux's devtools and middleware if that state grows.",
      },
      {
        decision: "Strapi CMS for content.",
        tradeoff:
          "Staff publish without engineering, but there is a CMS to run and keep in step with the frontend.",
      },
      {
        decision: "One component set for both portals.",
        tradeoff:
          "New screens build faster and look consistent, but a change to a shared component has to be checked in both apps.",
      },
    ],
    impact: [
      "Every QA cycle and production deployment supported without a rollback incident.",
      "Non-technical staff publish content directly, removing engineering from the content-update loop.",
    ],
    stack: [
      "React.js",
      "TypeScript",
      "Material-UI",
      "Context API",
      "Node.js",
      "MySQL",
      "Strapi CMS",
      "Azure DevOps",
    ],
  },
  {
    slug: "workflow-portal",
    kicker: "Enterprise · Internal tools",
    title: "Workflow management portal",
    summary:
      "An internal workflow portal owned end to end, from an empty repository to production.",
    facts: { role: "Frontend developer", platform: "Web" },
    context:
      "An enterprise workflow management portal for internal users, replacing workflow steps that were still tracked manually.",
    role: "As a frontend developer, I owned the portal end to end, from initial setup through production deployment.",
    problem:
      "Automate manual workflow steps in an app employees could sign in to with their existing company accounts, built from scratch.",
    approach: [
      "Set up the foundations first: protected routing, environment configuration and the deployment pipeline.",
      "Implemented RBAC with Google OAuth.",
      "Integrated REST APIs to automate steps that had been tracked by hand.",
      "Built the UI in React.js, TypeScript and Material-UI, with Redux Toolkit and RTK Query against a Java/MySQL backend.",
    ],
    decisions: [
      {
        decision: "Foundations before features.",
        tradeoff:
          "The first visible feature arrived later, but every feature after it shipped onto working routing, configuration and deployment.",
      },
      {
        decision: "Google OAuth for sign-in.",
        tradeoff:
          "No separate credentials to manage, but access is tied to the company's Google identity.",
      },
      {
        decision: "RTK Query for API data.",
        tradeoff:
          "Caching and request state are handled for you, but it's another abstraction to learn on top of Redux Toolkit.",
      },
    ],
    impact: [
      "Previously manual workflow steps automated.",
      "Employees sign in with existing company credentials.",
      "The portal shipped from setup to production under one owner.",
    ],
    stack: [
      "React.js",
      "TypeScript",
      "Material-UI",
      "Redux Toolkit",
      "RTK Query",
      "Java",
      "MySQL",
    ],
  },
  {
    slug: "warehouse-mobile-migration",
    kicker: "Logistics · Mobile",
    title: "Warehouse operations apps",
    summary:
      "Led the migration of a global e-commerce company's warehouse apps from Ionic to React Native.",
    facts: { role: "Frontend developer", platform: "Mobile" },
    context:
      "A global e-commerce company's internal warehouse applications ran on a hybrid Ionic stack.",
    role: "As a frontend developer, I led the Ionic-to-React-Native migration, owning the Android and iOS rebuild end to end.",
    problem:
      "Replace the legacy hybrid apps with native-performance Android and iOS builds, and keep warehouse-floor workflows fast and observable.",
    approach: [
      "Before: the UI ran as web code inside a WebView, wrapped in a native shell.",
      "After: the UI is rebuilt as real native components with React Native.",
      "QR/barcode scanning is wired into the core warehouse workflows.",
      "Crash, usage and performance monitoring, plus separate dev, staging and prod builds.",
    ],
    diagram: {
      kind: "migration",
      title: "From a WebView to native",
      ariaLabel:
        "Diagram: before, an Ionic app renders web UI in a WebView inside a native shell; after, React Native renders native Android and iOS components, with scanning, monitoring and three build environments.",
      labels: {
        before: "BEFORE · IONIC",
        after: "AFTER · REACT NATIVE",
        shell: "NATIVE SHELL",
        webview: "WEBVIEW",
        webCode: "HTML · CSS · JS",
        webUi: "WEB UI",
        plugins: "PLUGINS FOR DEVICE APIs",
        rn: "React Native · TypeScript",
        rnState: "REDUX TOOLKIT · RTK QUERY",
        nativeUi: "Native UI components",
        platforms: "ANDROID · iOS",
        scanning: "QR / barcode",
        scanningNote: "SCANNING",
        monitoring: "Monitoring",
        monitoringNote: "CRASH · PERF",
        dev: "DEV",
        staging: "STAGING",
        prod: "PROD",
      },
    },
    decisions: [
      {
        decision: "Migrate to React Native rather than keep the hybrid stack.",
        tradeoff:
          "Native performance on both platforms, at the cost of rebuilding the UI layer.",
      },
      {
        decision:
          "Memoise high-traffic screens (React.memo, useMemo, useCallback).",
        tradeoff:
          "Fewer re-renders under warehouse-floor load, but memoised code must keep its dependencies correct.",
      },
      {
        decision: "Separate environment builds and pipelines.",
        tradeoff:
          "Releases need no manual environment switching, but there's more pipeline configuration to maintain.",
      },
    ],
    impact: [
      "Native-performance Android and iOS builds replaced the legacy hybrid stack.",
      "Manual data lookups replaced by a single scan.",
      "Real-time crash, usage and performance monitoring.",
    ],
    stack: [
      "React Native",
      "TypeScript",
      "Redux Toolkit",
      "RTK Query",
      "Firebase",
      "Node.js",
    ],
  },
  {
    slug: "healthcare-ecommerce-app",
    kicker: "Healthcare · Mobile",
    title: "Healthcare e-commerce app",
    summary:
      "The cross-platform mobile UI for product discovery and ordering, from browse through checkout.",
    facts: { role: "Frontend developer", platform: "Mobile" },
    context:
      "A healthcare e-commerce mobile app for discovering and ordering products.",
    role: "As a frontend developer, I built the cross-platform mobile UI and its integration with the backend APIs.",
    problem:
      "Deliver browse-to-checkout on Android and iOS from one codebase, against an existing Ruby on Rails backend.",
    approach: [
      "Built the mobile UI in React Native with Redux and Firebase.",
      "Integrated REST APIs for the product catalog, authentication and order management.",
      "Built a reusable UI component set.",
      "Worked directly with QA to resolve stability and UX issues before release.",
    ],
    decisions: [
      {
        decision: "React Native for both platforms.",
        tradeoff:
          "One codebase for Android and iOS, but platform-specific issues still need native knowledge.",
      },
      {
        decision: "A reusable component set.",
        tradeoff:
          "Consistent screens and faster fixes, in exchange for designing the components up front.",
      },
    ],
    impact: [
      "The browse-to-checkout flow shipped on both platforms.",
      "Stability and UX issues resolved with QA before release.",
    ],
    stack: ["React Native", "JavaScript", "Firebase", "Redux", "Ruby on Rails"],
  },
  {
    slug: "support-ticket-system",
    kicker: "Independent · Full-stack",
    title: "Support Ticket Management System",
    summary:
      "A full-stack ticketing platform I designed, built and deployed on my own.",
    facts: { role: "Sole developer", platform: "Web & API" },
    context:
      "An independent project to demonstrate full-stack ownership beyond frontend-only delivery.",
    role: "Sole developer: data model, REST API, frontend and deployment.",
    problem:
      "Model a complete support workflow, with tickets moving through creation, assignment, tracking, escalation and resolution, and different powers for admins and users.",
    approach: [
      "Every request passes JWT authentication and role checks (Admin / User).",
      "A ticket is created, then assigned.",
      "It's tracked while work is in progress.",
      "If it needs more attention, it's escalated.",
      "Finally it's resolved, closing the lifecycle.",
    ],
    diagram: {
      kind: "lifecycle",
      title: "A ticket's life, end to end",
      ariaLabel:
        "Diagram: behind JWT authentication and Admin/User role checks, a ticket moves from created to assigned to in progress, may be escalated, and ends resolved.",
      labels: {
        auth: "JWT authentication · role checks",
        authNote: "ADMIN · USER TIERS",
        lifecycle: "LIFECYCLE",
        created: "Created",
        assigned: "Assigned",
        inProgress: "In progress",
        tracked: "TRACKED",
        escalated: "Escalated",
        resolved: "Resolved",
      },
    },
    decisions: [
      {
        decision: "JWT authentication.",
        tradeoff:
          "A stateless API that any host can serve, but revoking a token needs extra handling.",
      },
      {
        decision: "MongoDB with Mongoose.",
        tradeoff:
          "Flexible ticket documents with schema validation in code, but reporting across users needs more care than with SQL joins.",
      },
      {
        decision: "Separate hosting for frontend and backend.",
        tradeoff:
          "Each side deploys independently on a free tier, at the cost of cross-origin configuration.",
      },
    ],
    impact: [
      "A live, publicly accessible app covering the full ticket lifecycle.",
      "Full-stack ownership from data model to deployment.",
    ],
    stack: [
      "React.js",
      "TypeScript",
      "Redux Toolkit",
      "RTK Query",
      "Node.js",
      "Express.js",
      "MongoDB",
    ],
    live: {
      url: "https://support-ticket-management-system-beta.vercel.app/",
      image: "support-ticket",
      imageAlt:
        "Support Ticket Management System admin dashboard showing open, pending and unassigned ticket counts above a ticket list",
    },
  },
];

export const caseStudyUi: CaseStudyUi = {
  sections: {
    context: "Context",
    role: "My role",
    problem: "The problem",
    approach: "Approach",
    decisions: "Key decisions",
    impact: "Impact",
    stack: "Stack",
  },
  roleLabel: "Role",
  platformLabel: "Platform",
  decisionLabel: "Decision",
  tradeoffLabel: "Trade-off",
  liveSite: "Live site",
  previous: "Previous",
  next: "Next",
  backToWork: "Back to all work",
  pagerLabel: "More case studies",
  titleSuffix: "Naveen Dwarapudi",
};
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run src/content src/test/confidentiality.test.ts`
Expected: PASS, 18 tests (10 case-study, 6 home, 2 confidentiality).

- [ ] **Step 6: Checkpoint (no commit)**

---

### Task 2: Diagram components and CSS

**Files:**
- Create: `src/components/diagrams/{rbac-diagram,migration-diagram,lifecycle-diagram,diagram,scroll-diagram}.tsx`, `src/components/diagrams/diagrams.test.tsx`
- Modify: `src/app/globals.css` (adds the diagram block)

**Interfaces:**
- Consumes: `CaseStudyDiagram` and the per-kind types (Task 1).
- Produces:
  - `Diagram({ diagram })`
  - `ScrollDiagram({ diagram, steps })`
  - CSS classes:
    - stage and layout: `dg-stage-track`, `dg-stage`, `dg-steps`, `dg-step`, `dg-canvas`, `dg-svg`
    - SVG shapes: `dg-box`, `dg-hot`, `dg-t`, `dg-s`, `dg-lane`, `dg-wire`, `dg-wire-hot`, `dg-dash`, `dg-x`, `dg-arrow-hot`
    - animation: `dg-part`, `dg-draw`, and the step ranges `dg-s1`…`dg-s5`

- [ ] **Step 1: Write the failing test `src/components/diagrams/diagrams.test.tsx`**

```tsx
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/diagrams`
Expected: FAIL with `Failed to resolve import "./diagram"`.

- [ ] **Step 3: Implement the components**

`src/components/diagrams/rbac-diagram.tsx`:

```tsx
import type { RbacDiagram as RbacDiagramData } from "@/content/types";

/** Two-tier RBAC across three portals. Parts carry dg-s1…dg-s4 step classes. */
export function RbacDiagram({ diagram }: { diagram: RbacDiagramData }) {
  const l = diagram.labels;
  return (
    <svg
      viewBox="0 0 640 400"
      role="img"
      aria-label={diagram.ariaLabel}
      className="dg-svg"
    >
      <g className="dg-part dg-s1">
        <text className="dg-s" x="85" y="22" textAnchor="middle">
          {l.who}
        </text>
        <rect
          className="dg-box"
          x="16"
          y="38"
          width="138"
          height="44"
          rx="10"
        />
        <text className="dg-t" x="85" y="65" textAnchor="middle">
          {l.superAdmin}
        </text>
        <rect
          className="dg-box"
          x="16"
          y="110"
          width="138"
          height="44"
          rx="10"
        />
        <text className="dg-t" x="85" y="137" textAnchor="middle">
          {l.limitedAdmin}
        </text>
        <rect
          className="dg-box"
          x="16"
          y="214"
          width="138"
          height="44"
          rx="10"
        />
        <text className="dg-t" x="85" y="241" textAnchor="middle">
          {l.staff}
        </text>
        <rect
          className="dg-box"
          x="16"
          y="314"
          width="138"
          height="44"
          rx="10"
        />
        <text className="dg-t" x="85" y="341" textAnchor="middle">
          {l.customer}
        </text>
      </g>
      <g className="dg-part dg-s1">
        <text className="dg-s" x="551" y="22" textAnchor="middle">
          {l.where}
        </text>
        <rect
          className="dg-box"
          x="478"
          y="74"
          width="146"
          height="54"
          rx="10"
        />
        <text className="dg-t" x="551" y="106" textAnchor="middle">
          {l.adminPortal}
        </text>
        <rect
          className="dg-box"
          x="478"
          y="210"
          width="146"
          height="54"
          rx="10"
        />
        <text className="dg-t" x="551" y="242" textAnchor="middle">
          {l.staffPortal}
        </text>
        <rect
          className="dg-box"
          x="478"
          y="310"
          width="146"
          height="54"
          rx="10"
        />
        <text className="dg-t" x="551" y="342" textAnchor="middle">
          {l.customerPortal}
        </text>
      </g>
      <g className="dg-part dg-s2">
        <text className="dg-s" x="319" y="22" textAnchor="middle">
          {l.how}
        </text>
        <rect
          className="dg-box dg-hot"
          x="236"
          y="150"
          width="166"
          height="96"
          rx="14"
        />
        <text className="dg-t" x="319" y="190" textAnchor="middle">
          {l.model}
        </text>
        <text className="dg-s" x="319" y="212" textAnchor="middle">
          {l.modelNote}
        </text>
      </g>
      <path
        className="dg-wire dg-draw dg-s2"
        pathLength={1}
        d="M154 236 C 200 236, 200 214, 236 214"
      />
      <path
        className="dg-wire dg-draw dg-s2"
        pathLength={1}
        d="M154 336 C 210 336, 210 236, 236 236"
      />
      <path
        className="dg-wire dg-draw dg-s2"
        pathLength={1}
        d="M402 220 C 440 220, 440 237, 478 237"
      />
      <path
        className="dg-wire dg-draw dg-s2"
        pathLength={1}
        d="M402 236 C 450 236, 450 337, 478 337"
      />
      <path
        className="dg-wire dg-wire-hot dg-draw dg-s3"
        pathLength={1}
        d="M154 60 C 200 60, 200 168, 236 168"
      />
      <path
        className="dg-wire dg-wire-hot dg-draw dg-s3"
        pathLength={1}
        d="M154 132 C 196 132, 200 186, 236 186"
      />
      <path
        className="dg-wire dg-wire-hot dg-draw dg-s3"
        pathLength={1}
        d="M402 172 C 440 172, 440 101, 478 101"
      />
      <g className="dg-part dg-s3">
        <rect
          className="dg-box dg-hot"
          x="252"
          y="70"
          width="134"
          height="56"
          rx="10"
        />
        <text className="dg-t" x="319" y="93" textAnchor="middle">
          {l.tierAll}
        </text>
        <text className="dg-t" x="319" y="113" textAnchor="middle">
          {l.tierSubset}
        </text>
      </g>
      <g className="dg-part dg-s4">
        <path
          className="dg-wire dg-dash"
          d="M154 352 C 300 392, 420 392, 478 128"
        />
        <line className="dg-x" x1="354" y1="333" x2="376" y2="355" />
        <line className="dg-x" x1="376" y1="333" x2="354" y2="355" />
        <text className="dg-s" x="300" y="392" textAnchor="middle">
          {l.blocked}
        </text>
      </g>
    </svg>
  );
}
```

`src/components/diagrams/migration-diagram.tsx`:

```tsx
import type { MigrationDiagram as MigrationDiagramData } from "@/content/types";

/** Ionic (WebView) → React Native (native UI). Parts carry dg-s1…dg-s4. */
export function MigrationDiagram({
  diagram,
}: {
  diagram: MigrationDiagramData;
}) {
  const l = diagram.labels;
  return (
    <svg
      viewBox="0 0 640 400"
      role="img"
      aria-label={diagram.ariaLabel}
      className="dg-svg"
    >
      <g className="dg-part dg-s1">
        <text className="dg-s" x="150" y="26" textAnchor="middle">
          {l.before}
        </text>
        <rect
          className="dg-box"
          x="24"
          y="44"
          width="252"
          height="300"
          rx="16"
        />
        <text className="dg-s" x="40" y="68">
          {l.shell}
        </text>
        <rect
          className="dg-box"
          x="44"
          y="84"
          width="212"
          height="170"
          rx="12"
        />
        <text className="dg-s" x="60" y="106">
          {l.webview}
        </text>
        <rect
          className="dg-box"
          x="64"
          y="120"
          width="172"
          height="112"
          rx="10"
        />
        <text className="dg-t" x="150" y="170" textAnchor="middle">
          {l.webCode}
        </text>
        <text className="dg-s" x="150" y="192" textAnchor="middle">
          {l.webUi}
        </text>
        <text className="dg-s" x="150" y="290" textAnchor="middle">
          {l.plugins}
        </text>
      </g>
      <path
        className="dg-wire dg-wire-hot dg-draw dg-s2"
        pathLength={1}
        d="M288 194 L 352 194"
      />
      <g className="dg-part dg-s2">
        <polygon className="dg-arrow-hot" points="352,186 366,194 352,202" />
        <text className="dg-s" x="497" y="26" textAnchor="middle">
          {l.after}
        </text>
        <rect
          className="dg-box dg-hot"
          x="378"
          y="44"
          width="238"
          height="70"
          rx="12"
        />
        <text className="dg-t" x="497" y="74" textAnchor="middle">
          {l.rn}
        </text>
        <text className="dg-s" x="497" y="96" textAnchor="middle">
          {l.rnState}
        </text>
        <rect
          className="dg-box dg-hot"
          x="378"
          y="150"
          width="238"
          height="70"
          rx="12"
        />
        <text className="dg-t" x="497" y="180" textAnchor="middle">
          {l.nativeUi}
        </text>
        <text className="dg-s" x="497" y="202" textAnchor="middle">
          {l.platforms}
        </text>
      </g>
      <path
        className="dg-wire dg-wire-hot dg-draw dg-s2"
        pathLength={1}
        d="M497 114 L 497 150"
      />
      <g className="dg-part dg-s3">
        <rect
          className="dg-box"
          x="378"
          y="250"
          width="112"
          height="56"
          rx="10"
        />
        <text className="dg-t" x="434" y="275" textAnchor="middle">
          {l.scanning}
        </text>
        <text className="dg-s" x="434" y="294" textAnchor="middle">
          {l.scanningNote}
        </text>
      </g>
      <path
        className="dg-wire dg-draw dg-s3"
        pathLength={1}
        d="M434 250 L 434 220"
      />
      <g className="dg-part dg-s4">
        <rect
          className="dg-box"
          x="504"
          y="250"
          width="112"
          height="56"
          rx="10"
        />
        <text className="dg-t" x="560" y="275" textAnchor="middle">
          {l.monitoring}
        </text>
        <text className="dg-s" x="560" y="294" textAnchor="middle">
          {l.monitoringNote}
        </text>
        <rect
          className="dg-box"
          x="378"
          y="322"
          width="72"
          height="30"
          rx="8"
        />
        <text className="dg-s" x="414" y="342" textAnchor="middle">
          {l.dev}
        </text>
        <rect
          className="dg-box"
          x="461"
          y="322"
          width="72"
          height="30"
          rx="8"
        />
        <text className="dg-s" x="497" y="342" textAnchor="middle">
          {l.staging}
        </text>
        <rect
          className="dg-box"
          x="544"
          y="322"
          width="72"
          height="30"
          rx="8"
        />
        <text className="dg-s" x="580" y="342" textAnchor="middle">
          {l.prod}
        </text>
      </g>
      <path
        className="dg-wire dg-draw dg-s4"
        pathLength={1}
        d="M560 250 L 560 220"
      />
    </svg>
  );
}
```

`src/components/diagrams/lifecycle-diagram.tsx`:

```tsx
import type { LifecycleDiagram as LifecycleDiagramData } from "@/content/types";

/** Ticket lifecycle behind JWT + role checks. Parts carry dg-s1…dg-s5. */
export function LifecycleDiagram({
  diagram,
}: {
  diagram: LifecycleDiagramData;
}) {
  const l = diagram.labels;
  return (
    <svg
      viewBox="0 0 640 400"
      role="img"
      aria-label={diagram.ariaLabel}
      className="dg-svg"
    >
      <g className="dg-part dg-s1">
        <rect
          className="dg-box dg-hot"
          x="24"
          y="30"
          width="592"
          height="52"
          rx="12"
        />
        <text className="dg-t" x="320" y="54" textAnchor="middle">
          {l.auth}
        </text>
        <text className="dg-s" x="320" y="72" textAnchor="middle">
          {l.authNote}
        </text>
        <rect
          className="dg-lane"
          x="24"
          y="104"
          width="592"
          height="270"
          rx="14"
        />
        <text className="dg-s" x="44" y="134">
          {l.lifecycle}
        </text>
      </g>
      <g className="dg-part dg-s2">
        <rect
          className="dg-box"
          x="44"
          y="164"
          width="104"
          height="56"
          rx="28"
        />
        <text className="dg-t" x="96" y="197" textAnchor="middle">
          {l.created}
        </text>
        <rect
          className="dg-box"
          x="190"
          y="164"
          width="104"
          height="56"
          rx="28"
        />
        <text className="dg-t" x="242" y="197" textAnchor="middle">
          {l.assigned}
        </text>
      </g>
      <path
        className="dg-wire dg-draw dg-s2"
        pathLength={1}
        d="M148 192 L 190 192"
      />
      <g className="dg-part dg-s3">
        <text className="dg-s" x="394" y="152" textAnchor="middle">
          {l.tracked}
        </text>
        <rect
          className="dg-box dg-hot"
          x="336"
          y="164"
          width="116"
          height="56"
          rx="28"
        />
        <text className="dg-t" x="394" y="197" textAnchor="middle">
          {l.inProgress}
        </text>
      </g>
      <path
        className="dg-wire dg-draw dg-s3"
        pathLength={1}
        d="M294 192 L 336 192"
      />
      <g className="dg-part dg-s4">
        <rect
          className="dg-box"
          x="336"
          y="290"
          width="116"
          height="56"
          rx="28"
        />
        <text className="dg-t" x="394" y="323" textAnchor="middle">
          {l.escalated}
        </text>
        <path
          className="dg-wire dg-dash"
          d="M372 220 C 360 252, 360 262, 372 290"
        />
        <path
          className="dg-wire dg-dash"
          d="M416 290 C 428 262, 428 252, 416 220"
        />
      </g>
      <g className="dg-part dg-s5">
        <rect
          className="dg-box dg-hot"
          x="494"
          y="164"
          width="104"
          height="56"
          rx="28"
        />
        <text className="dg-t" x="546" y="197" textAnchor="middle">
          {l.resolved}
        </text>
      </g>
      <path
        className="dg-wire dg-wire-hot dg-draw dg-s5"
        pathLength={1}
        d="M452 192 L 494 192"
      />
    </svg>
  );
}
```

`src/components/diagrams/diagram.tsx`:

```tsx
import type { CaseStudyDiagram } from "@/content/types";
import { LifecycleDiagram } from "./lifecycle-diagram";
import { MigrationDiagram } from "./migration-diagram";
import { RbacDiagram } from "./rbac-diagram";

/** Renders the SVG for a diagram kind. Exhaustive: a new kind fails tsc here. */
export function Diagram({ diagram }: { diagram: CaseStudyDiagram }) {
  switch (diagram.kind) {
    case "rbac":
      return <RbacDiagram diagram={diagram} />;
    case "migration":
      return <MigrationDiagram diagram={diagram} />;
    case "lifecycle":
      return <LifecycleDiagram diagram={diagram} />;
    default: {
      const unreachable: never = diagram;
      return unreachable;
    }
  }
}
```

`src/components/diagrams/scroll-diagram.tsx`:

```tsx
import type { CaseStudyDiagram } from "@/content/types";
import { Diagram } from "./diagram";

/**
 * Sticky stage whose steps light up while the SVG assembles, driven only by
 * CSS scroll timelines (globals.css, "Case-study diagrams"). Without support,
 * with reduced motion, or below md, everything is simply visible.
 */
export function ScrollDiagram({
  diagram,
  steps,
}: {
  diagram: CaseStudyDiagram;
  steps: string[];
}) {
  return (
    <div className="dg-stage-track">
      <div className="dg-stage">
        <div>
          <h3 className="font-display text-h3 font-extrabold tracking-[-0.02em] text-text">
            {diagram.title}
          </h3>
          <ol className="dg-steps mt-5">
            {steps.map((step, i) => (
              <li key={step} className={`dg-step dg-s${i + 1}`}>
                {step}
              </li>
            ))}
          </ol>
        </div>
        {/* Focusable: on phones the canvas scrolls sideways (keyboard access). */}
        <div
          className="dg-canvas"
          tabIndex={0}
          role="group"
          aria-label={diagram.title}
        >
          <Diagram diagram={diagram} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add the CSS.** In `src/app/globals.css`, insert this immediately before the line `/* Theme wipe:`:

```css
/* ---------- Case-study diagrams (spec 2026-10-10) ----------
   Static and complete by default. Only with scroll-timeline support, motion
   allowed and a wide screen does the stage stick and assemble on scroll. */
.dg-svg {
  display: block;
  width: 100%;
  height: auto;
}

.dg-box {
  fill: var(--surface-2);
  stroke: var(--line-strong);
  stroke-width: 1.2;
}

.dg-hot {
  fill: color-mix(in srgb, var(--accent) 14%, var(--surface-2));
  stroke: var(--accent);
}

.dg-t {
  fill: var(--text);
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
}

.dg-s {
  fill: var(--muted);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
}

.dg-lane {
  fill: none;
  stroke: var(--line);
  stroke-dasharray: 4 4;
}

.dg-wire {
  fill: none;
  stroke: var(--line-strong);
  stroke-width: 1.6;
}

.dg-wire-hot {
  stroke: var(--accent);
  stroke-width: 2;
}

.dg-dash {
  stroke-dasharray: 6 5;
}

.dg-x {
  stroke: var(--accent);
  stroke-width: 2.5;
  stroke-linecap: round;
}

.dg-arrow-hot {
  fill: var(--accent);
}

.dg-canvas {
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  padding: 12px;
}

/* Phones: keep labels readable (≥ ~11px) by holding a minimum width; the
   canvas scrolls sideways inside itself, never the page. */
.dg-canvas .dg-svg {
  min-width: 560px;
}

@media (min-width: 768px) {
  .dg-canvas .dg-svg {
    min-width: 0;
  }
}

.dg-stage {
  display: grid;
  gap: 2rem;
}

.dg-steps {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: dg;
}

.dg-step {
  display: grid;
  grid-template-columns: 1.75rem 1fr;
  gap: 0.625rem;
  color: var(--text);
  counter-increment: dg;
}

.dg-step::before {
  content: counter(dg, decimal-leading-zero);
  padding-top: 0.2em;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--accent);
}

@media (min-width: 768px) {
  .dg-stage {
    grid-template-columns: minmax(15rem, 0.9fr) 1.6fr;
    align-items: center;
  }
}

@keyframes dg-appear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}

@keyframes dg-draw {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}

/* Upcoming steps are muted (still AA), never faded below contrast. */
@keyframes dg-lit {
  from {
    color: var(--muted);
  }
}

@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) and (min-width: 768px) {
    .dg-stage-track {
      view-timeline-name: --diagram;
      height: 340vh;
    }

    .dg-stage {
      position: sticky;
      top: 6rem;
      min-height: calc(100vh - 8rem);
    }

    .dg-part {
      animation: dg-appear linear both;
      animation-timeline: --diagram;
      transform-box: fill-box;
    }

    .dg-draw {
      stroke-dasharray: 1;
      animation: dg-draw linear both;
      animation-timeline: --diagram;
    }

    .dg-step {
      animation: dg-lit linear both;
      animation-timeline: --diagram;
    }

    .dg-s1 {
      animation-range: contain 0% contain 12%;
    }
    .dg-s2 {
      animation-range: contain 18% contain 32%;
    }
    .dg-s3 {
      animation-range: contain 38% contain 52%;
    }
    .dg-s4 {
      animation-range: contain 58% contain 72%;
    }
    .dg-s5 {
      animation-range: contain 76% contain 90%;
    }
  }
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run src/components/diagrams`
Expected: PASS, 6 tests.

- [ ] **Step 6: Checkpoint (no commit)**

---

### Task 3: Render the stage in the case-study template

**Files:**
- Modify: `src/components/case-study/case-study-article.tsx` (full replace), `src/components/case-study/case-study.test.tsx` (full replace)

**Interfaces:**
- Consumes: `ScrollDiagram` (Task 2); `study.diagram` (Task 1).
- Produces: `Part` gains `wide?: boolean`. Approach renders `<ScrollDiagram>` when `study.diagram` is set, and the numbered list otherwise.

- [ ] **Step 1: Write the failing test.** Replace `src/components/case-study/case-study.test.tsx`:

```tsx
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
    const { container } = renderStudy();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders the diagram stage in Approach only for studies with a diagram", () => {
    const { container, unmount } = renderStudy(client);
    expect(container.querySelector("#approach .dg-stage")).not.toBeNull();
    expect(container.querySelector("#approach ol.list-decimal")).toBeNull();
    unmount();
    const plain = caseStudies.find((c) => !c.diagram)!;
    const { container: plainContainer } = renderStudy(plain);
    expect(plainContainer.querySelector("#approach .dg-stage")).toBeNull();
    expect(
      plainContainer.querySelector("#approach ol.list-decimal"),
    ).not.toBeNull();
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/case-study`
Expected: FAIL. "renders the diagram stage in Approach only for studies with a diagram" finds no `.dg-stage`.

- [ ] **Step 3: Replace `src/components/case-study/case-study-article.tsx`**

```tsx
import { ScrollDiagram } from "@/components/diagrams/scroll-diagram";
import { InteractiveCard } from "@/components/motion/pointer-effects";
import { BrowserFrame } from "@/components/ui/browser-frame";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Container } from "@/components/ui/container";
import { Screenshot } from "@/components/ui/screenshot";
import { screenshots } from "@/components/ui/screenshots";
import type { CaseStudy, CaseStudyUi } from "@/content/types";
import type { ReactNode } from "react";

function Part({
  id,
  index,
  title,
  wide = false,
  children,
}: {
  id: string;
  index: number;
  title: string;
  /** Full container width (diagrams) instead of the reading measure. */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="border-t border-line py-12"
    >
      <h2
        id={`${id}-heading`}
        className="font-display text-h3 font-extrabold tracking-[-0.02em]"
      >
        <span
          aria-hidden="true"
          className="mr-3 font-mono text-label text-accent"
        >
          {String(index).padStart(2, "0")}
        </span>
        {title}
      </h2>
      <div className={`mt-5 text-muted ${wide ? "" : "max-w-[720px]"}`}>
        {children}
      </div>
    </section>
  );
}

export function CaseStudyArticle({
  study,
  ui,
  newTabLabel,
}: {
  study: CaseStudy;
  ui: CaseStudyUi;
  newTabLabel: string;
}) {
  const s = ui.sections;
  return (
    <article>
      <header className="pt-10 pb-12">
        <Container>
          <p className="kicker fade-up">{study.kicker}</p>
          <h1 className="fade-up mt-4 font-display text-[clamp(2.25rem,6vw,4rem)] leading-[1] font-extrabold tracking-[-0.04em]">
            {study.title}
          </h1>
          <p className="fade-up mt-5 max-w-[680px] text-lg text-muted">
            {study.summary}
          </p>
          <ul className="fade-up mt-6 flex flex-wrap gap-2">
            <li>
              <Chip>{`${ui.roleLabel}: ${study.facts.role}`}</Chip>
            </li>
            <li>
              <Chip>{`${ui.platformLabel}: ${study.facts.platform}`}</Chip>
            </li>
          </ul>
        </Container>
      </header>

      {study.live ? (
        <Container className="pb-12">
          <BrowserFrame>
            <Screenshot
              src={screenshots[study.live.image]}
              alt={study.live.imageAlt}
              sizes="(max-width: 1040px) 100vw, 992px"
              eager
            />
          </BrowserFrame>
          <div className="mt-6">
            <ButtonLink
              href={study.live.url}
              arrow="↗"
              newTabLabel={newTabLabel}
              aria-label={`${ui.liveSite}: ${study.title} ${newTabLabel}`}
            >
              {ui.liveSite}
            </ButtonLink>
          </div>
        </Container>
      ) : null}

      <Container>
        <Part id="context" index={1} title={s.context}>
          <p>{study.context}</p>
        </Part>
        <Part id="role" index={2} title={s.role}>
          <p>{study.role}</p>
        </Part>
        <Part id="problem" index={3} title={s.problem}>
          <p>{study.problem}</p>
        </Part>
        <Part id="approach" index={4} title={s.approach} wide={!!study.diagram}>
          {study.diagram ? (
            <ScrollDiagram diagram={study.diagram} steps={study.approach} />
          ) : (
            <ol className="list-decimal space-y-3 pl-5 marker:font-mono marker:text-accent">
              {study.approach.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
        </Part>
        <Part id="decisions" index={5} title={s.decisions}>
          <ul className="grid gap-4 md:grid-cols-2">
            {study.decisions.map((d) => (
              <li key={d.decision}>
                <InteractiveCard className="h-full">
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="kicker">{ui.decisionLabel}</dt>
                      <dd className="mt-1 text-base text-text">{d.decision}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-label tracking-[0.1em] text-muted uppercase">
                        {ui.tradeoffLabel}
                      </dt>
                      <dd className="mt-1">{d.tradeoff}</dd>
                    </div>
                  </dl>
                </InteractiveCard>
              </li>
            ))}
          </ul>
        </Part>
        <Part id="impact" index={6} title={s.impact}>
          <ul className="bullets space-y-2 text-text">
            {study.impact.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Part>
        <Part id="stack" index={7} title={s.stack}>
          <ul className="flex flex-wrap gap-1.5">
            {study.stack.map((t) => (
              <li key={t}>
                <Chip>{t}</Chip>
              </li>
            ))}
          </ul>
        </Part>
      </Container>
    </article>
  );
}
```

- [ ] **Step 4: Verify**

```bash
npm run format && npm run lint && npm run typecheck && npm run test
```

Expected: 109 unit tests pass, and lint and typecheck are clean.

- [ ] **Step 5: Checkpoint (no commit)**

---

### Task 4: E2E, Lighthouse and docs

**Files:**
- Create: `e2e/diagrams.spec.ts`
- Modify: `CLAUDE.md`, `docs/superpowers/specs/2026-10-10-case-study-diagrams-design.md` (decisions log)

- [ ] **Step 1: Write `e2e/diagrams.spec.ts`**

```ts
import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

const DIAGRAM_PAGES = [
  "pharma-enterprise-portals",
  "warehouse-mobile-migration",
  "support-ticket-system",
];
/** Diagram pages check more contrast nodes than plain case studies (≥ 55). */
const MIN_CONTRAST_NODES = 45;

async function partOpacities(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll(".dg-part")].map((el) =>
      Number(getComputedStyle(el).opacity),
    ),
  );
}

async function scrollIntoTrack(page: Page, fraction: number) {
  await page.evaluate((f) => {
    const track = document.querySelector(".dg-stage-track")!;
    const top = track.getBoundingClientRect().top + scrollY;
    const travel = track.getBoundingClientRect().height - innerHeight;
    scrollTo(0, top + travel * f);
  }, fraction);
  await page.waitForTimeout(400);
}

test("desktop: the diagram assembles as the reader scrolls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto("/work/pharma-enterprise-portals");
  const stage = page.locator(".dg-stage");

  await scrollIntoTrack(page, 0.02);
  await expect(stage).toHaveCSS("position", "sticky");
  const early = await partOpacities(page);
  expect(early.at(-1)).toBeLessThan(0.2);

  await scrollIntoTrack(page, 0.98);
  const late = await partOpacities(page);
  expect(late.every((o) => o === 1)).toBe(true);
});

test("reduced motion: the finished diagram shows immediately and nothing sticks", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto("/work/pharma-enterprise-portals");
  await expect(page.locator(".dg-stage")).not.toHaveCSS("position", "sticky");
  expect((await partOpacities(page)).every((o) => o === 1)).toBe(true);
});

test("phones: static, complete diagram that scrolls inside its frame, not the page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const slug of DIAGRAM_PAGES) {
    await page.goto(`/work/${slug}`);
    await expect(page.locator(".dg-stage"), slug).not.toHaveCSS(
      "position",
      "sticky",
    );
    expect(
      (await partOpacities(page)).every((o) => o === 1),
      slug,
    ).toBe(true);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow, slug).toBeLessThanOrEqual(0);
  }
});

test("each diagram page shows its diagram as a labelled image", async ({
  page,
}) => {
  for (const slug of DIAGRAM_PAGES) {
    await page.goto(`/work/${slug}`);
    await expect(page.locator("#approach svg[role='img']"), slug).toHaveCount(
      1,
    );
    await expect(
      page.locator("#approach svg[role='img']"),
      slug,
    ).toHaveAttribute("aria-label", /^Diagram: /);
  }
});

for (const slug of DIAGRAM_PAGES) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`${slug}: no WCAG 2.1 AA violations with the diagram (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(`/work/${slug}`);
      await expectNoAxeViolations(page, MIN_CONTRAST_NODES);
    });
  }
}
```

- [ ] **Step 2: Run the full E2E suite**

```bash
npm run build && npx playwright test
```

Expected: 53 passed (the 43 existing plus 10 new).

- [ ] **Step 3: Run calibrated Lighthouse**

```bash
CHROME_PATH="$(ls -d ~/Library/Caches/ms-playwright/chromium-*/chrome-mac*/*.app/Contents/MacOS/* | head -1)" \
  npm run lhci -- --upload.target=filesystem --upload.outputDir=.lighthouseci/reports
```

Expected: exit 0. `/work/pharma-enterprise-portals` has LCP about 2170 ms, and accessibility is 1.0 on both URLs. **Don't touch the budgets.**

- [ ] **Step 4: Update the docs**

Append these rows to the spec's §6 decisions table:

```markdown
| Step emphasis | colour `--muted` → `--text`, not opacity | an opacity fade failed AA contrast mid-scroll (the demo used 28%) |
| Phone legibility | SVG min-width 560px; canvas scrolls inside itself, focusable | at 390px the labels shrank to ~6px |
```

In `CLAUDE.md`, under `## Conventions`, add:

```markdown
- Diagrams: typed `diagram` on a `CaseStudy` (kind-specific labels), SVGs in `src/components/diagrams/`, animation only in `globals.css` (`dg-*`). Parts use `dg-part`/`dg-draw` plus `dg-sN`, where N ≤ the study's step count. Never dim text with opacity in scroll animations; animate the colour between AA-safe tokens.
```

- [ ] **Step 5: Final verification, then stop for the owner's review**

```bash
npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build && npx playwright test
```

Expected: everything passes. Leave everything uncommitted.
