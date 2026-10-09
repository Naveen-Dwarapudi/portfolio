# Design: Case-Study Pages (Phase 4a)

**Date:** 2026-10-09
**Status:** Draft — awaiting owner review
**Parent spec:** `2026-09-19-nextjs-portfolio-design.md` (§4 routes, §5 case studies, §11 phase 4)
**Builds on:** `2026-10-09-design-system-design.md`, `2026-10-09-home-sections-design.md`
**Branch:** `feat/case-studies`

---

## 1. Purpose and scope

Phase 4 is split in two:

- **4a (this spec):** the `/work/<slug>` route, the shared case-study template, six
  case studies, links from the home page, and cross-page transitions.
- **4b (separate spec):** the three scroll-assembled diagrams from parent §5 (two-tier
  RBAC, Ionic → React Native, ticket lifecycle). 4a pages fill in without them; 4b
  adds them to the Approach section of three pages.

### Success criteria

1. Six statically generated pages under `/work/<slug>`. An unknown slug returns 404.
2. Every page follows the fixed outline (parent §5): Context → My role → The problem →
   Approach → Key decisions (2–4, each with a trade-off) → Impact → Stack. A missing
   part fails `tsc` and the tests.
3. Every claim traces to the resume. Trade-offs are reasoning the owner must be able to
   defend in an interview, and the owner approves each one in §5.
4. No client, client product or system, or internal role names. No team sizes. Client
   pages have no screenshots. The confidentiality guard passes.
5. Every home-page experience card and the Support Ticket card links to its case study.
6. WCAG 2.1 AA in both themes. Content is server-rendered, and the page transitions
   honour reduced motion.
7. Budgets unchanged. LHCI also measures one case-study page.

### Out of scope

- The diagrams (4b).
- A `/work` index page: "Back to all work" goes to `/#experience` (YAGNI).
- Translations (phase 5), the command palette (phase 6), OG images (phase 8).

---

## 2. Routing and data

| Concern | Decision |
|---|---|
| Route | `src/app/work/[slug]/page.tsx` with `generateStaticParams()` over all slugs. Unknown slugs get a real 404 from `src/proxy.ts`, since `dynamicParams = false` is unavailable with Cache Components (see §6). |
| Content | `src/content/en/case-studies.ts` exports `caseStudies: CaseStudy[]`, typed by `src/content/types.ts`. The array order is the pager order. |
| Lookup | `getCaseStudy(slug)` and `getAdjacent(slug)` (previous/next, wrapping) live in `src/content/case-studies.ts`, which is pure and unit-tested. |
| Metadata | `generateMetadata()` sets the title to `"{title} \| Naveen Dwarapudi"` and the description to the case-study summary. |
| Home links | Each `Engagement` gains a `slug`. The experience cards and the Support Ticket card render a "Read case study →" `TextLink` to `/work/{slug}`. The card body itself stays non-interactive, so there are no nested interactive elements. |
| Transitions | CSS `@view-transition { navigation: auto; }` gives a cross-document cross-fade with zero JS. It is disabled under `prefers-reduced-motion: reduce`. Unsupported browsers navigate normally. |

`content/en.ts` is reorganised into `content/en/home.ts` and
`content/en/case-studies.ts`, with `content/en/index.ts` re-exporting both, so each
locale file stays readable. Phase 5 mirrors this per locale.

### `CaseStudy` type

```ts
type CaseStudy = {
  slug: string;              // e.g. "pharma-enterprise-portals"
  kicker: string;            // "Pharma · Enterprise web"
  title: string;
  summary: string;           // one line, also the meta description
  facts: { role: string; platform: "Web" | "Mobile" | "Web & API" };
  context: string;
  role: string;              // paragraph: what I owned
  problem: string;
  approach: string[];        // 3–5 short paragraphs / steps
  decisions: { decision: string; tradeoff: string }[]; // 2–4
  impact: string[];          // resume-backed outcomes only
  stack: string[];
  live?: { url: ExternalUrl; image: ScreenshotKey; imageAlt: string }; // self-owned only
};
```

---

## 3. Page template

1. **Header:** `kicker`, h1 `title`, `summary`, fact chips (`Role: …`, `Platform: …`).
2. **Outline sections:** numbered mono labels `01`–`07`, each with an h2. Approach is a
   numbered list. Key decisions render as cards, each with a "Decision" line and a
   "Trade-off" line. Impact is a bullet list. Stack is a row of chips.
