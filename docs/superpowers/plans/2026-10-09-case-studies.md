# Case-Study Pages (Phase 4a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Six statically generated case-study pages at `/work/<slug>`, built from typed content on one shared template. They are linked from the home page, have previous/next navigation, return real 404s for unknown slugs, and use CSS cross-page transitions.

**Architecture:**
- **Content:** case studies are typed data in `src/content/en/case-studies.ts`. The home copy moves to `src/content/en/home.ts`, and `src/content/en/index.ts` re-exports both.
- **Route:** `src/app/work/[slug]/page.tsx` prerenders every slug via `generateStaticParams` and renders `CaseStudyArticle` plus `CaseStudyPager`.
- **404s:** Cache Components forbids `dynamicParams = false`, so `src/proxy.ts`, scoped to `/work/:slug`, rewrites unknown slugs to a non-route. That gives real 404s, per the Next docs (`not-found.md`: "A request-time check can run in Proxy").

**Tech Stack:** Next.js 16.4 (Cache Components, Proxy), React 19.3, Tailwind 4, Vitest + RTL, Playwright + axe, LHCI (calibrated, `scripts/lhci.mjs`).

**Spec:** `docs/superpowers/specs/2026-10-09-case-studies-design.md`

**Prototype evidence:** every file below was built and verified in a throwaway worktree before the plan was written.
- **Unit tests:** 100/100 passed.
- **E2E:** 42/42 passed.
- **Calibrated LHCI:** `/` at LCP 2333–2492 ms, `/work/pharma-enterprise-portals` at 2173–2178 ms. Performance 0.98/0.99 and accessibility 1.0 on both.
- **Status codes:** the six slugs return 200; `/work/nope`, `/work/nope/deeper` and `/work` return 404.

## Global Constraints

- **Content:** the case-study copy is spec §5 verbatim. "Frontend developer" is the role on all client work; there are no team sizes, no client names, and no client screenshots. The confidentiality guard must pass.
- **No new client JS and no new dependencies.** No `next/link`; use `<a>` and the existing `TextLink`/`ButtonLink`.
- **Budgets unchanged; never edit `lighthouserc.json` assertions.** The plan only adds a URL.
- **No commits during execution.** The owner reviews at the end (memory: no-auto-commit).
- Branch: `feat/case-studies` (it already holds the spec commit).

## Deviations from the spec (decided while prototyping; recorded in Task 5 docs)

1. **No `dynamicParams = false`:** it isn't available with Cache Components. Proxy gives the real 404 instead.
2. **No `scroll-reveal` on outline sections.** Lighthouse showed the first section sitting at about 30% opacity on load, because a scroll-linked fade never completes until the reader scrolls. These are reading pages, so the sections stay fully visible.
3. **Home logo accessible name.** The phase 2 `aria-label="Naveen Dwarapudi, home"` hid the visible "ND." (Lighthouse `label-content-name-mismatch`, WCAG 2.5.3). It's now visible "ND." plus sr-only " Naveen Dwarapudi, home".
4. **Self-owned screenshot is eager.** On phones it is above the fold, so `Screenshot` gains an `eager` prop.

## Review Focus

1. **Unknown or garbage slugs** (`/work/nope`, `/work/nope/deeper`, `/work`): a real 404 with `noindex`, never a 200 soft-404. Pinned in Task 3 (`work.spec.ts`).
2. **Header nav and "Back to all work" from a case-study page:** they must land on the home page sections. Pinned in Task 3.
3. **Pager at both ends:** previous from the first study and next from the last must wrap, never dead-end. Pinned in Tasks 1 and 3.
4. **Accessibility on content-heavy pages in both themes,** including toggled states and Lighthouse's no-reduced-motion view. Pinned in Task 3 axe and Task 5 LHCI (accessibility must be 1.0).
5. **A client study accidentally getting a screenshot or live link:** pinned in Tasks 1 and 2 and in `work.spec.ts`.

---

## File Structure

| Path | Responsibility |
|---|---|
| `src/content/types.ts` | Adds `CaseStudy`, `CaseStudyUi`, `slug` on `Engagement` and `Project`, and `readCaseStudy` |
| `src/content/en/home.ts` (moved from `en.ts`) | Home copy plus slugs |
| `src/content/en/case-studies.ts` | Six case studies and the template labels |
| `src/content/en/index.ts` | Locale barrel (`@/content/en` keeps working) |
| `src/content/case-studies.ts` | `findCaseStudy`, `adjacentCaseStudies`, `getCaseStudy`, `getAdjacent` |
| `src/components/ui/screenshots.ts` | `ScreenshotKey` → image import map, shared by home and case studies |
| `src/components/ui/screenshot.tsx` | Adds the `eager` prop |
| `src/components/case-study/case-study-article.tsx`, `case-study-pager.tsx` | Template |
| `src/app/work/[slug]/page.tsx` | Route, static params, metadata |
| `src/proxy.ts` | Real 404 for unknown `/work/:slug` |
| `src/app/globals.css` | `@view-transition` under `no-preference` |
| `src/components/sections/experience.tsx`, `projects.tsx`, `src/app/page.tsx` | "Read case study →" links |
| `src/components/site/site-header.tsx` | Logo accessible name |
| `e2e/axe.ts`, `e2e/smoke.spec.ts`, `e2e/work.spec.ts` | Shared axe helper; work-page E2E |
| `lighthouserc.json` | Adds the case-study URL |

---

### Task 1: Case-study content and lookup

**Files:**
- Move: `src/content/en.ts` → `src/content/en/home.ts`
- Create: `src/content/en/index.ts`, `src/content/en/case-studies.ts`, `src/content/case-studies.ts`, `src/content/case-studies.test.ts`
- Modify: `src/content/types.ts` (full replace), `src/content/en/home.ts` (import path, slugs, `readCaseStudy`)

**Interfaces:**
- Produces:
  - `CaseStudy` and `CaseStudyUi` types
  - `Engagement.slug: string` and `Project.slug: string`
  - `HomeContent.readCaseStudy: string`
  - `caseStudies: CaseStudy[]` and `caseStudyUi: CaseStudyUi` (both exported from `@/content/en`)
  - `findCaseStudy(list, slug)`, `adjacentCaseStudies(list, slug): { previous, next } | undefined`, `getCaseStudy(slug)` and `getAdjacent(slug)` (all exported from `@/content/case-studies`)

