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
