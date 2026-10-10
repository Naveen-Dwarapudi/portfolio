# Design: Scroll-Assembled Case-Study Diagrams (Phase 4b)

**Date:** 2026-10-10
**Status:** Draft — awaiting owner review
**Parent spec:** `2026-09-19-nextjs-portfolio-design.md` (§5 "Signature diagrams", §7)
**Builds on:** `2026-10-09-case-studies-design.md` (4a)
**Branch:** `feat/case-study-diagrams`
**Approved from:** the live demo (`.superpowers/brainstorm/…/diagrams-demo-v2.html`), owner "go ahead"

---

## 1. Purpose

Parent spec §5 calls these three diagrams the site's signature interaction. Each one
assembles step by step as the reader scrolls, and shows system understanding where
client screenshots can't be used.

| Case study | Diagram |
|---|---|
| `pharma-enterprise-portals` | **One access model, three portals:** two-tier RBAC |
| `warehouse-mobile-migration` | **From a WebView to native:** Ionic → React Native |
| `support-ticket-system` | **A ticket's life, end to end:** ticket lifecycle |

### Success criteria

1. On these three pages, the Approach section is a diagram stage. Numbered steps on
   the left light up while the inline SVG on the right assembles to match.
2. **Zero client JavaScript.** CSS scroll-driven animations only (`view-timeline`,
   `animation-timeline`).
3. **Never gates content.** Without scroll-timeline support (e.g. Firefox today), with
   `prefers-reduced-motion: reduce`, or on narrow screens, the finished diagram and
   every step are fully visible.
4. **Accessibility:** each SVG is `role="img"` with an `aria-label` that summarises
   the diagram, and the steps are real ordered-list text. WCAG 2.1 AA in both themes.
5. **Themes:** colours come only from the existing tokens (CSS custom properties). No
   separate assets.
6. **Confidentiality:** labels are domain-only and resume-backed, with no client or
   system names and no internal architecture beyond what the case study already
   states.
7. **Budgets:** the LHCI budgets hold unchanged on `/work/pharma-enterprise-portals`.

---

## 2. Approach

### Rendering and animation

- Each diagram is a **server component** rendering inline SVG, with text and colours
  from content and tokens.
- The stage (`ScrollDiagram`) is a tall `<div>` (about 340vh on desktop) that declares
  `view-timeline-name: --diagram`. Its sticky child shows the steps and the SVG.
- Diagram parts carry step classes `dg-s1`…`dg-s5`. Each class maps to an
  `animation-range` slice of the timeline, `contain 0%–12%` through `76%–90%`, as in
  the demo.
  - **Boxes** fade and rise (`dg-appear`).
  - **Wires** draw: `pathLength="1"` plus `stroke-dashoffset` (`dg-draw`).
  - **Step text** brightens (`dg-lit`) and stays lit, so the reader sees progress.
- All of this sits inside
  `@supports (animation-timeline: view()) { @media (prefers-reduced-motion: no-preference) and (min-width: 768px) { … } }`.
  Outside that block nothing is hidden, and the stage is normal height and not sticky.

### Content model

`CaseStudy` gains an optional `diagram`, a discriminated union, so `tsc` enforces
every label:

```ts
type DiagramBase = { title: string; ariaLabel: string };
type RbacDiagram = DiagramBase & {
  kind: "rbac";
  labels: {
    who: string; how: string; where: string;
    superAdmin: string; limitedAdmin: string; staff: string; customer: string;
    adminPortal: string; staffPortal: string; customerPortal: string;
    model: string; modelNote: string; tierAll: string; tierSubset: string; blocked: string;
  };
};
type MigrationDiagram = DiagramBase & {
  kind: "migration";
  labels: {
    before: string; after: string; shell: string; webview: string; webCode: string;
    webUi: string; plugins: string; rn: string; rnState: string; nativeUi: string;
    platforms: string; scanning: string; scanningNote: string; monitoring: string;
    monitoringNote: string; dev: string; staging: string; prod: string;
  };
};
type LifecycleDiagram = DiagramBase & {
  kind: "lifecycle";
  labels: {
    auth: string; authNote: string; lifecycle: string; created: string;
    assigned: string; inProgress: string; tracked: string; escalated: string;
    resolved: string;
  };
};
type CaseStudyDiagram = RbacDiagram | MigrationDiagram | LifecycleDiagram;
```

**On diagram pages, the steps are the Approach.** `approach: string[]` supplies the
step list (3–5 items), and the old list text for those three studies is replaced by
the step text approved in the demo (§3). There is one source per section and no
duplication. Pages without a diagram render the plain list as before.

### Components

| File | Responsibility |
|---|---|
| `src/components/diagrams/scroll-diagram.tsx` | Stage: sticky layout, step list, kicker and title, slot for the SVG |
| `src/components/diagrams/rbac-diagram.tsx` | SVG for `kind: "rbac"` |
| `src/components/diagrams/migration-diagram.tsx` | SVG for `kind: "migration"` |
| `src/components/diagrams/lifecycle-diagram.tsx` | SVG for `kind: "lifecycle"` |
| `src/components/diagrams/diagram.tsx` | Switch on `kind` (exhaustive; a missing case fails `tsc`) |
| `src/app/globals.css` | `.dg-*` classes, keyframes, step ranges, responsive and fallback rules |

