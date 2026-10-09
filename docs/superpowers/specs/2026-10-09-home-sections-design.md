# Design: Home Sections (Phase 3)

**Date:** 2026-10-09
**Status:** Draft — awaiting owner review
**Parent spec:** `2026-09-19-nextjs-portfolio-design.md` (§4, §11 phase 3)
**Builds on:** `2026-10-09-design-system-design.md` (tokens, motion toolkit, building blocks)
**Branch:** `feat/home-sections`

---

## 1. Purpose

Phase 3 replaces the phase 2 showcase with the real home page. When it is done, a
recruiter can learn the owner's seniority, stack, domains and measurable impact
from one scroll. Every claim comes from the resume
(`src/resume/Naveen Dwarapudi Resume.pdf`) and is held to the confidentiality
rules: clients are described by domain only.

### Success criteria

1. All of the parent spec §4 home sections are present, in order, with the content
   in §4 below. The owner reviews that content before merge.
2. No client, client product or client system is named anywhere on the page or in
   the repo. The confidentiality guard passes.
3. All page text lives in a typed content module, so phase 5 can add locales
   without editing components.
4. WCAG 2.1 AA passes in both themes. Every section honours reduced motion and
   renders fully without JavaScript.
5. The phase 1 Lighthouse budgets pass unchanged.

### Out of scope

- Case-study pages and links to them (phase 4). The engagement cards are not links
  yet.
- Translations (phase 5), the command palette (phase 6), the contact form (phase 7)
  and SEO/OG work (phase 8). The one exception is the resume `noindex` header in
  §5, which ships now because the PDF becomes public in this phase.

---

## 2. Content architecture

**Decision: a typed content module** (`src/content/en.ts`), shaped by
`src/content/types.ts` (`HomeContent`).

| Option | Verdict |
|---|---|
| Typed TS module per locale | **Chosen.** Sections receive typed props. In phase 5, `hi.ts` and `te.ts` must satisfy the same `HomeContent` type, so a missing translation fails `tsc` (parent spec §9). |
| next-intl JSON catalogs now | Rejected for this phase: that wiring belongs to phase 5. |
| Copy hard-coded in components | Rejected: phase 5 would have to rewrite every section. |

- `page.tsx` imports `homeContent` and passes each section its slice.
- Each section component is a server component in `src/components/sections/`. It
  holds no copy of its own apart from layout.
- The only client pieces in this phase are the existing motion effects and one new
  `CopyEmailButton`.

---

## 3. Page structure

The header gains anchor links on `md` and up: About · Experience · Skills ·
Projects · Contact. Below `md` it keeps just the monogram and theme toggle; the
phase 6 search button will cover mobile navigation.

| # | Section (`id`) | Treatment |
|---|---|---|
| 01 | Hero (`top`) | As in phase 2. "View work" goes to `#experience`. "Download resume" downloads the PDF (§5). |
| — | Metrics | As in phase 2: `4+` years · `5` client engagements · `30%+` faster component builds · `4` industries. |
| 02 | About (`about`) | `mypic-1.jpeg` (lazy, `getImageProps`) beside about 120 words of prose (§4.1), plus three mono fact chips. |
| 03 | Experience (`experience`) | Role header, then a vertical timeline whose line draws as it scrolls (CSS `view()` `scaleY`, static where unsupported). Five `InteractiveCard` engagement cards, each with `scroll-reveal`. |
| 04 | Skills (`skills`) | A grid of 9 group cards with chips, in resume order. The AI-Assisted Development card is accent-highlighted. |
| 05 | Projects (`projects`) | **Independent project:** a large feature card with the screenshot in a CSS browser frame (tilt via `InteractiveCard`), bullets, chips and a "Live site" button. **Side projects:** two compact cards labelled "Practice project". |
| 06 | Certifications & education (`credentials`) | A B.Tech card, plus certifications grouped by issuer. |
| 07 | Contact (`contact`) | A large heading, an email link with `CopyEmailButton`, and LinkedIn and GitHub buttons, plus the location. |
| — | Footer | The full name, the year, "Built with Next.js · source on GitHub", and a back-to-top link. |

External links open in a new tab with `rel="noopener noreferrer"` and visible link
text. Their accessible names say they open a new tab.

### `CopyEmailButton` (client)

- Copies the address with `navigator.clipboard.writeText`.
- Announces "Email address copied" in a polite live region, and the label reads
  "Copied" for 2 s.
- If the clipboard is unavailable or refused, it announces "Copy failed — the
  address is dbsnaveen@gmail.com".
- The `mailto:` link sits beside it and always works, with or without JS.

### Screenshots

- Screenshots are served through `getImageProps()` with `loading="lazy"`, using
  explicit `width`/`height` from the static import, so they cause no CLS.
- Sizes: about 1040 px wide for the feature card and about 500 px for side
  projects. These are PNGs of 0.26–1 MB on disk, optimised to AVIF/WebP. They sit
  below the fold, so they don't affect LCP.

---

## 4. Draft content (owner to review every line)

