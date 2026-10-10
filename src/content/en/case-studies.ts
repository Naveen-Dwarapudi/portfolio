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
      "Feature development on a large-scale fintech platform where municipal staff manage bills and residents pay them online.",
    facts: { role: "Frontend developer", platform: "Web" },
    context:
      "An established, large-scale fintech platform for municipal bill payments, with an admin portal for municipal staff and a citizen portal for residents. I joined its existing team and codebase to build new features.",
    role: "As a frontend developer on the team, I built features across both portals, such as void and refund, with React.js, TypeScript and Material-UI; worked with Strapi CMS, which manages the platform's content in multiple languages; managed source control across Bitbucket and Azure DevOps Repos; and tracked sprints in JIRA and Azure DevOps Boards.",
    problem:
      "Changes to a live payments platform have to land without disturbing the payments flowing through it. Features like void and refund move money directly, and every screen has to work in each language the platform serves.",
    approach: [
      "Built features such as void and refund inside a large, existing React.js and TypeScript codebase.",
      "Followed the platform's established patterns, including its Context API-based authentication and the components shared by both portals.",
      "Worked with Strapi CMS, which manages the platform's content in multiple languages.",
      "Took every change through QA cycles and production deployments.",
    ],
    decisions: [
      {
        decision:
          "Follow the platform's existing patterns rather than introduce new ones.",
        tradeoff:
          "Changes stay consistent and easy to review in a large codebase, at the cost of sometimes working within a pattern I might have designed differently.",
      },
      {
        decision: "Keep language content in Strapi CMS, not in the code.",
        tradeoff:
          "Text and translations change without a release, but the frontend has to handle content that differs, or is missing, per language.",
      },
    ],
    impact: [
      "Shipped payment features such as void and refund to production on a large-scale fintech platform.",
      "Supported every QA cycle and production deployment without a rollback incident.",
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