3. **Self-owned project only** (`live`): the screenshot in `BrowserFrame` plus a "Live
   site" button, placed after the header.
4. **Pager:** "← Previous" / "Next →" (wrapping) plus "Back to all work" (`/#experience`).
5. **Motion:** `scroll-reveal` on sections and `InteractiveCard` on decision cards. No new
   client JS.

---

## 4. Testing

- **Content:** six case studies with unique slugs. Each has 2–4 decisions, a non-empty
  string in every outline field, and at least one impact item. Only the self-owned
  study has `live`. Every engagement `slug` resolves to a case study.
- **Lookup:** `getCaseStudy` returns `undefined` for unknown slugs. `getAdjacent` wraps
  at both ends.
- **Template:** one h1, seven h2s in outline order, decision cards with both lines, the
  pager links, no screenshot on client studies.
- **E2E:**
  - each home card link opens its page;
  - previous/next walks all six pages and wraps;
  - `/work/unknown` returns 404;
  - axe passes on two case-study pages in four theme states;
  - no horizontal scroll at 320 px;
  - each page has the correct `<title>`.
- **LHCI:** add `/work/pharma-enterprise-portals` to `collect.url`, with the same
  assertions.

---

## 5. Draft content (owner to review every line)

**Role** is "Frontend developer" on every client engagement (owner). There are no
team sizes. Facts come from the resume; **trade-offs marked ✱ are reasoning, not resume
facts**, and the owner must confirm each one is defensible.

### 5.1 `pharma-enterprise-portals`: Pharmaceutical B2B ordering platform
*Pharma · Enterprise web · Platform: Web*

- **Summary:** Rebuilt three enterprise portals on a modern stack with one two-tier
  access-control model.
- **Context:** A pharmaceutical company ran B2B ordering for its distributor network
  across three ageing portals: admin, internal staff and customer. The engagement
  rebuilt all three on a new technology stack, redesigning the UI and expanding
  functionality.
- **My role:** As a frontend developer, I designed the RBAC and authentication model,
  owned the Redux Toolkit state architecture for multi-role workflows, shipped the
  multilingual layer, introduced the AI-assisted component workflow, and integrated
  REST APIs with the Node.js/Express.js backend team.
- **The problem:** Three portals serving different audiences had to share one platform
  without leaking data between roles. The UI also had to be redesigned and new
  functionality shipped, on schedule.
- **Approach:**
  1. Rebuilt each portal in React.js, TypeScript and Material-UI on a shared component
     library.
  2. Enforced one two-tier RBAC model (super admin / limited admin) across all three
     portals.
  3. Kept shared multi-role state in Redux Toolkit so the portals stayed consistent as
     usage scaled.
  4. Moved every UI string into JSON language files, so new languages are
     configuration only.
  5. Integrated REST APIs with the backend team to power live B2B ordering and
     customer onboarding.
- **Key decisions:**
  - *Decision:* One two-tier RBAC model for all three portals. *Trade-off ✱:* a single
    model is simpler to reason about and audit than per-portal rules, but every new
    permission has to be designed against both tiers up front.
  - *Decision:* Redux Toolkit for multi-role state. *Trade-off ✱:* more structure than
    Context, in exchange for predictable shared state and debugging tools as the
    workflows grew.
  - *Decision:* A JSON-driven multilingual layer. *Trade-off ✱:* new languages need no
    code changes, but every string has to go through the translation layer from day
    one.
  - *Decision:* GitHub Copilot paired with a shared component library. *Trade-off ✱:*
    reusable components build 30%+ faster, but generated code still needs review
    against the library's conventions.
- **Impact:** 30%+ faster reusable-component builds, the largest efficiency gain on the
  project · the full three-portal platform delivered on schedule across every sprint
  and QA cycle · zero missed production releases.
- **Stack:** React.js, TypeScript, Material-UI, Redux Toolkit, Node.js, Express.js,
  AWS, MySQL

### 5.2 `municipal-bill-payment`: Municipal bill payment platform
*Fintech · Municipal payments · Platform: Web*

- **Summary:** Two single-page apps giving municipal staff and residents one place to
  manage and pay bills online.
- **Context:** A payments platform for municipalities, with an admin portal for
  municipal staff and a citizen portal for residents paying their bills online.
- **My role:** As a frontend developer, I built both single-page apps, their
  authentication and a shared component set; integrated Strapi CMS; managed source
  control across Bitbucket and Azure DevOps Repos; and tracked sprints in JIRA and
  Azure DevOps Boards.