- [ ] **Step 1: Write the failing test `src/content/case-studies.test.ts`**

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
Expected: FAIL with `Failed to resolve import "./case-studies"`.

- [ ] **Step 3: Move the home content and add the barrel**

```bash
mkdir -p src/content/en
git mv src/content/en.ts src/content/en/home.ts
sed -i '' 's#from "./types"#from "../types"#' src/content/en/home.ts
```

Create `src/content/en/index.ts`:

```ts
export { caseStudies, caseStudyUi } from "./case-studies";
export { homeContent } from "./home";
```

- [ ] **Step 4: Replace `src/content/types.ts`**

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
  /** 3–5 steps. */
  approach: string[];
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

- [ ] **Step 5: Add the slugs and label to `src/content/en/home.ts`**

Insert `slug` as the first field of each engagement, of `projects.independent`, and add `readCaseStudy`. The final file:

```ts
import type { HomeContent } from "../types";

/**
 * English home-page copy. Source of truth for every claim: the resume
 * (src/resume/). Clients are described by domain only (CLAUDE.md,
 * Confidentiality); src/test/confidentiality.test.ts scans this file.
 */
export const homeContent: HomeContent = {
  site: { homeLabel: "Naveen Dwarapudi, home", navLabel: "Sections" },
  nav: [
    { label: "About", href: "/#about" },
    { label: "Experience", href: "/#experience" },
    { label: "Skills", href: "/#skills" },
    { label: "Projects", href: "/#projects" },
    { label: "Contact", href: "/#contact" },
  ],
  hero: {
    label: "React · React Native · Next.js",
    nameLines: ["Bhavani Sankar", "Naveen", "Dwarapudi."],
    role: "React.js Developer | React Native Developer | Full-Stack (MERN) Engineer",
    viewWork: "View work",
    downloadResume: "Download resume",
    portraitAlt: "Portrait of Bhavani Sankar Naveen Dwarapudi",
    badgeEmphasis: "4+ yrs",
    badgeText: "React & React Native",
  },
  metrics: [
    { value: 4, suffix: "+", label: "years in production" },
    { value: 5, label: "client engagements" },
    { value: 30, suffix: "%+", label: "faster component builds" },
    { value: 4, label: "industries" },
  ],
  about: {
    label: "About",
    heading: "Engineer first, interfaces always.",
    body: "I'm a React.js and React Native engineer with 4+ years of shipping production software at Aziro Technologies, across five client engagements in pharmaceuticals, fintech, logistics and healthcare. My work spans enterprise web portals and cross-platform mobile apps: I rebuilt three B2B portals on a modern stack with a two-tier access-control model, led a warehouse app migration from Ionic to React Native, and introduced an AI-assisted component workflow that cut build time by over 30%. I care about clean state architecture, accessible interfaces and releases that ship without rollbacks. Lately I've been extending into full-stack ownership with Node.js, Express and MongoDB, including a ticketing platform I designed, built and deployed on my own.",
    facts: [
      "Andhra Pradesh, India",
      "React & React Native",
      "Now: full-stack MERN",
    ],
    photoAlt: "Bhavani Sankar Naveen Dwarapudi in a dark suit",
  },
  experience: {
    label: "Experience",
    heading: "Five client engagements, one standard.",
    role: "Software Engineer",
    company: "Aziro Technologies Pvt. Ltd.",
    period: "June 2022 – Present",
    companyNote: "AI-native product engineering company · Chennai, India",
    confidentialityNote: "Client work · names withheld under confidentiality",
    engagements: [
      {
        kicker: "Pharma · Enterprise web",
        slug: "pharma-enterprise-portals",
        title: "Pharmaceutical B2B ordering platform",
        summary:
          "Rebuilt three enterprise portals (admin, internal staff and customer) on a new stack to modernise B2B ordering for a distributor network.",
        highlights: [
          "Architected a two-tier RBAC and authentication model (super admin / limited admin) enforced across all three portals.",
          "Owned the Redux Toolkit state architecture for multi-role workflows.",
          "Shipped a JSON-driven multilingual layer: new languages through configuration alone.",
          "Introduced a GitHub Copilot workflow with a shared component library, giving 30%+ faster component builds.",
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
        kicker: "Fintech · Municipal payments",
        slug: "municipal-bill-payment",
        title: "Municipal bill payment platform",
        summary:
          "Built two responsive single-page apps, admin and citizen, giving municipal staff and residents one place to manage and pay bills online.",
        highlights: [
          "Context API-based authentication across both portals.",
          "Integrated Strapi CMS so non-technical staff publish content without engineering.",
          "Supported every QA cycle and production deployment without a rollback.",
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
        kicker: "Enterprise · Internal tools",
        slug: "workflow-portal",
        title: "Workflow management portal",
        summary:
          "Owned an internal workflow portal end to end, from project setup to production deployment.",
        highlights: [
          "Set up protected routing, environment configuration and the deployment pipeline before any feature work.",
          "Implemented RBAC with Google OAuth, so employees sign in with existing company credentials.",
          "Automated previously manual workflow steps through REST integrations.",
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
        kicker: "Logistics · Mobile",
        slug: "warehouse-mobile-migration",
        title: "Warehouse operations apps",
        summary:
          "Led the migration of a global e-commerce company's internal warehouse apps from Ionic to React Native, shipping native-performance Android and iOS builds.",
        highlights: [
          "Integrated QR/barcode scanning into core warehouse workflows.",
          "Memoised high-traffic screens to stay responsive under warehouse-floor usage.",
          "Set up Firebase, CleverTap and New Relic monitoring, plus dev/staging/prod pipelines.",
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
        kicker: "Healthcare · Mobile",
        slug: "healthcare-ecommerce-app",
        title: "Healthcare e-commerce app",
        summary:
          "Built the cross-platform mobile UI for product discovery and ordering, from browse through checkout.",
        highlights: [
          "Integrated catalog, authentication and order APIs against a Ruby on Rails backend.",
          "Built a reusable component set and worked with QA to resolve stability and UX issues before release.",
        ],
        stack: [
          "React Native",
          "JavaScript",
          "Firebase",
          "Redux",
          "Ruby on Rails",
        ],
      },
    ],
  },
  skills: {
    label: "Skills",
    heading: "The toolkit behind the work.",
    groups: [
      {
        name: "Frontend Development",
        items: [
          "React.js",
          "Next.js",
          "React Native",
          "TypeScript",
          "JavaScript (ES6+)",
          "Redux Toolkit",
          "RTK Query",
          "Context API",
          "HTML5",
          "CSS3",
          "Bootstrap",
          "Material-UI (MUI)",
        ],
      },
      {
        name: "Backend & APIs",
        items: [
          "Node.js",
          "Express.js",
          "REST API Design & Integration",
          "JWT Authentication",
        ],
      },
      { name: "Databases", items: ["MongoDB", "MySQL", "PostgreSQL"] },
      { name: "Testing", items: ["Jest", "React Testing Library", "Vitest"] },
      {
        name: "Mobile Development",
        items: [
          "React Native",
          "Android Studio",
          "Xcode",
          "Multi-environment builds (dev/staging/prod)",
        ],
      },
      {
        name: "Cloud & DevOps",
        items: [
          "AWS",
          "CI/CD build pipelines",
          "Git",
          "GitHub",
          "Bitbucket",
          "Azure DevOps (Boards & Repos)",
        ],
      },
      {
        name: "Monitoring & Analytics",
        items: ["Firebase", "CleverTap", "New Relic"],
      },
      { name: "Project Tools", items: ["JIRA", "Postman", "Strapi CMS"] },
      {
        name: "AI-Assisted Development",
        items: [
          "GitHub Copilot",
          "Claude",
          "Component generation & code review",
          "30%+ measured build-time reduction",
        ],
        accent: true,
      },
    ],
  },
  projects: {
    label: "Projects",
    heading: "Built on my own time.",
    independentLabel: "Independent project",
    independent: {
      slug: "support-ticket-system",
      title: "Support Ticket Management System",
      subtitle: "Full-stack MERN application",
      points: [
        "Designed and built a full-stack ticketing platform covering the whole lifecycle: creation, assignment, tracking, escalation and resolution.",
        "JWT-based authentication and role-based authorization across Admin and User tiers.",
        "REST API in Node.js/Express.js, with data modelled in MongoDB with Mongoose.",
        "React.js frontend with Redux Toolkit and RTK Query for state and data fetching.",
        "Frontend deployed on Vercel and backend on Render, as a live, publicly accessible app.",
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
      liveUrl: "https://support-ticket-management-system-beta.vercel.app/",
      image: "support-ticket",
      imageAlt:
        "Support Ticket Management System admin dashboard showing open, pending and unassigned ticket counts above a ticket list",
    },
    sideLabel: "Side projects",
    sideBadge: "Practice project",
    side: [
      {
        title: "Payments Portal",
        summary:
          "A React payments portal with authentication, validated forms and translations, backed by Node.js, Express and MongoDB.",
        stack: [
          "React",
          "TypeScript",
          "Vite",
          "Material-UI",
          "Redux Toolkit",
          "React Hook Form",
          "Node.js",
          "Express.js",
          "MongoDB",
        ],
        liveUrl: "https://naveen-dwarapudi.netlify.app/login",
        image: "payments-portal",
        imageAlt:
          "Payments Portal sign-in page with a language selector and reCAPTCHA",
      },
      {
        title: "Mom Tribute",
        summary:
          "A personal tribute website for my mother, built for Mother's Day.",
        stack: ["HTML", "CSS", "JavaScript"],
        liveUrl: "https://naveen-dwarapudi.github.io/mom-tribute/",
        image: "mom-tribute",
        imageAlt:
          "Mom Tribute website hero: a portrait and the title “For Annapurna, My Whole World”",
      },
    ],
    liveSite: "Live site",
  },
  credentials: {
    label: "Credentials",
    heading: "Certifications & education.",
    degree: {
      title: "B.Tech, Electronics and Communication Engineering",
      school: "Ramachandra College of Engineering, Eluru",
      year: "2019",
    },
    certificationsHeading: "Certifications",
    certifications: [
      {
        issuer: "HackerRank",
        titles: [
          "Frontend Developer (React)",
          "JavaScript (Intermediate)",
          "Node (Basic)",
        ],
      },
      {
        issuer: "Udemy",
        titles: [
          "Full-Stack Web Development with MERN & PERN Stacks",
          "React Testing Library with Jest / Vitest",
          "The Complete React Native + Hooks Course",
        ],
      },
    ],
  },
  contact: {
    label: "Contact",
    heading: "Let's talk.",
    line: "The quickest way to reach me is email.",
    email: "dbsnaveen@gmail.com",
    linkedin: {
      label: "LinkedIn",
      url: "https://www.linkedin.com/in/dbsnaveen/",
    },
    github: { label: "GitHub", url: "https://github.com/Naveen-Dwarapudi" },
    location: "Andhra Pradesh, India",
    copy: {
      idle: "Copy email",
      done: "Copied",
      announced: "Email address copied",
      failed: "Copy failed — the address is dbsnaveen@gmail.com",
    },
  },
  footer: {
    name: "Bhavani Sankar Naveen Dwarapudi",
    builtWith: "Built with Next.js",
    sourceLabel: "Source on GitHub",
    sourceUrl: "https://github.com/Naveen-Dwarapudi/portfolio",
    backToTop: "Back to top",
  },
  newTab: "(opens in a new tab)",
  techStack: "Tech stack",
  readCaseStudy: "Read case study",
};
```

