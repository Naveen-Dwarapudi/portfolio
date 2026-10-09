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