- **The problem:** Residents needed a simple way to pay bills. Staff needed to manage
  them, and to publish content updates without waiting on engineers.
- **Approach:**
  1. Built two responsive React.js and TypeScript single-page apps with Material-UI.
  2. Implemented authentication with the Context API across both portals.
  3. Developed a reusable, modular component set shared by both portals.
  4. Integrated Strapi CMS so non-technical staff publish content directly.
- **Key decisions:**
  - *Decision:* Context API for authentication state. *Trade-off ✱:* lighter than
    Redux for the narrow state two portals share, at the cost of Redux's devtools and
    middleware if that state grows.
  - *Decision:* Strapi CMS for content. *Trade-off ✱:* staff publish without
    engineering, but there is a CMS to run and keep in step with the frontend.
  - *Decision:* One component set for both portals. *Trade-off ✱:* new screens build
    faster and look consistent, but a change to a shared component has to be checked
    in both apps.
- **Impact:** every QA cycle and production deployment supported without a rollback
  incident · non-technical staff publish content directly, removing engineering from
  the content-update loop.
- **Stack:** React.js, TypeScript, Material-UI, Context API, Node.js, MySQL, Strapi CMS,
  Azure DevOps

### 5.3 `workflow-portal`: Workflow management portal
*Enterprise · Internal tools · Platform: Web*

- **Summary:** An internal workflow portal owned end to end, from an empty repository
  to production.
- **Context:** An enterprise workflow management portal for internal users, replacing
  workflow steps that were still tracked manually.
- **My role:** As a frontend developer, I owned the portal end to end, from initial
  setup through production deployment.
- **The problem:** Automate manual workflow steps in an app employees could sign in to
  with their existing company accounts, built from scratch.
- **Approach:**
  1. Set up the foundations first: protected routing, environment configuration and the
     deployment pipeline.
  2. Implemented RBAC with Google OAuth.
  3. Integrated REST APIs to automate steps that had been tracked by hand.
  4. Built the UI in React.js, TypeScript and Material-UI, with Redux Toolkit and RTK
     Query against a Java/MySQL backend.
- **Key decisions:**
  - *Decision:* Foundations before features. *Trade-off ✱:* the first visible feature
    arrived later, but every feature after it shipped onto working routing,
    configuration and deployment.
  - *Decision:* Google OAuth for sign-in. *Trade-off ✱:* no separate credentials to
    manage, but access is tied to the company's Google identity.
  - *Decision:* RTK Query for API data. *Trade-off ✱:* caching and request state are
    handled for you, but it's another abstraction to learn on top of Redux Toolkit.
- **Impact:** previously manual workflow steps automated · employees sign in with
  existing company credentials · the portal shipped from setup to production under
  one owner.
- **Stack:** React.js, TypeScript, Material-UI, Redux Toolkit, RTK Query, Java, MySQL

### 5.4 `warehouse-mobile-migration`: Warehouse operations apps
*Logistics · Mobile · Platform: Mobile*

- **Summary:** Led the migration of a global e-commerce company's warehouse apps from
  Ionic to React Native.
- **Context:** A global e-commerce company's internal warehouse applications ran on a
  hybrid Ionic stack.
- **My role:** As a frontend developer, I led the Ionic-to-React-Native migration,
  owning the Android and iOS rebuild end to end.
- **The problem:** Replace the legacy hybrid apps with native-performance Android and
  iOS builds, and keep warehouse-floor workflows fast and observable.
- **Approach:**
  1. Rebuilt the apps in React Native and TypeScript, with Redux Toolkit and RTK Query.
  2. Integrated QR/barcode scanning into core warehouse workflows.
  3. Applied memoisation across high-traffic screens.
  4. Set up Firebase, CleverTap and New Relic for crash, usage and performance
     monitoring.
  5. Configured separate dev/staging/production builds and CI/CD pipelines.
- **Key decisions:**
  - *Decision:* Migrate to React Native rather than keep the hybrid stack.
    *Trade-off ✱:* native performance on both platforms, at the cost of rebuilding the
    UI layer.
  - *Decision:* Memoise high-traffic screens (React.memo, useMemo, useCallback).
    *Trade-off ✱:* fewer re-renders under warehouse-floor load, but memoised code must
    keep its dependencies correct.
  - *Decision:* Separate environment builds and pipelines. *Trade-off ✱:* releases need
    no manual environment switching, but there's more pipeline configuration to
    maintain.
- **Impact:** native-performance Android and iOS builds replaced the legacy hybrid
  stack · manual data lookups replaced by a single scan · real-time crash, usage and
  performance monitoring.