- [ ] **Step 6: Create `src/content/en/case-studies.ts`**

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
      "Rebuilt each portal in React.js, TypeScript and Material-UI on a shared component library.",
      "Enforced one two-tier RBAC model (super admin / limited admin) across all three portals.",
      "Kept shared multi-role state in Redux Toolkit so the portals stayed consistent as usage scaled.",
      "Moved every UI string into JSON language files, so new languages are configuration only.",
      "Integrated REST APIs with the backend team to power live B2B ordering and customer onboarding.",
    ],
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
      "Rebuilt the apps in React Native and TypeScript, with Redux Toolkit and RTK Query.",
      "Integrated QR/barcode scanning into core warehouse workflows.",
      "Applied memoisation across high-traffic screens.",
      "Set up Firebase, CleverTap and New Relic for crash, usage and performance monitoring.",
      "Configured separate dev/staging/production builds and CI/CD pipelines.",
    ],
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
      "REST API in Node.js and Express.js, with data modelled in MongoDB using Mongoose.",
      "JWT-based authentication and role-based authorization across the Admin and User tiers.",
      "React.js and TypeScript frontend, with Redux Toolkit and RTK Query for state and data fetching.",
      "Frontend deployed on Vercel and backend on Render, as a live, public app.",
    ],
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

- [ ] **Step 7: Create `src/content/case-studies.ts`**