Source: the resume. Rewrites only remove client names, product or system names,
and internal role names (e.g. "Internal SPOC" becomes "internal staff"). No claim is
added that the resume does not make.

### 4.1 About

> I'm a React.js and React Native engineer with 4+ years of shipping production
> software at Aziro Technologies, across five client engagements in
> pharmaceuticals, fintech, logistics and healthcare. My work spans enterprise web
> portals and cross-platform mobile apps: I rebuilt three B2B portals on a modern
> stack with a two-tier access-control model, led a warehouse app migration from
> Ionic to React Native, and introduced an AI-assisted component workflow that cut
> build time by over 30%. I care about clean state architecture, accessible
> interfaces and releases that ship without rollbacks. Lately I've been extending
> into full-stack ownership with Node.js, Express and MongoDB, including a
> ticketing platform I designed, built and deployed on my own.

**Fact chips:** `Andhra Pradesh, India` · `React & React Native` · `Now: full-stack MERN`

### 4.2 Experience

**Software Engineer, Aziro Technologies Pvt. Ltd.** · June 2022 – Present ·
AI-native product engineering company, Chennai, India

1. **Pharma · Enterprise web: Pharmaceutical B2B ordering platform**
   - *Summary:* Rebuilt three enterprise portals (admin, internal staff and
     customer) on a new stack to modernise B2B ordering for a distributor network.
   - Architected a two-tier RBAC and authentication model (super admin / limited
     admin) enforced across all three portals.
   - Owned the Redux Toolkit state architecture for multi-role workflows.
   - Shipped a JSON-driven multilingual layer: new languages through configuration
     alone.
   - Introduced a GitHub Copilot workflow with a shared component library, giving
     30%+ faster component builds.
   - *Stack:* React.js, TypeScript, Material-UI, Redux Toolkit, Node.js,
     Express.js, AWS, MySQL
2. **Fintech · Municipal payments: Municipal bill payment platform**
   - *Summary:* Built two responsive single-page apps, admin and citizen, giving
     municipal staff and residents one place to manage and pay bills online.
   - Context API-based authentication across both portals.
   - Integrated Strapi CMS so non-technical staff publish content without
     engineering.
   - Supported every QA cycle and production deployment without a rollback.
   - *Stack:* React.js, TypeScript, Material-UI, Context API, Node.js, MySQL, Strapi
     CMS, Azure DevOps
3. **Enterprise · Internal tools: Workflow management portal**
   - *Summary:* Owned an internal workflow portal end to end, from project setup to
     production deployment.
   - Set up protected routing, environment configuration and the deployment
     pipeline before any feature work.
   - Implemented RBAC with Google OAuth, so employees sign in with existing company
     credentials.
   - Automated previously manual workflow steps through REST integrations.
   - *Stack:* React.js, TypeScript, Material-UI, Redux Toolkit, RTK Query, Java,
     MySQL
4. **Logistics · Mobile: Warehouse operations apps**
   - *Summary:* Led the migration of a global e-commerce company's internal
     warehouse apps from Ionic to React Native, shipping native-performance Android
     and iOS builds.
   - Integrated QR/barcode scanning into core warehouse workflows.
   - Memoised high-traffic screens to stay responsive under warehouse-floor usage.
   - Set up Firebase, CleverTap and New Relic monitoring, plus dev/staging/prod
     pipelines.
   - *Stack:* React Native, TypeScript, Redux Toolkit, RTK Query, Firebase, Node.js
5. **Healthcare · Mobile: Healthcare e-commerce app**
   - *Summary:* Built the cross-platform mobile UI for product discovery and
     ordering, from browse through checkout.
   - Integrated catalog, authentication and order APIs against a Ruby on Rails
     backend.
   - Built a reusable component set and worked with QA to resolve stability and UX
     issues before release.
   - *Stack:* React Native, JavaScript, Firebase, Redux, Ruby on Rails

### 4.3 Skills (resume order, verbatim)

| Group | Items |
|---|---|
| Frontend Development | React.js, Next.js, React Native, TypeScript, JavaScript (ES6+), Redux Toolkit, RTK Query, Context API, HTML5, CSS3, Bootstrap, Material-UI (MUI) |
| Backend & APIs | Node.js, Express.js, REST API Design & Integration, JWT Authentication |
| Databases | MongoDB, MySQL, PostgreSQL |
| Testing | Jest, React Testing Library, Vitest |
| Mobile Development | React Native, Android Studio, Xcode, Multi-environment builds (dev/staging/prod) |
| Cloud & DevOps | AWS, CI/CD build pipelines, Git, GitHub, Bitbucket, Azure DevOps (Boards & Repos) |
| Monitoring & Analytics | Firebase, CleverTap, New Relic |
| Project Tools | JIRA, Postman, Strapi CMS |
| AI-Assisted Development *(accent)* | GitHub Copilot, Claude: component generation & code review, with a 30%+ measured build-time reduction |

### 4.4 Projects

**Independent project: Support Ticket Management System** (full-stack MERN
application)

- Designed and built a full-stack ticketing platform covering the whole lifecycle:
  creation, assignment, tracking, escalation and resolution.