- **Stack:** React Native, TypeScript, Redux Toolkit, RTK Query, Firebase, Node.js

### 5.5 `healthcare-ecommerce-app`: Healthcare e-commerce app
*Healthcare · Mobile · Platform: Mobile*

- **Summary:** The cross-platform mobile UI for product discovery and ordering, from
  browse through checkout.
- **Context:** A healthcare e-commerce mobile app for discovering and ordering products.
- **My role:** As a frontend developer, I built the cross-platform mobile UI and its
  integration with the backend APIs.
- **The problem:** Deliver browse-to-checkout on Android and iOS from one codebase,
  against an existing Ruby on Rails backend.
- **Approach:**
  1. Built the mobile UI in React Native with Redux and Firebase.
  2. Integrated REST APIs for the product catalog, authentication and order management.
  3. Built a reusable UI component set.
  4. Worked directly with QA to resolve stability and UX issues before release.
- **Key decisions:**
  - *Decision:* React Native for both platforms. *Trade-off ✱:* one codebase for
    Android and iOS, but platform-specific issues still need native knowledge.
  - *Decision:* A reusable component set. *Trade-off ✱:* consistent screens and faster
    fixes, in exchange for designing the components up front.
- **Impact:** the browse-to-checkout flow shipped on both platforms · stability and UX
  issues resolved with QA before release.
- **Stack:** React Native, JavaScript, Firebase, Redux, Ruby on Rails

### 5.6 `support-ticket-system`: Support Ticket Management System
*Independent · Full-stack · Platform: Web & API*

- **Role fact chip:** "Sole developer" (self-owned).
- **Summary:** A full-stack ticketing platform I designed, built and deployed on my own.
- **Context:** An independent project to demonstrate full-stack ownership beyond
  frontend-only delivery.
- **My role:** Sole developer: data model, REST API, frontend and deployment.
- **The problem:** Model a complete support workflow, with tickets moving through
  creation, assignment, tracking, escalation and resolution, and different powers for
  admins and users.
- **Approach:**
  1. REST API in Node.js and Express.js, with data modelled in MongoDB using Mongoose.
  2. JWT-based authentication and role-based authorization across the Admin and User
     tiers.
  3. React.js and TypeScript frontend, with Redux Toolkit and RTK Query for state and
     data fetching.
  4. Frontend deployed on Vercel and backend on Render, as a live, public app.
- **Key decisions:**
  - *Decision:* JWT authentication. *Trade-off ✱:* a stateless API that any host can
    serve, but revoking a token needs extra handling.
  - *Decision:* MongoDB with Mongoose. *Trade-off ✱:* flexible ticket documents with
    schema validation in code, but reporting across users needs more care than with SQL
    joins.
  - *Decision:* Separate hosting for frontend and backend. *Trade-off ✱:* each side
    deploys independently on a free tier, at the cost of cross-origin configuration.
- **Impact:** a live, publicly accessible app covering the full ticket lifecycle · full-stack
  ownership from data model to deployment.
- **Stack:** React.js, TypeScript, Redux Toolkit, RTK Query, Node.js, Express.js, MongoDB
- **Live:** `https://support-ticket-management-system-beta.vercel.app/`, using the
  `support-ticket` screenshot and its existing alt text.

---

## 6. Decisions log

| Decision | Choice | Why |
|---|---|---|
| Split phase 4 | 4a pages, 4b diagrams | reviewable PRs; the diagrams need their own design round |
| Role wording | "Frontend developer" on client work, no team sizes | owner |
| Index page | none; "Back to all work" goes to `/#experience` | YAGNI |
| Transitions | CSS cross-document View Transitions | zero JS; degrades to normal navigation |
| Home links | a "Read case study →" link inside the cards | no nested interactive elements |
| Trade-offs | written by Claude, marked ✱, owner-approved | the resume records decisions, not trade-offs |
| 404s for unknown slugs | `src/proxy.ts` rewrite, scoped to `/work/:slug` | `dynamicParams = false` is unavailable with Cache Components; without Proxy, unknown slugs got a 200 soft-404 |
| Outline sections | no `scroll-reveal` | a scroll-linked fade left the first section at ~30% opacity until the reader scrolled (Lighthouse colour-contrast) |
| Logo link name | visible "ND." + sr-only label | the phase 2 `aria-label` hid the visible text (WCAG 2.5.3) |
| Self-owned screenshot | `Screenshot eager` | above the fold on phones (LCP) |