```ts
import { caseStudies } from "./en";
import type { CaseStudy } from "./types";

export function findCaseStudy(
  list: readonly CaseStudy[],
  slug: string,
): CaseStudy | undefined {
  return list.find((c) => c.slug === slug);
}

/** Previous and next case study, wrapping at both ends. */
export function adjacentCaseStudies(
  list: readonly CaseStudy[],
  slug: string,
): { previous: CaseStudy; next: CaseStudy } | undefined {
  const i = list.findIndex((c) => c.slug === slug);
  if (i === -1 || list.length < 2) return undefined;
  const previous = list[(i - 1 + list.length) % list.length];
  const next = list[(i + 1) % list.length];
  if (!previous || !next) return undefined;
  return { previous, next };
}

export const getCaseStudy = (slug: string) => findCaseStudy(caseStudies, slug);
export const getAdjacent = (slug: string) =>
  adjacentCaseStudies(caseStudies, slug);
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npx vitest run src/content src/test/confidentiality.test.ts`
Expected: PASS, 16 tests (8 case-study, 6 home content, 2 confidentiality).

Then run `npm run typecheck`.
Expected: errors **only** in `src/components/sections/*`, which don't yet pass `readCaseStudyLabel`. Task 4 fixes these; nothing else should fail.

- [ ] **Step 9: Checkpoint (no commit)**

---

### Task 2: Case-study template

**Files:**
- Create: `src/components/ui/screenshots.ts`, `src/components/case-study/case-study-article.tsx`, `src/components/case-study/case-study-pager.tsx`, `src/components/case-study/case-study.test.tsx`
- Modify: `src/components/ui/screenshot.tsx` (full replace)

**Interfaces:**
- Consumes: `CaseStudy` and `CaseStudyUi` (Task 1); `Chip`, `Container`, `ButtonLink`, `TextLink`, `BrowserFrame` and `InteractiveCard` (existing).
- Produces:
  - `screenshots: Record<ScreenshotKey, StaticImageData>`
  - `Screenshot` gains `eager?: boolean`
  - `CaseStudyArticle({ study, ui, newTabLabel })`
  - `CaseStudyPager({ previous, next, ui })`

- [ ] **Step 1: Write the failing test `src/components/case-study/case-study.test.tsx`**

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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/case-study`
Expected: FAIL with `Failed to resolve import "./case-study-article"`.

- [ ] **Step 3: Implement**

`src/components/ui/screenshot.tsx`:

```tsx
import { getImageProps, type StaticImageData } from "next/image";

/**
 * Optimised AVIF/WebP via getImageProps (server-only, no client JS), with
 * intrinsic width/height so it causes no CLS. Lazy by default; pass `eager`
 * when the image may be the largest element above the fold (LCP).
 */
export function Screenshot({
  src,
  alt,
  sizes,
  eager = false,
  className = "",
}: {
  src: StaticImageData;
  alt: string;
  sizes: string;
  eager?: boolean;
  className?: string;
}) {
  const { props } = getImageProps({
    src,
    alt,
    sizes,
    ...(eager
      ? { loading: "eager" as const, fetchPriority: "high" as const }
      : { loading: "lazy" as const }),
  });
  return (
    // eslint-disable-next-line @next/next/no-img-element -- props come from getImageProps (optimized, server-only, no client JS)
    <img {...props} alt={alt} className={`h-auto w-full ${className}`} />
  );
}
```

`src/components/ui/screenshots.ts`:

```ts
import momTribute from "@/images/mom-tribute.png";
import paymentsPortal from "@/images/payments-portal-app.png";
import supportTicket from "@/images/support-ticket-management-system.png";
import type { StaticImageData } from "next/image";
import type { ScreenshotKey } from "@/content/types";