- JWT-based authentication and role-based authorization across Admin and User
  tiers.
- REST API in Node.js/Express.js, with data modelled in MongoDB with Mongoose.
- React.js frontend with Redux Toolkit and RTK Query for state and data fetching.
- Frontend deployed on Vercel and backend on Render, as a live, publicly accessible
  app.
- *Stack:* React.js, TypeScript, Redux Toolkit, RTK Query, Node.js, Express.js,
  MongoDB
- *Live site:* https://support-ticket-management-system-beta.vercel.app/ (there is no
  code link; the repo is private)

**Side projects** (labelled "Practice project"):

- **Payments Portal**: a React payments portal with authentication, validated
  forms and translations, backed by Node.js, Express and MongoDB.
  - *Stack:* React, TypeScript, Vite, Material-UI, Redux Toolkit, React Hook Form,
    Node.js, MongoDB
  - *Live site:* https://naveen-dwarapudi.netlify.app/login
- **Mom Tribute**: a personal tribute website for my mother, built for Mother's
  Day.
  - *Stack:* HTML, CSS, JavaScript
  - *Live site:* https://naveen-dwarapudi.github.io/mom-tribute/

### 4.5 Certifications & education

- **B.Tech, Electronics and Communication Engineering**: Ramachandra College of
  Engineering, Eluru · 2019
- **HackerRank:** Frontend Developer (React) · JavaScript (Intermediate) · Node
  (Basic)
- **Udemy:** Full-Stack Web Development with MERN & PERN Stacks · React Testing
  Library with Jest / Vitest · The Complete React Native + Hooks Course

### 4.6 Contact

- **Heading:** "Let's talk."
- **Line:** "The quickest way to reach me is email."
- Email `dbsnaveen@gmail.com` (link plus copy button) · LinkedIn
  `linkedin.com/in/dbsnaveen` · GitHub `github.com/Naveen-Dwarapudi` ·
  Andhra Pradesh, India
- **No phone number.** It's omitted to avoid scraping; recruiters have it on the
  resume.
- **No "open to work" statement.** The owner is currently employed, and that is
  their call to make.

### 4.7 Footer

"© {year} Bhavani Sankar Naveen Dwarapudi · Built with Next.js · Source on GitHub"
(linking to `github.com/Naveen-Dwarapudi/portfolio`) · Back to top

---

## 5. Resume download

- The PDF is copied to `public/naveen-dwarapudi-resume.pdf`, so the hero's
  "Download resume" works now.
- **`X-Robots-Tag: noindex`** is set for that path in `next.config.ts` `headers()`,
  so search engines don't index it. That keeps the client names in the resume out
  of search results (parent spec §5 exception).
- `src/resume/` stays as the content source of truth.

---

## 6. Testing

- **Content:** a unit test walks `homeContent` and asserts that no string is empty
  and every URL is absolute `https:`. The existing confidentiality guard already
  scans `src/content/`.
- **Sections:** unit tests for each section cover:
  - landmark and heading structure;
  - that the content renders;
  - that external links have `target="_blank"`, `rel` and an accessible name
    saying they open a new tab;
  - that the engagement cards contain no links.
- **CopyEmailButton:** copies the address; announces success; announces the
  fallback when clipboard access is rejected.
- **E2E:**
  - every header anchor scrolls to its section;
  - the resume link returns 200 `application/pdf` with `X-Robots-Tag: noindex`;
  - axe passes in four theme states on the full page;
  - there is no horizontal scroll at 320 and 375 px;
  - the page renders fully with JS blocked;
  - all content is visible under reduced motion.
- **Lighthouse CI:** the budgets are unchanged. If LCP or script size regresses,
  fix the cause; never the budget.

---

## 7. Decisions log

| Decision | Choice | Why |
|---|---|---|
| Phone number | not shown | scraping and spam risk; it's on the resume |
| Support Ticket System code link | none | the repo is private (owner) |
| Payments Portal link | `naveen-dwarapudi.netlify.app/login` | owner-provided; verified 200 |
| Content model | typed TS module per locale | phase 5 locales checked by `tsc` |
| Engagement cards | not links until phase 4 | no dead links |
| Resume indexing | `X-Robots-Tag: noindex` now | the PDF goes public in this phase |
| Contact framing | neutral, no "open to work" | the owner is currently employed |
| Fonts | local subsets of Geist (400–500), Geist Mono (400), Bricolage (800) | the full Google Geist fonts cost ~2 simulated round trips of LCP |
| Favicon | 309 B `icon.svg` monogram | the scaffold's 15 KB `favicon.ico` loaded before LCP |
| Image format | AVIF then WebP | hero photo 7.3 → 5.5 KB; parent spec §2 |
| About photo on phones | 280 px wide, after the text | Chrome fetched it before LCP despite `loading="lazy"` |
| Skill cards | static `Card` + CSS `.hover-lift` | keeps 9 client islands out of the RSC payload |
| Project link names | explicit `aria-label` | identical accessible names across engines |
| Footer year | `"use cache"` `CopyrightYear` | Cache Components forbids `new Date()` in prerender |