`CaseStudyArticle`'s Approach section renders `<ScrollDiagram>` when `study.diagram` is
set, and the numbered list otherwise.

### Responsive behaviour

- **≥ 768px:** two columns (steps | SVG), sticky, scroll-assembled.
- **< 768px:** no sticky and no assembly. The steps list sits above the finished SVG,
  which scales to the container width. A tall sticky stage doesn't fit a phone
  viewport.

---

## 3. Content (from the approved demo)

### 3.1 Pharma: "One access model, three portals"

**Steps (become `approach`):**
1. Three portals serve three audiences: admins, internal staff and customers.
2. One authentication and RBAC model sits in front of all three.
3. Two admin tiers: super admin gets everything, limited admin a restricted set.
4. Cross-role access is blocked: nobody reaches a portal their role doesn't allow.

**Labels:**
- WHO / HOW / WHERE
- Super admin · Limited admin · Internal staff · Customer
- Admin portal · Staff portal · Customer portal
- Auth + RBAC · ONE MODEL
- Super admin: all · Limited: subset
- CROSS-ROLE ACCESS BLOCKED

**aria-label:** "Diagram: super admins, limited admins, internal staff and customers
pass through one authentication and two-tier RBAC model to their own portal;
cross-role access is blocked."

### 3.2 Warehouse: "From a WebView to native"

**Steps:**
1. Before: the UI ran as web code inside a WebView, wrapped in a native shell.
2. After: the UI is rebuilt as real native components with React Native.
3. QR/barcode scanning is wired into the core warehouse workflows.
4. Crash, usage and performance monitoring, plus separate dev, staging and prod
   builds.

**Labels:**
- BEFORE · IONIC / AFTER · REACT NATIVE
- NATIVE SHELL · WEBVIEW · HTML · CSS · JS · WEB UI · PLUGINS FOR DEVICE APIs
- React Native · TypeScript · REDUX TOOLKIT · RTK QUERY
- Native UI components · ANDROID · iOS
- QR / barcode · SCANNING
- Monitoring · CRASH · PERF
- DEV · STAGING · PROD

**aria-label:** "Diagram: before, an Ionic app renders web UI in a WebView inside a
native shell; after, React Native renders native Android and iOS components, with
scanning, monitoring and three build environments."

### 3.3 Support ticket: "A ticket's life, end to end"

**Steps:**
1. Every request passes JWT authentication and role checks (Admin / User).
2. A ticket is created, then assigned.
3. It's tracked while work is in progress.
4. If it needs more attention, it's escalated.
5. Finally it's resolved, closing the lifecycle.

**Labels:**
- JWT authentication · role checks · ADMIN · USER TIERS
- LIFECYCLE
- Created · Assigned · In progress · TRACKED · Escalated · Resolved

**aria-label:** "Diagram: behind JWT authentication and Admin/User role checks, a
ticket moves from created to assigned to in progress, may be escalated, and ends
resolved."

**Facts check:** every label and step restates the resume or the approved 4a copy:
two-tier RBAC across three portals, preventing cross-role access; Ionic → React Native
with native builds; QR/barcode scanning; Firebase/CleverTap/New Relic monitoring
(shown generically as "Monitoring"); dev/staging/prod; the JWT plus Admin/User tiers;
and the lifecycle creation → assignment → tracking → escalation → resolution.

---

## 4. Testing

- **Content:** each of the three studies has the expected `diagram.kind`, and the other
  three have none. Step counts are 3–5. `tsc` enforces every label key.
- **Components:**
  - each diagram renders as `role="img"` with its aria-label and its key labels;
  - `ScrollDiagram` renders the steps as an ordered list and the title as an h3 inside
    the Approach h2;
  - `CaseStudyArticle` renders the stage only when `diagram` is set.
- **E2E:**
  - **Desktop with motion:** at the start of the stage the step-4 element is near
    opacity 0, and after scrolling through it is 1.
  - **Reduced motion and phone width:** every diagram part is opacity 1 at load, and
    the stage is not sticky.
  - **axe:** on the three diagram pages in both themes, with the contrast-coverage
    guard.
- **LHCI:** unchanged budgets on the pharma page, which now carries a diagram.

---

## 5. Out of scope

- Diagrams on the other three case studies (parent spec §5 names three).
- JS fallback animation for Firefox: it gets the static finished diagram (parent §7:
  "Motion fallback" isn't needed for zero-JS; YAGNI).
- Interactive hover or tooltips on diagram nodes.

---

## 6. Decisions log

| Decision | Choice | Why |
|---|---|---|
| Animation engine | CSS scroll-driven (`view-timeline`) | zero JS; budget headroom is thin |
| Unsupported or reduced motion | finished diagram, fully visible | never gate content |
| Phones | static diagram under the steps | a sticky 340vh stage doesn't fit a phone viewport |
| Steps vs Approach list | steps *are* the Approach text on diagram pages | one source; no duplicated content |
| Labels | in content, typed per diagram kind | phase 5 translations, enforced by `tsc` |