/** Content refers to screenshots by key; this maps keys to image imports. */
export const screenshots: Record<ScreenshotKey, StaticImageData> = {
  "support-ticket": supportTicket,
  "payments-portal": paymentsPortal,
  "mom-tribute": momTribute,
};
```

`src/components/case-study/case-study-article.tsx`:

```tsx
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
  children,
}: {
  id: string;
  index: number;
  title: string;
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
      <div className="mt-5 max-w-[720px] text-muted">{children}</div>
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
        <Part id="approach" index={4} title={s.approach}>
          <ol className="list-decimal space-y-3 pl-5 marker:font-mono marker:text-accent">
            {study.approach.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
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

`src/components/case-study/case-study-pager.tsx`:

```tsx
import { Container } from "@/components/ui/container";
import { TextLink } from "@/components/ui/text-link";
import type { CaseStudy, CaseStudyUi } from "@/content/types";

export function CaseStudyPager({
  previous,
  next,
  ui,
}: {
  previous: CaseStudy;
  next: CaseStudy;
  ui: CaseStudyUi;
}) {
  return (
    <nav aria-label={ui.pagerLabel} className="border-t border-line">
      <Container className="grid gap-6 py-12 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <a
          href={`/work/${previous.slug}`}
          className="group block rounded-[14px] border border-line p-5 transition-colors hover:border-accent/45"
        >
          <span className="font-mono text-label tracking-[0.1em] text-muted uppercase">
            <span aria-hidden="true">← </span>
            {ui.previous}
          </span>
          <span className="mt-1.5 block font-display text-h3 font-extrabold tracking-[-0.02em]">
            {previous.title}
          </span>
        </a>
        <TextLink href="/#experience" className="justify-self-center text-sm">
          {ui.backToWork}
        </TextLink>
        <a
          href={`/work/${next.slug}`}
          className="group block rounded-[14px] border border-line p-5 text-right transition-colors hover:border-accent/45"
        >
          <span className="font-mono text-label tracking-[0.1em] text-muted uppercase">
            {ui.next}
            <span aria-hidden="true"> →</span>
          </span>
          <span className="mt-1.5 block font-display text-h3 font-extrabold tracking-[-0.02em]">
            {next.title}
          </span>
        </a>
      </Container>
    </nav>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/components/case-study`
Expected: PASS, 6 tests.

- [ ] **Step 5: Checkpoint (no commit)**

---

### Task 3: Route, real 404s, transitions and E2E

**Files:**
- Create: `src/app/work/[slug]/page.tsx`, `src/proxy.ts`, `e2e/axe.ts`, `e2e/work.spec.ts`
- Modify: `src/app/globals.css`, `e2e/smoke.spec.ts` (full replace)

**Interfaces:**
- Consumes: Tasks 1 and 2.
- Produces: `expectNoAxeViolations(page, minContrastNodes)` in `e2e/axe.ts`.

- [ ] **Step 1: Write the failing E2E tests**

`e2e/axe.ts`:

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/**
 * WCAG 2.1 AA scan of the whole page. Reduced motion puts every
 * scroll-reveal in its final, visible state (the caller's colorScheme is
 * kept). axe skips invisible nodes, so `minContrastNodes` guards against a
 * scan that silently checked only part of the page.
 */
export async function expectNoAxeViolations(
  page: Page,
  minContrastNodes: number,
) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(500);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations).toEqual([]);
  const contrastChecked =
    results.passes.find((r) => r.id === "color-contrast")?.nodes.length ?? 0;
  expect(contrastChecked).toBeGreaterThan(minContrastNodes);
}
```

`e2e/smoke.spec.ts` (now uses the shared helper):

```ts
import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

/** The full home page checks ~200 contrast nodes. */
const HOME_MIN_CONTRAST_NODES = 150;

test("home renders server-side content", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Bhavani Sankar Naveen Dwarapudi.",
    }),
  ).toBeVisible();
  await expect(page).toHaveTitle(/^Naveen Dwarapudi/);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`no WCAG 2.1 AA violations with OS ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");
    await expectNoAxeViolations(page, HOME_MIN_CONTRAST_NODES);
  });

  test(`no WCAG 2.1 AA violations when toggled to ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({
      colorScheme: colorScheme === "light" ? "dark" : "light",
    });
    await page.goto("/");
    await page
      .getByRole("button", { name: `Switch to ${colorScheme} theme` })
      .click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      colorScheme,
    );
    await expectNoAxeViolations(page, HOME_MIN_CONTRAST_NODES);
  });
}

for (const width of [320, 375]) {
  test(`no horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto("/");
    await page.waitForTimeout(1500);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test(`the portrait badge is fully on screen at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto("/");
    await page.waitForTimeout(1500);
    const box = await page
      .getByText("React & React Native", { exact: false })
      .first()
      .boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
  });
}
```

`e2e/work.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

/** Case-study pages check 55–68 contrast nodes (measured in phase 4a). */
const CASE_STUDY_MIN_CONTRAST_NODES = 45;

const SLUGS = [
  "pharma-enterprise-portals",
  "municipal-bill-payment",
  "workflow-portal",
  "warehouse-mobile-migration",
  "healthcare-ecommerce-app",
  "support-ticket-system",
];

test("each home-page case-study link opens its page", async ({ page }) => {
  await page.goto("/");
  const links = page.getByRole("link", { name: /^Read case study: / });
  await expect(links).toHaveCount(SLUGS.length);
  const hrefs = await links.evaluateAll((els) =>
    els.map((el) => el.getAttribute("href")),
  );
  expect(hrefs.sort()).toEqual(SLUGS.map((s) => `/work/${s}`).sort());

  await links.first().click();
  await expect(page).toHaveURL(/\/work\/pharma-enterprise-portals$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Pharmaceutical B2B ordering platform",
  );
});

test("next walks through all six case studies and wraps", async ({ page }) => {
  await page.goto(`/work/${SLUGS[0]}`);
  const pager = page.getByRole("navigation", { name: "More case studies" });
  for (const slug of [...SLUGS.slice(1), SLUGS[0]]) {
    await pager.getByRole("link", { name: /^Next/ }).click();
    await expect(page).toHaveURL(new RegExp(`/work/${slug}$`));
  }
});

test("previous wraps from the first study to the last", async ({ page }) => {
  await page.goto(`/work/${SLUGS[0]}`);
  await page
    .getByRole("navigation", { name: "More case studies" })
    .getByRole("link", { name: /^← ?Previous|^Previous/ })
    .click();
  await expect(page).toHaveURL(new RegExp(`/work/${SLUGS.at(-1)}$`));
});

test("back to all work returns to the experience section", async ({ page }) => {
  await page.goto("/work/workflow-portal");
  await page.getByRole("link", { name: "Back to all work" }).click();
  await expect(page).toHaveURL(/\/#experience$/);
  await expect(page.locator("#experience")).toBeInViewport();
});

test("header links work from a case-study page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/work/workflow-portal");
  await page
    .getByRole("navigation", { name: "Sections" })
    .getByRole("link", { name: "Skills" })
    .click();
  await expect(page).toHaveURL(/\/#skills$/);
});

