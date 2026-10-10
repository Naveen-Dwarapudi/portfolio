import type { HomeContent } from "../types";

/**
 * English home-page copy. Source of truth for every claim: the resume
 * (src/resume/). Clients are described by domain only (CLAUDE.md,
 * Confidentiality); src/test/confidentiality.test.ts scans this file.
 */
export const homeContent: HomeContent = {
  site: {
    homeLabel: "Naveen Dwarapudi, home",
    navLabel: "Sections",
    languageLabel: "Language",
    comingSoon: "Coming soon",
  },
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
          "Feature development on a large-scale fintech platform where municipal staff manage bills and residents pay them online.",
        highlights: [
          "Built payment features such as void and refund across the admin and citizen portals.",
          "Worked with Strapi CMS, which manages the platform's content in multiple languages.",
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
          "Claude",
          "GitHub Copilot",
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
  notFound: {
    title: "Page not found | Naveen Dwarapudi",
    heading: "This page doesn't exist.",
    body: "The link may be broken, or the page may have moved.",
    home: "Go to the home page",
    work: "See the case studies",
  },
};