test("unknown case studies return a real 404", async ({ request }) => {
  for (const path of ["/work/nope", "/work/nope/deeper", "/work"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
  for (const slug of SLUGS) {
    expect((await request.get(`/work/${slug}`)).status(), slug).toBe(200);
  }
});

test("each case study has its own title and description", async ({ page }) => {
  await page.goto("/work/municipal-bill-payment");
  await expect(page).toHaveTitle(
    "Municipal bill payment platform | Naveen Dwarapudi",
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /^Two single-page apps/,
  );
});

for (const slug of ["pharma-enterprise-portals", "support-ticket-system"]) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`${slug}: no WCAG 2.1 AA violations (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto(`/work/${slug}`);
      await expectNoAxeViolations(page, CASE_STUDY_MIN_CONTRAST_NODES);
    });
  }
}

test("case studies have no horizontal scroll at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const slug of SLUGS) {
    await page.goto(`/work/${slug}`);
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow, slug).toBeLessThanOrEqual(0);
  }
});

test("client case studies show no screenshots", async ({ page }) => {
  for (const slug of SLUGS.filter((s) => s !== "support-ticket-system")) {
    await page.goto(`/work/${slug}`);
    await expect(page.locator("main img"), slug).toHaveCount(0);
  }
});

for (const target of ["light", "dark"] as const) {
  test(`case study: no WCAG 2.1 AA violations when toggled to ${target}`, async ({
    page,
  }) => {
    await page.emulateMedia({
      colorScheme: target === "light" ? "dark" : "light",
    });
    await page.goto("/work/pharma-enterprise-portals");
    await page
      .getByRole("button", { name: `Switch to ${target} theme` })
      .click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", target);
    await expectNoAxeViolations(page, CASE_STUDY_MIN_CONTRAST_NODES);
  });
}
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run build && npx playwright test e2e/work.spec.ts`
Expected: the build fails on Task 1's typecheck errors in the sections, or, if it builds, every `/work/*` test fails with 404s. Either way the work specs are RED. Task 4 completes the home links; the route alone is enough for most of these tests.

- [ ] **Step 3: Implement the route, Proxy and transitions**

`src/app/work/[slug]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyArticle } from "@/components/case-study/case-study-article";
import { CaseStudyPager } from "@/components/case-study/case-study-pager";
import { getAdjacent, getCaseStudy } from "@/content/case-studies";
import { caseStudies, caseStudyUi, homeContent } from "@/content/en";

/**
 * All case studies are prerendered. Cache Components doesn't allow
 * `dynamicParams = false`, so unknown slugs render on request and 404 via
 * notFound().
 */
export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/work/[slug]">): Promise<Metadata> {
  const study = getCaseStudy((await params).slug);
  if (!study) return {};
  return {
    title: `${study.title} | ${caseStudyUi.titleSuffix}`,
    description: study.summary,
  };
}

export default async function CaseStudyPage({
  params,
}: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  const adjacent = getAdjacent(slug);
  if (!study || !adjacent) notFound();

  return (
    <main id="main" className="flex-1">
      <CaseStudyArticle
        study={study}
        ui={caseStudyUi}
        newTabLabel={homeContent.newTab}
      />
      <CaseStudyPager
        previous={adjacent.previous}
        next={adjacent.next}
        ui={caseStudyUi}
      />
    </main>
  );
}
```

`src/proxy.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { caseStudies } from "@/content/en";

const SLUGS = new Set(caseStudies.map((c) => c.slug));

/**
 * Real 404s for unknown case studies. With Cache Components, unknown slugs
 * would otherwise get the prerendered shell (200) with notFound() streamed in
 * afterwards. Rewriting to a path no route matches renders the not-found page
 * with a 404 status. Scoped to /work/* only.
 */
export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2] ?? "";
  if (SLUGS.has(slug)) return NextResponse.next();
  return NextResponse.rewrite(new URL("/__not-found", request.url));
}

export const config = {
  matcher: "/work/:slug",
};
```

In `src/app/globals.css`, insert this immediately before the line `/* Theme wipe:`:

```css
/* Page-to-page navigation (e.g. home → case study): browser cross-fade,
   zero JS. Unsupported browsers navigate normally. */
@media (prefers-reduced-motion: no-preference) {
  @view-transition {
    navigation: auto;
  }
}
```

- [ ] **Step 4: Checkpoint.** The E2E tests pass after Task 4, which adds the home links and fixes the section props.

---

### Task 4: Home-page links and logo accessible name

**Files:**
- Create: `src/components/site/site-header.test.tsx`
- Modify (full replace): `src/components/sections/experience.tsx`, `src/components/sections/projects.tsx`, `src/components/sections/sections.test.tsx`, `src/app/page.tsx`, `src/components/site/site-header.tsx`

**Interfaces:**
- Consumes: `HomeContent.readCaseStudy`, `Engagement.slug` and `Project.slug` (Task 1); `screenshots` (Task 2).
- Produces:
  - `Experience({ experience, techStackLabel, readCaseStudyLabel })`
  - `Projects({ projects, newTabLabel, techStackLabel, readCaseStudyLabel })`

- [ ] **Step 1: Write the failing tests**

`src/components/site/site-header.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { homeContent as c } from "@/content/en";
import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("keeps the visible logo text in the home link's accessible name (WCAG 2.5.3)", () => {
    render(<SiteHeader site={c.site} nav={c.nav} />);
    const home = screen.getByRole("link", { name: /^ND\./ });
    expect(home).toHaveAttribute("href", "/");
    expect(home).toHaveAccessibleName(
      expect.stringContaining(c.site.homeLabel),
    );
  });
});
```

`src/components/sections/sections.test.tsx`. "Contains no links" becomes "links each engagement to its case study":

```tsx
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
      <Experience
        experience={c.experience}
        techStackLabel={c.techStack}
        readCaseStudyLabel={c.readCaseStudy}
      />,
    );
    expect(
      screen.getByText(c.experience.company, { exact: false }),
    ).toBeInTheDocument();
    const titles = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(titles).toEqual(c.experience.engagements.map((e) => e.title));
  });

  it("links each engagement to its case study", () => {
    render(
      <Experience
        experience={c.experience}
        techStackLabel={c.techStack}
        readCaseStudyLabel={c.readCaseStudy}
      />,
    );
    for (const e of c.experience.engagements) {
      expect(
        screen.getByRole("link", { name: `${c.readCaseStudy}: ${e.title}` }),
      ).toHaveAttribute("href", `/work/${e.slug}`);
    }
  });

  it("states that client names are withheld", () => {
    render(
      <Experience
        experience={c.experience}
        techStackLabel={c.techStack}
        readCaseStudyLabel={c.readCaseStudy}
      />,
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
        readCaseStudyLabel={c.readCaseStudy}
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
        readCaseStudyLabel={c.readCaseStudy}
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
        readCaseStudyLabel={c.readCaseStudy}
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
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/components/site src/components/sections`
Expected: FAIL. The header link's name is "Naveen Dwarapudi, home", which doesn't start with "ND.", and there are no "Read case study" links yet.

- [ ] **Step 3: Implement**

`src/components/site/site-header.tsx`:

```tsx
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Container } from "@/components/ui/container";
import type { HomeContent } from "@/content/types";

export function SiteHeader({
  site,
  nav,
}: {
  site: HomeContent["site"];
  nav: HomeContent["nav"];
}) {
  return (
    <header className="relative z-10">
      <Container className="flex items-center justify-between py-5">
        {/* Visible "ND." stays in the accessible name (WCAG 2.5.3). */}
        <a
          href="/"
          className="font-display text-xl font-extrabold tracking-[-0.04em]"
        >
          ND<span className="text-accent">.</span>
          <span className="sr-only"> {site.homeLabel}</span>
        </a>
        <div className="flex items-center gap-6">
          <nav aria-label={site.navLabel} className="hidden md:block">
            <ul className="flex gap-6 text-sm text-muted">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="transition-colors hover:text-text"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}
```

`src/components/sections/experience.tsx`:

```tsx
import { InteractiveCard } from "@/components/motion/pointer-effects";
import { Chip } from "@/components/ui/chip";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { TextLink } from "@/components/ui/text-link";
import type { HomeContent } from "@/content/types";

export function Experience({
  experience,
  techStackLabel,
  readCaseStudyLabel,
}: {
  experience: HomeContent["experience"];
  techStackLabel: string;
  readCaseStudyLabel: string;
}) {
  return (
    <Section id="experience" index="03" label={experience.label}>
      <Heading
        level="h2"
        id="experience-heading"
        className="scroll-reveal mt-4"
      >
        {experience.heading}
      </Heading>
      <div className="scroll-reveal mt-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="font-display text-h3 font-extrabold tracking-[-0.02em]">
          {experience.role}
          <span className="text-muted"> · </span>
          {experience.company}
        </p>
        <p className="font-mono text-label tracking-[0.08em] text-muted uppercase">
          {experience.period}
        </p>
      </div>
      <p className="scroll-reveal mt-1 text-sm text-muted">
        {experience.companyNote}
      </p>
      <p className="mt-3 font-mono text-label tracking-[0.08em] text-muted uppercase">
        {experience.confidentialityNote}
      </p>

      <ol className="relative mt-10 space-y-6 pl-8 md:pl-12">
        <span
          aria-hidden="true"
          className="timeline-line absolute top-2 bottom-2 left-[7px] w-px bg-gradient-to-b from-accent via-line-strong to-line md:left-[11px]"
        />
        {experience.engagements.map((e, i) => (
          <li
            key={e.title}
            className="scroll-reveal relative"
            style={{ "--i": i } as React.CSSProperties}
          >
            <span
              aria-hidden="true"
              className="absolute top-7 -left-8 size-[15px] rounded-full border-2 border-accent bg-bg md:-left-12 md:size-[23px] md:border-[3px]"
            />
            <InteractiveCard>
              <p className="kicker">{e.kicker}</p>
              <Heading level="h3" className="mt-2.5">
                {e.title}
              </Heading>
              <p className="mt-2 text-muted">{e.summary}</p>
              <ul className="bullets mt-4 space-y-2 text-sm">
                {e.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <ul
                className="mt-5 flex flex-wrap gap-1.5"
                aria-label={techStackLabel}
              >
                {e.stack.map((s) => (
                  <li key={s}>
                    <Chip>{s}</Chip>
                  </li>
                ))}
              </ul>
              <TextLink
                href={`/work/${e.slug}`}
                aria-label={`${readCaseStudyLabel}: ${e.title}`}
                className="mt-5 inline-block text-sm"
              >
                {readCaseStudyLabel}
                <span aria-hidden="true"> →</span>
              </TextLink>
            </InteractiveCard>
          </li>
        ))}
      </ol>
    </Section>
  );
}
```

`src/components/sections/projects.tsx`:

```tsx
import { InteractiveCard } from "@/components/motion/pointer-effects";
import { BrowserFrame } from "@/components/ui/browser-frame";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Heading } from "@/components/ui/heading";
import { Screenshot } from "@/components/ui/screenshot";
import { screenshots } from "@/components/ui/screenshots";
import { Section } from "@/components/ui/section";
import { TextLink } from "@/components/ui/text-link";
import type { HomeContent } from "@/content/types";

export function Projects({
  projects,
  newTabLabel,
  techStackLabel,
  readCaseStudyLabel,
}: {
  projects: HomeContent["projects"];
  newTabLabel: string;
  techStackLabel: string;
  readCaseStudyLabel: string;
}) {
  const p = projects.independent;
  return (
    <Section id="projects" index="05" label={projects.label}>
      <Heading level="h2" id="projects-heading" className="scroll-reveal mt-4">
        {projects.heading}
      </Heading>

      <article className="scroll-reveal mt-10">
        <InteractiveCard>
          <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <BrowserFrame>
              <Screenshot
                src={screenshots[p.image]}
                alt={p.imageAlt}
                sizes="(max-width: 1024px) 100vw, 560px"
              />
            </BrowserFrame>
            <div>
              <p className="kicker">{projects.independentLabel}</p>
              <Heading level="h3" className="mt-2.5">
                {p.title}
              </Heading>
              <p className="mt-1 text-sm text-muted">{p.subtitle}</p>
              <ul className="bullets mt-4 space-y-2 text-sm">
                {p.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <ul
                className="mt-5 flex flex-wrap gap-1.5"
                aria-label={techStackLabel}
              >
                {p.stack.map((s) => (
                  <li key={s}>
                    <Chip>{s}</Chip>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <ButtonLink
                  href={p.liveUrl}
                  arrow="↗"
                  newTabLabel={newTabLabel}
                  aria-label={`${projects.liveSite}: ${p.title} ${newTabLabel}`}
                >
                  {projects.liveSite}
                </ButtonLink>
                <TextLink
                  href={`/work/${p.slug}`}
                  aria-label={`${readCaseStudyLabel}: ${p.title}`}
                  className="text-sm"
                >
                  {readCaseStudyLabel}
                  <span aria-hidden="true"> →</span>
                </TextLink>
              </div>
            </div>
          </div>
        </InteractiveCard>
      </article>

      <h3 className="scroll-reveal mt-14 font-mono text-label tracking-[0.1em] text-muted uppercase">
        {projects.sideLabel}
      </h3>
      <ul className="mt-4 grid gap-4 md:grid-cols-2">
        {projects.side.map((s, i) => (
          <li
            key={s.title}
            className="scroll-reveal"
            style={{ "--i": i } as React.CSSProperties}
          >
            <InteractiveCard className="h-full">
              <BrowserFrame>
                <Screenshot
                  src={screenshots[s.image]}
                  alt={s.imageAlt}
                  sizes="(max-width: 768px) 100vw, 500px"
                />
              </BrowserFrame>
              <p className="mt-5 font-mono text-label tracking-[0.1em] text-muted uppercase">
                {projects.sideBadge}
              </p>
              <h4 className="mt-1.5 font-display text-h3 font-extrabold tracking-[-0.02em]">
                {s.title}
              </h4>
              <p className="mt-2 text-sm text-muted">{s.summary}</p>
              <ul
                className="mt-4 flex flex-wrap gap-1.5"
                aria-label={techStackLabel}
              >
                {s.stack.map((t) => (
                  <li key={t}>
                    <Chip>{t}</Chip>
                  </li>
                ))}
              </ul>
              <TextLink
                href={s.liveUrl}
                newTabLabel={newTabLabel}
                aria-label={`${projects.liveSite}: ${s.title} ${newTabLabel}`}
                className="mt-4 inline-block text-sm"
              >
                {projects.liveSite}
              </TextLink>
            </InteractiveCard>
          </li>
        ))}
      </ul>
    </Section>
  );
}
```

`src/app/page.tsx`:

```tsx
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Credentials } from "@/components/sections/credentials";
import { Experience } from "@/components/sections/experience";
import { Hero } from "@/components/sections/hero";
import { Projects } from "@/components/sections/projects";
import { Skills } from "@/components/sections/skills";
import { homeContent as c } from "@/content/en";

export default function Home() {
  return (
    <main id="main" className="flex-1">
      <Hero hero={c.hero} metrics={c.metrics} />
      <About about={c.about} />
      <Experience
        experience={c.experience}
        techStackLabel={c.techStack}
        readCaseStudyLabel={c.readCaseStudy}
      />
      <Skills skills={c.skills} />
      <Projects
        projects={c.projects}
        newTabLabel={c.newTab}
        techStackLabel={c.techStack}
        readCaseStudyLabel={c.readCaseStudy}
      />
      <Credentials credentials={c.credentials} />
      <Contact contact={c.contact} newTabLabel={c.newTab} />
    </main>
  );
}
```

- [ ] **Step 4: Verify everything**

```bash
npm run format && npm run format:check && npm run lint && npm run typecheck && npm run test
npm run build && npx playwright test
```

Expected:
- **Unit tests:** 100 passed.
- **E2E:** 42 passed.
- **Build:** six `/work/<slug>` paths prerendered, plus `ƒ Proxy (Middleware)`.

- [ ] **Step 5: Checkpoint (no commit)**

---

### Task 5: Lighthouse and docs

**Files:**
- Modify: `lighthouserc.json` (adds the URL only), `CLAUDE.md`, `docs/superpowers/specs/2026-10-09-case-studies-design.md`

- [ ] **Step 1: Add the case-study URL to `lighthouserc.json`**

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run start -- --port 3200",
      "startServerReadyPattern": "Ready",
      "url": [
        "http://localhost:3200/",
        "http://localhost:3200/work/pharma-enterprise-portals"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.02 }],
        "resource-summary:script:size": ["error", { "maxNumericValue": 153600 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

- [ ] **Step 2: Run calibrated LHCI**

```bash
npm run build
CHROME_PATH="$(ls -d ~/Library/Caches/ms-playwright/chromium-*/chrome-mac*/*.app/Contents/MacOS/* | head -1)" \
  npm run lhci -- --upload.target=filesystem --upload.outputDir=.lighthouseci/reports
```

Expected: exit 0.
- **`/`:** LCP ≤ 2500 ms (prototype: 2333–2492).
- **`/work/pharma-enterprise-portals`:** LCP about 2175 ms.
- **Accessibility:** 1.0 on both URLs; if lower, list the failing audits.
- **Budgets:** don't touch them.

- [ ] **Step 3: Update the docs**

Append these rows to the spec's §6 decisions table:

```markdown
| 404s for unknown slugs | `src/proxy.ts` rewrite, scoped to `/work/:slug` | `dynamicParams = false` is unavailable with Cache Components; without Proxy, unknown slugs got a 200 soft-404 |
| Outline sections | no `scroll-reveal` | a scroll-linked fade left the first section at ~30% opacity until the reader scrolled (Lighthouse colour-contrast) |
| Logo link name | visible "ND." + sr-only label | the phase 2 `aria-label` hid the visible text (WCAG 2.5.3) |
| Self-owned screenshot | `Screenshot eager` | above the fold on phones (LCP) |
```

In `CLAUDE.md`, add under `## Conventions`:

```markdown
- Case studies: typed data in `src/content/en/case-studies.ts` (`CaseStudy`), one template (`src/components/case-study/`), route `src/app/work/[slug]`. `src/proxy.ts` returns real 404s for unknown slugs (Cache Components forbids `dynamicParams = false`); keep its slug set in sync by importing `caseStudies`, never a hard-coded list.
- Don't put scroll-linked reveals on reading content that can be on screen at load: it stays partly transparent until the reader scrolls.
- Links with visible text keep that text in their accessible name (WCAG 2.5.3): add context with sr-only text, or start `aria-label` with the visible text.
```

- [ ] **Step 4: Final verification, then stop for the owner's review**

```bash
npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build && npx playwright test
```

Expected: everything passes. Leave everything uncommitted.
