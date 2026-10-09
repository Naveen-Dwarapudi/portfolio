# Home Sections (Phase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the phase 2 showcase with the real home page: About, Experience, Skills, Projects, Credentials, Contact and Footer. All copy comes from one typed content module. The resume becomes downloadable with `noindex`, and the page stays within the mobile Lighthouse budgets.

**Architecture:**
- `src/content/types.ts` defines `HomeContent`, and `src/content/en.ts` holds the English copy (phase 5 adds `hi`/`te` against the same type).
- Each section is a server component in `src/components/sections/` that receives its slice of the content. `page.tsx` composes them.
- Making room in the budget comes first (Task 1), because the prototype showed the full content pushing simulated LCP to 2.55–2.78 s until fonts, the favicon and images were slimmed.

**Tech Stack:** Next.js 16.4 (Cache Components on), React 19.3, Tailwind 4, `next/font/local`, `getImageProps`, Vitest + RTL, Playwright, Lighthouse CI.

**Spec:** `docs/superpowers/specs/2026-10-09-home-sections-design.md` (builds on `2026-10-09-design-system-design.md`; parent `2026-09-19-nextjs-portfolio-design.md`)

**Prototype evidence:** every file below was built and verified in a throwaway worktree before the plan was written.
- **Unit tests:** 79/79 passed.
- **E2E:** 27/27 passed.
- **Lighthouse:** two full autoruns, 6/6 runs passing, with LCP 2323–2479 ms, script 140,447 B, CLS ≤ 0.0003 and performance 0.98.

## Global Constraints

- **Copy:** use spec §4 verbatim, with the content additions owner-approved at plan review (see Task 2). Never name a client, a client product or system, or an internal role name. `src/test/confidentiality.test.ts` must stay green.
- **Name:** the full name "Bhavani Sankar Naveen Dwarapudi" for the h1, alt text and footer; "Naveen Dwarapudi" where space is tight (the logo label).
- **No phone number** anywhere on the page.
- **External links:** they open in a new tab with `rel="noopener noreferrer"`, and their accessible name ends with "(opens in a new tab)".
- **Budgets:** unchanged in `lighthouserc.json`. **Never raise them.** If LCP regresses, find the bytes.
- **No new dependencies.** No `next/link`, no `<Image>` component (use `getImageProps`), no Motion.
- **Cache Components:** `new Date()` during render fails the build. Use the cached `CopyrightYear` (Task 6).
- **No commits during execution.** The owner reviews everything at the end and approves the commits (memory: no-auto-commit). The plan's "Checkpoint" steps replace commit steps.
- Branch: `feat/home-sections` (it already holds the spec commit).

## Review Focus

1. **Real browsers' accessible names for new-tab links:** jsdom drops the space at an sr-only boundary, and Chromium adds one before punctuation. So project links use an explicit `aria-label`, and the exact names are asserted in Chromium in Task 6 (`e2e/home.spec.ts`).
2. **The LCP budget with full content:** the margin is thin (worst run 2479 ms). It's pinned by the Task 7 LHCI run, and the Task 1 savings must all land first.
3. **Lazy images fetched early:** Chrome fetched the About photo at about 59 ms even though it sits roughly 1,950 px down. That's handled by a 280 px mobile size and AVIF in Task 1/5, and pinned by the Task 6 AVIF e2e and Task 7 LHCI.
4. **A page with JS blocked or reduced motion:** every section must be visible. Pinned by the updated `e2e/motion.spec.ts` (Task 6).
5. **Search engines indexing the resume:** `X-Robots-Tag: noindex` is set on the PDF only, never on `/`. Pinned in Task 6 (`home.spec.ts`).

---

## File Structure

| Path | Responsibility |
|---|---|
| `src/fonts/*.woff2`, `src/fonts/OFL-*.txt`, `src/fonts/README.md` | Subset fonts, their licences, regeneration |
| `src/app/icon.svg` (replaces `favicon.ico`) | 309 B monogram icon |
| `next.config.ts` | AVIF/WebP formats; `noindex` header for the resume |
| `src/app/globals.css` | `.chip`, `.kicker`, `.bullets`, `.card-glow`, `.hover-lift`, `.timeline-line` |
| `src/content/types.ts`, `src/content/en.ts` | Typed copy |
| `src/components/ui/new-tab.ts`, `button.tsx`, `text-link.tsx` | New-tab link behaviour (`newTabLabel`) |
| `src/components/ui/screenshot.tsx`, `browser-frame.tsx` | Lazy optimised images, decorative browser frame |
| `src/components/contact/copy-email-button.tsx` | Client copy-to-clipboard with a live region |
| `src/components/sections/*.tsx` | Hero, About, Experience, Skills, Projects, Credentials, Contact |
| `src/components/site/site-header.tsx`, `site-footer.tsx`, `copyright-year.tsx` | Chrome |
| `src/lib/resume.ts`, `public/naveen-dwarapudi-resume.pdf` | Resume path and file |
| `vitest.config.mts` | `staticImages` plugin (image imports become StaticImageData) |
| `src/test/accessible-name.ts` | `nameWithSuffix` helper for jsdom names |

---

### Task 1: Budget headroom (fonts, icon, AVIF, shared classes)

**Files:**
- Create: `src/fonts/geist-400-500-latin.woff2`, `src/fonts/geist-mono-400-latin.woff2`, `src/fonts/OFL-Geist.txt`, `src/app/icon.svg`
- Rename: `src/fonts/OFL.txt` → `src/fonts/OFL-BricolageGrotesque.txt`
- Regenerate: `src/fonts/bricolage-grotesque-800-latin.woff2` (adds arrows to the glyph set)
- Delete: `src/app/favicon.ico`
- Modify: `src/fonts/README.md`, `src/app/layout.tsx` (fonts only), `next.config.ts` (images), `src/app/globals.css`, `src/components/ui/chip.tsx`, `src/components/motion/pointer-effects.tsx`
- Create: `e2e/home.spec.ts` (the AVIF and icon tests)

**Interfaces:**
- Produces:
  - CSS classes: `.chip`, `.kicker`, `.bullets` (on a `<ul>`), `.card-glow`, `.hover-lift`, `.timeline-line`
  - `next.config.ts` exporting `images.formats = ["image/avif", "image/webp"]`
  - Local font variables, unchanged in name: `--font-geist`, `--font-geist-mono`, `--font-bricolage`

**Why:** each item below was measured in the prototype with LHCI (6 runs each).
- The full Google Geist and Geist Mono fonts (29 + 23 KB) cost about 2 simulated round trips; the subsets are 16 + 7.7 KB.
- The scaffold's `favicon.ico` (15 KB, the Next logo) loaded early on every page.
- AVIF cut the hero photo from 7.3 KB to 5.5 KB.

- [ ] **Step 1: Write the failing E2E tests**

Create `e2e/home.spec.ts` with just these two tests. Task 6 adds the rest.

```ts
import { expect, test } from "@playwright/test";

test("images are served as AVIF to browsers that accept it", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const src = await page
    .getByRole("img", { name: "Portrait of Bhavani Sankar Naveen Dwarapudi" })
    .evaluate((img: HTMLImageElement) => img.currentSrc);
  const res = await request.get(src, {
    headers: { accept: "image/avif,image/webp,*/*" },
  });
  expect(res.headers()["content-type"]).toBe("image/avif");
});

test("the site icon is the small SVG monogram, not the default favicon", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const href = await page
    .locator('link[rel="icon"]')
    .first()
    .getAttribute("href");
  expect(href).toMatch(/\/icon\.svg/);
  expect((await request.get("/favicon.ico")).status()).toBe(404);
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run build && npx playwright test e2e/home.spec.ts`
Expected: both FAIL. The content type is `image/webp`, and the icon link points at `/favicon.ico`.

- [ ] **Step 3: Generate the font subsets**

```bash
SCR="$(mktemp -d)"
python3 -m venv "$SCR/ft" && "$SCR/ft/bin/pip" install -q fonttools brotli
G=https://github.com/google/fonts/raw/main/ofl
U="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+2190-2193,U+2197,U+20B9"
curl -sL -o "$SCR/brico.ttf" "$G/bricolagegrotesque/BricolageGrotesque%5Bopsz,wdth,wght%5D.ttf"
curl -sL -o "$SCR/geist.ttf" "$G/geist/Geist%5Bwght%5D.ttf"
curl -sL -o "$SCR/gmono.ttf" "$G/geistmono/GeistMono%5Bwght%5D.ttf"
"$SCR/ft/bin/fonttools" varLib.instancer "$SCR/brico.ttf" wght=800 opsz=96 wdth=100 -o "$SCR/b.ttf" -q
"$SCR/ft/bin/fonttools" varLib.instancer "$SCR/geist.ttf" wght=400:500 -o "$SCR/g.ttf" -q
"$SCR/ft/bin/fonttools" varLib.instancer "$SCR/gmono.ttf" wght=400 -o "$SCR/m.ttf" -q
"$SCR/ft/bin/pyftsubset" "$SCR/b.ttf" --unicodes="$U" --layout-features='kern,liga,calt' --flavor=woff2 --output-file=src/fonts/bricolage-grotesque-800-latin.woff2
"$SCR/ft/bin/pyftsubset" "$SCR/g.ttf" --unicodes="$U" --layout-features='kern,liga,calt,tnum' --flavor=woff2 --output-file=src/fonts/geist-400-500-latin.woff2
"$SCR/ft/bin/pyftsubset" "$SCR/m.ttf" --unicodes="$U" --layout-features='kern,liga,calt' --flavor=woff2 --output-file=src/fonts/geist-mono-400-latin.woff2
git mv src/fonts/OFL.txt src/fonts/OFL-BricolageGrotesque.txt
curl -sL -o src/fonts/OFL-Geist.txt https://raw.githubusercontent.com/google/fonts/main/ofl/geist/OFL.txt
ls -l src/fonts
```

Expected:
- `bricolage-grotesque-800-latin.woff2` is about 17,068 B, `geist-400-500-latin.woff2` about 16,088 B, and `geist-mono-400-latin.woff2` about 7,656 B.
- `OFL-Geist.txt` starts with `Copyright 2024 The Geist Project Authors`.

Replace `src/fonts/README.md`:

````markdown
# Fonts

All three fonts are local subsets of SIL OFL 1.1 fonts with no Reserved Font Name,
so subsets may keep their names. Each licence ships alongside:
`OFL-BricolageGrotesque.txt`, plus `OFL-Geist.txt` (which covers Geist and Geist Mono).

The subsets keep only the weights the site uses and Latin glyphs. That keeps
first-load font bytes around 41 KB instead of about 70 KB from the full Google
variable fonts, which protects the mobile LCP budget (measured in phase 3: the
full Geist fonts cost about two simulated round trips).

| File                                  | Source                                                          | Instance                    |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------- |
| `bricolage-grotesque-800-latin.woff2` | `ofl/bricolagegrotesque/BricolageGrotesque[opsz,wdth,wght].ttf` | wght 800, opsz 96, wdth 100 |
| `geist-400-500-latin.woff2`           | `ofl/geist/Geist[wght].ttf`                                     | wght 400–500 (variable)     |
| `geist-mono-400-latin.woff2`          | `ofl/geistmono/GeistMono[wght].ttf`                             | wght 400                    |

To regenerate them (sources from https://github.com/google/fonts):

```bash
python3 -m venv /tmp/ft && /tmp/ft/bin/pip install fonttools brotli
G=https://github.com/google/fonts/raw/main/ofl
U="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+2190-2193,U+2197,U+20B9"
curl -sL -o /tmp/brico.ttf "$G/bricolagegrotesque/BricolageGrotesque%5Bopsz,wdth,wght%5D.ttf"
curl -sL -o /tmp/geist.ttf "$G/geist/Geist%5Bwght%5D.ttf"
curl -sL -o /tmp/gmono.ttf "$G/geistmono/GeistMono%5Bwght%5D.ttf"
/tmp/ft/bin/fonttools varLib.instancer /tmp/brico.ttf wght=800 opsz=96 wdth=100 -o /tmp/b.ttf
/tmp/ft/bin/fonttools varLib.instancer /tmp/geist.ttf wght=400:500 -o /tmp/g.ttf
/tmp/ft/bin/fonttools varLib.instancer /tmp/gmono.ttf wght=400 -o /tmp/m.ttf
/tmp/ft/bin/pyftsubset /tmp/b.ttf --unicodes="$U" --layout-features='kern,liga,calt' --flavor=woff2 --output-file=bricolage-grotesque-800-latin.woff2
/tmp/ft/bin/pyftsubset /tmp/g.ttf --unicodes="$U" --layout-features='kern,liga,calt,tnum' --flavor=woff2 --output-file=geist-400-500-latin.woff2
/tmp/ft/bin/pyftsubset /tmp/m.ttf --unicodes="$U" --layout-features='kern,liga,calt' --flavor=woff2 --output-file=geist-mono-400-latin.woff2
```

If a new weight or character is needed (for example `font-semibold` body text),
add it to the instance range or `U`, then regenerate. Never swap in the full
Google font.
````

- [ ] **Step 4: Load the local fonts in `src/app/layout.tsx`**

Delete the line `import { Geist, Geist_Mono } from "next/font/google";`, then replace the `geist` and `geistMono` constants with:

```tsx
const geist = localFont({
  src: "../fonts/geist-400-500-latin.woff2",
  weight: "400 500",
  variable: "--font-geist",
  display: "swap",
});
const geistMono = localFont({
  src: "../fonts/geist-mono-400-latin.woff2",
  weight: "400",
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
});
```

- [ ] **Step 5: Replace the favicon and enable AVIF**

```bash
git rm src/app/favicon.ico
```

Create `src/app/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0B0D12"/><text x="9" y="45" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#E7E9EE" letter-spacing="-2">ND</text><circle cx="54" cy="43" r="4.5" fill="#FF8A3D"/></svg>
```

In `next.config.ts`, add this directly after `cacheComponents: true,`:

```ts
  // AVIF first (smaller), WebP fallback: parent spec §2.
  images: { formats: ["image/avif", "image/webp"] },
```

- [ ] **Step 6: Add the shared CSS classes**

In `src/app/globals.css`, insert this immediately **before** the line `/* ---------- Motion primitives ---------- */`:

```css
/* ---------- Repeated patterns ----------
   Named classes instead of long utility strings: the home page repeats these
   ~150 times, and every class string is sent twice (HTML + RSC payload). */
@layer components {
  .chip {
    border-radius: var(--radius-md);
    border: 1px solid var(--line);
    padding: 0.25rem 0.5rem;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--muted);
  }

  .kicker {
    font-family: var(--font-mono);
    font-size: var(--text-label);
    line-height: var(--text-label--line-height);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
  }

  .bullets > li {
    display: flex;
    gap: 0.625rem;
  }

  .bullets > li::before {
    content: "";
    margin-top: 0.55em;
    width: 0.375rem;
    height: 0.375rem;
    flex-shrink: 0;
    border-radius: 9999px;
    background: var(--accent);
  }

  .card-glow {
    pointer-events: none;
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 300ms;
    background: radial-gradient(
      380px circle at var(--mx, 50%) var(--my, 50%),
      color-mix(in srgb, var(--accent) 22%, transparent),
      transparent 60%
    );
  }

  .group:hover > .card-glow {
    opacity: 1;
  }

  .hover-lift {
    transition:
      transform var(--dur-base) var(--ease-spring),
      border-color 300ms;
  }

  .hover-lift:hover {
    transform: translateY(-3px);
    border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
  }
}

/* Experience timeline: the line draws downward as the list scrolls through. */
@keyframes draw-down {
  from {
    transform: scaleY(0);
  }
}

@supports (animation-timeline: view()) {
  .timeline-line {
    transform-origin: top;
    animation: draw-down linear both;
    animation-timeline: view();
    animation-range: entry 10% cover 60%;
  }
}
```

- [ ] **Step 7: Use them in `Chip` and `InteractiveCard`**

Replace `src/components/ui/chip.tsx`:

```tsx
export function Chip({ children }: { children: string }) {
  return <span className="chip">{children}</span>;
}
```

In `src/components/motion/pointer-effects.tsx`, replace the glow `<div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0 …" style={{ background: "radial-gradient(…)" }} />` inside `InteractiveCard` with:

```tsx
      <div aria-hidden="true" className="card-glow" />
```

- [ ] **Step 8: Verify**

```bash
npm run format && npm run lint && npm run typecheck && npm run test
npm run build && npx playwright test
```

Expected:
- **Unit tests:** pass (all existing tests).
- **E2E:** all pass, including the 2 new `home.spec.ts` tests.

- [ ] **Step 9: Checkpoint (no commit)**

Ledger: `Task 1: complete (uncommitted)`. Leave the changes in the working tree for the owner's end review.

---

### Task 2: Typed content module

**Files:**
- Create: `src/content/types.ts`, `src/content/en.ts`, `src/content/content.test.ts`

**Interfaces:**
- Produces:
  - `HomeContent`, `ExternalUrl`, `NavItem`, `Metric`, `Engagement`, `SkillGroup`, `Project`, `SideProject` and `ScreenshotKey` (`"support-ticket" | "payments-portal" | "mom-tribute"`)
  - `homeContent: HomeContent`
  - Top-level keys: `site`, `nav`, `hero`, `metrics`, `about`, `experience`, `skills`, `projects`, `credentials`, `contact`, `footer`, `newTab`, `techStack`

**Copy beyond spec §4, for owner review:**
- section headings: "Engineer first, interfaces always.", "Five client engagements, one standard.", "The toolkit behind the work.", "Built on my own time." and "Certifications & education."
- the About photo's alt text
- the screenshot alt texts, written from the actual images
- the labels "(opens in a new tab)" and "Tech stack"

- [ ] **Step 1: Write the failing test `src/content/content.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { homeContent } from "./en";

function collectStrings(
  value: unknown,
  path = "homeContent",
): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value))
    return value.flatMap((v, i) => collectStrings(v, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) =>
      collectStrings(v, `${path}.${k}`),
    );
  }
  return [];
}

const strings = collectStrings(homeContent);

describe("homeContent", () => {
  it("has no empty or whitespace-only strings", () => {
    const empty = strings.filter(([, s]) => s.trim() === "").map(([p]) => p);
    expect(empty).toEqual([]);
  });

  it("uses only absolute https URLs for external links", () => {
    const urls = strings.filter(([p]) => /(Url|url)$/.test(p));
    expect(urls.length).toBeGreaterThan(0);
    for (const [path, url] of urls) {
      expect(url, path).toMatch(/^https:\/\/[^\s]+$/);
    }
  });

  it("links the nav only to sections that the page renders", () => {
    const ids = ["about", "experience", "skills", "projects", "contact"];
    expect(homeContent.nav.map((n) => n.href)).toEqual(
      ids.map((id) => `#${id}`),
    );
  });

  it("describes five engagements, each with highlights and a stack", () => {
    expect(homeContent.experience.engagements).toHaveLength(5);
    for (const e of homeContent.experience.engagements) {
      expect(e.highlights.length, e.title).toBeGreaterThanOrEqual(2);
      expect(e.stack.length, e.title).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps the nine resume skill groups in resume order", () => {
    expect(homeContent.skills.groups.map((g) => g.name)).toEqual([
      "Frontend Development",
      "Backend & APIs",
      "Databases",
      "Testing",
      "Mobile Development",
      "Cloud & DevOps",
      "Monitoring & Analytics",
      "Project Tools",
      "AI-Assisted Development",
    ]);
  });

  it("never shows a phone number", () => {
    const phoneLike = strings.filter(([, s]) => /\+?\d[\d\s-]{8,}\d/.test(s));
    expect(phoneLike).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/content/content.test.ts`
Expected: FAIL with `Failed to resolve import "./en"`.

- [ ] **Step 3: Create `src/content/types.ts`**

```ts
/**
 * Shape of all home-page copy. Every locale module (en now; hi and te in
 * phase 5) must satisfy this type, so a missing translation fails `tsc`.
 */
export type ExternalUrl = `https://${string}`;

/** Screenshots live in src/images/; components map these keys to imports. */
export type ScreenshotKey =
  "support-ticket" | "payments-portal" | "mom-tribute";

export type NavItem = { label: string; href: `#${string}` };

export type Metric = { value: number; suffix?: string; label: string };

export type Engagement = {
  kicker: string;
  title: string;
  summary: string;
  highlights: string[];
  stack: string[];
};

export type SkillGroup = { name: string; items: string[]; accent?: boolean };

export type Project = {
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
};
```

- [ ] **Step 4: Create `src/content/en.ts`**

```ts
import type { HomeContent } from "./types";

/**
 * English home-page copy. Source of truth for every claim: the resume
 * (src/resume/). Clients are described by domain only (CLAUDE.md,
 * Confidentiality); src/test/confidentiality.test.ts scans this file.
 */
export const homeContent: HomeContent = {
  site: { homeLabel: "Naveen Dwarapudi, home", navLabel: "Sections" },
  nav: [
    { label: "About", href: "#about" },
    { label: "Experience", href: "#experience" },
    { label: "Skills", href: "#skills" },
    { label: "Projects", href: "#projects" },
    { label: "Contact", href: "#contact" },
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
};
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run src/content src/test/confidentiality.test.ts`
Expected: PASS, 8 tests (6 content + 2 confidentiality).

- [ ] **Step 6: Checkpoint (no commit)**

---

### Task 3: Link, image and frame primitives

**Files:**
- Create: `src/components/ui/new-tab.ts`, `src/components/ui/screenshot.tsx`, `src/components/ui/browser-frame.tsx`, `src/components/ui/links.test.tsx`, `src/test/accessible-name.ts`
- Modify: `src/components/ui/button.tsx` (full replace), `src/components/ui/text-link.tsx` (full replace)

**Interfaces:**
- Produces:
  - `newTabProps(label?: string)`: returns `{ target, rel }`, or `{}` when no label
  - `ButtonLink` and `TextLink` gain `newTabLabel?: string`
  - `Screenshot({ src: StaticImageData, alt, sizes, className? })`, which renders a lazy `<img>`
  - `BrowserFrame({ children })`
  - `nameWithSuffix(text, suffix): RegExp`

- [ ] **Step 1: Write the test helper and the failing test**

`src/test/accessible-name.ts`:

```ts
/**
 * jsdom's accessible-name algorithm drops whitespace at an sr-only span
 * boundary ("Live site(opens in a new tab)"), unlike browsers. Match names that
 * end in a screen-reader-only suffix with optional whitespace; the exact names
 * are asserted in Chromium by e2e/home.spec.ts.
 */
export function nameWithSuffix(text: string, suffix: string): RegExp {
  const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escape(text)}\\s*${escape(suffix)}$`);
}
```

`src/components/ui/links.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { nameWithSuffix } from "@/test/accessible-name";
import { ButtonLink } from "./button";
import { TextLink } from "./text-link";

const NEW_TAB = "(opens in a new tab)";

describe("new-tab links", () => {
  it("ButtonLink opens in a new tab and says so to screen readers", () => {
    render(
      <ButtonLink href="https://example.com" newTabLabel={NEW_TAB}>
        Live site
      </ButtonLink>,
    );
    const link = screen.getByRole("link", {
      name: nameWithSuffix("Live site", NEW_TAB),
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("TextLink opens in a new tab and says so to screen readers", () => {
    render(
      <TextLink href="https://example.com" newTabLabel={NEW_TAB}>
        Source
      </TextLink>,
    );
    const link = screen.getByRole("link", {
      name: nameWithSuffix("Source", NEW_TAB),
    });
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("same-tab links get no target or extra label", () => {
    render(<TextLink href="#top">Back to top</TextLink>);
    const link = screen.getByRole("link", { name: "Back to top" });
    expect(link).not.toHaveAttribute("target");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/ui/links.test.tsx`
Expected: FAIL. Without `newTabLabel` the links have no `target`, so the name matchers don't match.

- [ ] **Step 3: Implement**

`src/components/ui/new-tab.ts`:

```ts
/**
 * Props for a link that opens in a new tab. The visible text stays as is;
 * screen readers also hear `label` (e.g. "(opens in a new tab)").
 */
export function newTabProps(label: string | undefined) {
  return label ? { target: "_blank", rel: "noopener noreferrer" } : {};
}
```

`src/components/ui/button.tsx`:

```tsx
import type { ComponentProps, ReactNode } from "react";
import { newTabProps } from "./new-tab";

type Variant = "primary" | "secondary";

const base =
  "group inline-flex items-center gap-2 rounded-[10px] border px-5 py-3 text-[15px] font-medium transition-[transform,box-shadow,color,border-color] duration-300 ease-spring";

const variants: Record<Variant, string> = {
  primary:
    "border-transparent bg-accent text-on-accent shadow-[0_8px_30px_-10px_var(--accent)]",
  secondary:
    "border-line bg-surface/70 text-text backdrop-blur-sm hover:border-line-strong",
};

function Arrow({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="transition-transform duration-300 ease-spring group-hover:translate-x-1"
    >
      {children}
    </span>
  );
}

export function buttonClass(variant: Variant = "primary") {
  return `${base} ${variants[variant]}`;
}

export function Button({
  variant = "primary",
  arrow,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; arrow?: string }) {
  return (
    <button type="button" className={buttonClass(variant)} {...props}>
      {children}
      {arrow ? <Arrow>{arrow}</Arrow> : null}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  arrow,
  newTabLabel,
  children,
  ...props
}: ComponentProps<"a"> & {
  variant?: Variant;
  arrow?: string;
  /** When set, opens in a new tab and appends this text for screen readers. */
  newTabLabel?: string;
}) {
  return (
    <a
      className={buttonClass(variant)}
      {...newTabProps(newTabLabel)}
      {...props}
    >
      {children}
      {newTabLabel ? <span className="sr-only"> {newTabLabel}</span> : null}
      {arrow ? <Arrow>{arrow}</Arrow> : null}
    </a>
  );
}
```

`src/components/ui/text-link.tsx`:

```tsx
import type { ComponentProps } from "react";
import { newTabProps } from "./new-tab";

export function TextLink({
  className = "",
  newTabLabel,
  children,
  ...props
}: ComponentProps<"a"> & {
  /** When set, opens in a new tab and appends this text for screen readers. */
  newTabLabel?: string;
}) {
  return (
    <a
      className={`text-accent underline underline-offset-[3px] transition-colors hover:text-text ${className}`}
      {...newTabProps(newTabLabel)}
      {...props}
    >
      {children}
      {newTabLabel ? <span className="sr-only"> {newTabLabel}</span> : null}
    </a>
  );
}
```

`src/components/ui/screenshot.tsx`:

```tsx
import { getImageProps, type StaticImageData } from "next/image";

/**
 * Below-the-fold image: optimised AVIF/WebP via getImageProps (server-only, no
 * client JS), lazy-loaded, with intrinsic width/height so it causes no CLS.
 */
export function Screenshot({
  src,
  alt,
  sizes,
  className = "",
}: {
  src: StaticImageData;
  alt: string;
  sizes: string;
  className?: string;
}) {
  const { props } = getImageProps({ src, alt, sizes, loading: "lazy" });
  return (
    // eslint-disable-next-line @next/next/no-img-element -- props come from getImageProps (optimized, server-only, no client JS)
    <img {...props} alt={alt} className={`h-auto w-full ${className}`} />
  );
}
```

`src/components/ui/browser-frame.tsx`:

```tsx
import type { ReactNode } from "react";

/** Decorative browser chrome around a screenshot. */
export function BrowserFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface-2 shadow-[0_24px_60px_-30px_rgb(0_0_0/0.6)]">
      <div
        aria-hidden="true"
        className="flex gap-1.5 border-b border-line px-3 py-2.5"
      >
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="size-2.5 rounded-full bg-line-strong" />
        <span className="size-2.5 rounded-full bg-line-strong" />
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/components/ui`
Expected: PASS, with the existing UI tests plus 3 new ones.

- [ ] **Step 5: Checkpoint (no commit)**

---

### Task 4: CopyEmailButton

**Files:**
- Create: `src/components/contact/copy-email-button.tsx`, `src/components/contact/copy-email-button.test.tsx`

**Interfaces:**
- Consumes: `buttonClass` (Task 3 `button.tsx`).
- Produces: `CopyEmailButton({ email: string, labels: { idle, done, announced, failed } })`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CopyEmailButton } from "./copy-email-button";

const labels = {
  idle: "Copy email",
  done: "Copied",
  announced: "Email address copied",
  failed: "Copy failed — the address is me@example.com",
};

describe("CopyEmailButton", () => {
  it("copies the address and announces success", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    render(<CopyEmailButton email="me@example.com" labels={labels} />);
    await user.click(screen.getByRole("button", { name: "Copy email" }));
    expect(writeText).toHaveBeenCalledWith("me@example.com");
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Email address copied",
    );
  });

  it("announces the address when the clipboard is refused", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("denied"),
    );
    render(<CopyEmailButton email="me@example.com" labels={labels} />);
    await user.click(screen.getByRole("button", { name: "Copy email" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Copy failed — the address is me@example.com",
    );
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/contact`
Expected: FAIL with `Failed to resolve import "./copy-email-button"`.

- [ ] **Step 3: Implement**

```tsx
"use client";

import { useEffect, useState } from "react";
import { buttonClass } from "@/components/ui/button";

type Labels = { idle: string; done: string; announced: string; failed: string };
type Status = "idle" | "done" | "failed";

/** Copies the email address; the mailto link beside it works without JS. */
export function CopyEmailButton({
  email,
  labels,
}: {
  email: string;
  labels: Labels;
}) {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (status !== "done") return;
    const timer = window.setTimeout(() => setStatus("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setStatus("done");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <>
      <button type="button" onClick={copy} className={buttonClass("secondary")}>
        {status === "done" ? labels.done : labels.idle}
      </button>
      <span role="status" className="sr-only">
        {status === "done"
          ? labels.announced
          : status === "failed"
            ? labels.failed
            : ""}
      </span>
    </>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/components/contact`
Expected: PASS, 2 tests.

- [ ] **Step 5: Checkpoint (no commit)**

---

### Task 5: Section components

**Files:**
- Create: `src/lib/resume.ts`, `src/components/sections/{hero,about,experience,skills,projects,credentials,contact}.tsx`, `src/components/sections/sections.test.tsx`
- Modify: `vitest.config.mts` (full replace: adds the `staticImages` plugin)

**Interfaces:**
- Consumes: `HomeContent` (Task 2); `ButtonLink`, `TextLink`, `Screenshot`, `BrowserFrame` (Task 3); `CopyEmailButton` (Task 4); `.kicker`, `.bullets`, `.hover-lift`, `.timeline-line` (Task 1); and from phase 2, `Section`, `Heading`, `LineReveal`, `Chip`, `Card`, `InteractiveCard`, `Magnetic`, `Portrait`, `CountUp`, `HeroBackground`.
- Produces:
  - `RESUME_PATH = "/naveen-dwarapudi-resume.pdf"`
  - `Hero({ hero, metrics })`
  - `About({ about })`
  - `Experience({ experience, techStackLabel })`
  - `Skills({ skills })`
  - `Projects({ projects, newTabLabel, techStackLabel })`
  - `Credentials({ credentials })`
  - `Contact({ contact, newTabLabel })`
- Section ids: `about`, `experience`, `skills`, `projects`, `credentials`, `contact`, plus `top` on the hero wrapper.

Notes:
- **Project live links set `aria-label`.** Chromium inserts a space before a colon at an sr-only boundary ("Live site : …"), so the explicit label is the only way to get identical names in every engine.
- **The About photo is 280 px wide on phones and comes after the text.** Chrome fetched it early despite `loading="lazy"`, so its bytes count against LCP.
- **Skill cards are static `Card`s with `.hover-lift`, not `InteractiveCard`s.** That keeps nine client islands out of the RSC payload.

- [ ] **Step 1: Add the image plugin to `vitest.config.mts`**

```ts
import react from "@vitejs/plugin-react";
import { basename } from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, type Plugin } from "vitest/config";

/**
 * Next imports images as StaticImageData ({ src, width, height }); Vite would
 * import a URL string. Mirror Next's shape so components using getImageProps
 * render in tests. Dimensions are placeholders; tests never depend on them.
 */
function staticImages(): Plugin {
  return {
    name: "static-images",
    enforce: "pre",
    load(id) {
      if (!/\.(png|jpe?g|webp|avif)$/.test(id)) return null;
      const src = `/_next/static/media/${basename(id)}`;
      return `export default { src: ${JSON.stringify(src)}, width: 1200, height: 800 };`;
    },
  };
}

export default defineConfig({
  plugins: [staticImages(), tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
});
```

- [ ] **Step 2: Write the failing test `src/components/sections/sections.test.tsx`**

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
      <Experience experience={c.experience} techStackLabel={c.techStack} />,
    );
    expect(
      screen.getByText(c.experience.company, { exact: false }),
    ).toBeInTheDocument();
    const titles = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(titles).toEqual(c.experience.engagements.map((e) => e.title));
  });

  it("contains no links until case studies exist", () => {
    render(
      <Experience experience={c.experience} techStackLabel={c.techStack} />,
    );
    expect(screen.queryAllByRole("link")).toEqual([]);
  });

  it("states that client names are withheld", () => {
    render(
      <Experience experience={c.experience} techStackLabel={c.techStack} />,
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

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/components/sections`
Expected: FAIL with unresolved imports `./about`, `./contact` and the other sections.

- [ ] **Step 4: Implement**

`src/lib/resume.ts`:

```ts
/** Public path of the downloadable resume; next.config.ts marks it noindex. */
export const RESUME_PATH = "/naveen-dwarapudi-resume.pdf";
```

`src/components/sections/hero.tsx`:

```tsx
import portraitImage from "@/images/mypic-2.jpeg";
import { CountUp } from "@/components/motion/count-up";
import { HeroBackground } from "@/components/motion/hero-background";
import { Magnetic } from "@/components/motion/pointer-effects";
import { Portrait } from "@/components/motion/portrait";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Heading, LineReveal } from "@/components/ui/heading";
import { SectionLabel } from "@/components/ui/section-label";
import type { HomeContent } from "@/content/types";
import { RESUME_PATH } from "@/lib/resume";

export function Hero({
  hero,
  metrics,
}: {
  hero: HomeContent["hero"];
  metrics: HomeContent["metrics"];
}) {
  const [first, second, third] = hero.nameLines;
  return (
    <div
      id="top"
      className="relative -mt-[80px] overflow-hidden border-b border-line pt-[80px]"
    >
      <HeroBackground />
      <Container className="relative grid items-center gap-12 py-16 md:grid-cols-[1.25fr_0.75fr] md:py-20">
        <div>
          <div className="fade-up">
            <SectionLabel index="01">{hero.label}</SectionLabel>
          </div>
          <Heading level="display" className="mt-5 mb-6">
            <LineReveal
              lines={[
                {
                  text: first,
                  className: "text-[0.38em] tracking-[-0.02em] text-muted",
                },
                { text: second },
                { text: third, className: "text-accent" },
              ]}
            />
          </Heading>
          <p
            className="fade-up max-w-[620px] text-lg text-muted"
            style={{ "--delay": "350ms" } as React.CSSProperties}
          >
            {hero.role}
          </p>
          <div
            className="fade-up mt-8 flex flex-wrap gap-3.5"
            style={{ "--delay": "500ms" } as React.CSSProperties}
          >
            <Magnetic>
              <ButtonLink href="#experience" arrow="→">
                {hero.viewWork}
              </ButtonLink>
            </Magnetic>
            <Magnetic>
              <ButtonLink
                href={RESUME_PATH}
                download
                variant="secondary"
                arrow="↓"
              >
                {hero.downloadResume}
              </ButtonLink>
            </Magnetic>
          </div>
        </div>
        <div className="order-first justify-self-start md:order-none md:justify-self-end">
          <Portrait
            src={portraitImage}
            alt={hero.portraitAlt}
            badge={
              <>
                <span className="text-accent">{hero.badgeEmphasis}</span> ·{" "}
                {hero.badgeText}
              </>
            }
          />
        </div>
      </Container>
      <Container className="relative pb-16">
        <dl
          className="fade-up grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-line bg-line md:grid-cols-4"
          style={{ "--delay": "650ms" } as React.CSSProperties}
        >
          {metrics.map((m) => (
            <div
              key={m.label}
              className="flex flex-col-reverse bg-surface/85 p-5 backdrop-blur-md"
            >
              <dt className="mt-1 text-sm text-muted">{m.label}</dt>
              <dd className="font-display text-[clamp(1.75rem,4vw,2.625rem)] font-extrabold tracking-[-0.04em]">
                <CountUp value={m.value} delayMs={700} />
                {m.suffix ? (
                  <span className="text-accent">{m.suffix}</span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </div>
  );
}
```

`src/components/sections/about.tsx`:

```tsx
import photo from "@/images/mypic-1.jpeg";
import { Chip } from "@/components/ui/chip";
import { Heading } from "@/components/ui/heading";
import { Screenshot } from "@/components/ui/screenshot";
import { Section } from "@/components/ui/section";
import type { HomeContent } from "@/content/types";

export function About({ about }: { about: HomeContent["about"] }) {
  return (
    <Section id="about" index="02" label={about.label}>
      <div className="mt-4 grid items-start gap-10 md:grid-cols-[0.8fr_1.2fr]">
        <div className="scroll-reveal order-last w-[280px] max-w-full overflow-hidden rounded-[28px] border border-line md:order-first md:w-auto">
          <Screenshot
            src={photo}
            alt={about.photoAlt}
            sizes="(max-width: 768px) 280px, 400px"
          />
        </div>
        <div>
          <Heading level="h2" id="about-heading" className="scroll-reveal">
            {about.heading}
          </Heading>
          <p className="scroll-reveal mt-6 text-lg text-muted">{about.body}</p>
          <ul className="scroll-reveal mt-6 flex flex-wrap gap-2">
            {about.facts.map((fact) => (
              <li key={fact}>
                <Chip>{fact}</Chip>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
```

`src/components/sections/experience.tsx`:

```tsx
import { InteractiveCard } from "@/components/motion/pointer-effects";
import { Chip } from "@/components/ui/chip";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import type { HomeContent } from "@/content/types";

export function Experience({
  experience,
  techStackLabel,
}: {
  experience: HomeContent["experience"];
  techStackLabel: string;
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
            </InteractiveCard>
          </li>
        ))}
      </ol>
    </Section>
  );
}
```

`src/components/sections/skills.tsx`:

```tsx
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import type { HomeContent } from "@/content/types";

export function Skills({ skills }: { skills: HomeContent["skills"] }) {
  return (
    <Section id="skills" index="04" label={skills.label}>
      <Heading level="h2" id="skills-heading" className="scroll-reveal mt-4">
        {skills.heading}
      </Heading>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skills.groups.map((g, i) => (
          <li
            key={g.name}
            className="scroll-reveal"
            style={{ "--i": i % 3 } as React.CSSProperties}
          >
            <Card
              className={`hover-lift h-full ${g.accent ? "border-accent/60" : ""}`}
            >
              <Heading
                level="h3"
                className={g.accent ? "text-accent" : undefined}
              >
                {g.name}
              </Heading>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {g.items.map((item) => (
                  <li key={item}>
                    <Chip>{item}</Chip>
                  </li>
                ))}
              </ul>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
```

`src/components/sections/projects.tsx`:

```tsx
import momTribute from "@/images/mom-tribute.png";
import paymentsPortal from "@/images/payments-portal-app.png";
import supportTicket from "@/images/support-ticket-management-system.png";
import type { StaticImageData } from "next/image";
import { InteractiveCard } from "@/components/motion/pointer-effects";
import { BrowserFrame } from "@/components/ui/browser-frame";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Heading } from "@/components/ui/heading";
import { Screenshot } from "@/components/ui/screenshot";
import { Section } from "@/components/ui/section";
import { TextLink } from "@/components/ui/text-link";
import type { HomeContent, ScreenshotKey } from "@/content/types";

const screenshots: Record<ScreenshotKey, StaticImageData> = {
  "support-ticket": supportTicket,
  "payments-portal": paymentsPortal,
  "mom-tribute": momTribute,
};

export function Projects({
  projects,
  newTabLabel,
  techStackLabel,
}: {
  projects: HomeContent["projects"];
  newTabLabel: string;
  techStackLabel: string;
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
              <div className="mt-6">
                <ButtonLink
                  href={p.liveUrl}
                  arrow="↗"
                  newTabLabel={newTabLabel}
                  aria-label={`${projects.liveSite}: ${p.title} ${newTabLabel}`}
                >
                  {projects.liveSite}
                </ButtonLink>
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
              <p className="mt-1.5 font-display text-h3 font-extrabold tracking-[-0.02em]">
                {s.title}
              </p>
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

`src/components/sections/credentials.tsx`:

```tsx
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import type { HomeContent } from "@/content/types";

export function Credentials({
  credentials,
}: {
  credentials: HomeContent["credentials"];
}) {
  const { degree } = credentials;
  return (
    <Section id="credentials" index="06" label={credentials.label}>
      <Heading
        level="h2"
        id="credentials-heading"
        className="scroll-reveal mt-4"
      >
        {credentials.heading}
      </Heading>
      <div className="mt-10 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
        <Card className="scroll-reveal">
          <p className="kicker">{degree.year}</p>
          <Heading level="h3" className="mt-2.5">
            {degree.title}
          </Heading>
          <p className="mt-2 text-muted">{degree.school}</p>
        </Card>
        <Card className="scroll-reveal">
          <Heading level="h3">{credentials.certificationsHeading}</Heading>
          <div className="mt-4 space-y-5">
            {credentials.certifications.map((group) => (
              <div key={group.issuer}>
                <p className="font-mono text-label tracking-[0.1em] text-muted uppercase">
                  {group.issuer}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {group.titles.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Section>
  );
}
```

`src/components/sections/contact.tsx`:

```tsx
import { CopyEmailButton } from "@/components/contact/copy-email-button";
import { Magnetic } from "@/components/motion/pointer-effects";
import { ButtonLink } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import type { HomeContent } from "@/content/types";

export function Contact({
  contact,
  newTabLabel,
}: {
  contact: HomeContent["contact"];
  newTabLabel: string;
}) {
  return (
    <Section id="contact" index="07" label={contact.label}>
      <Heading
        level="h2"
        id="contact-heading"
        className="scroll-reveal mt-4 text-[clamp(2.5rem,7vw,5rem)]"
      >
        {contact.heading}
      </Heading>
      <p className="scroll-reveal mt-4 text-lg text-muted">{contact.line}</p>
      <p className="scroll-reveal mt-8">
        <a
          href={`mailto:${contact.email}`}
          className="font-display text-[clamp(1.25rem,4vw,2rem)] font-extrabold tracking-[-0.02em] break-all text-accent underline-offset-4 hover:underline"
        >
          {contact.email}
        </a>
      </p>
      <div className="scroll-reveal mt-6 flex flex-wrap gap-3">
        <CopyEmailButton email={contact.email} labels={contact.copy} />
        <Magnetic>
          <ButtonLink
            href={contact.linkedin.url}
            variant="secondary"
            arrow="↗"
            newTabLabel={newTabLabel}
          >
            {contact.linkedin.label}
          </ButtonLink>
        </Magnetic>
        <Magnetic>
          <ButtonLink
            href={contact.github.url}
            variant="secondary"
            arrow="↗"
            newTabLabel={newTabLabel}
          >
            {contact.github.label}
          </ButtonLink>
        </Magnetic>
      </div>
      <p className="mt-6 font-mono text-label tracking-[0.1em] text-muted uppercase">
        {contact.location}
      </p>
    </Section>
  );
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run src/components/sections`
Expected: PASS, 10 tests.

- [ ] **Step 6: Checkpoint (no commit)**

---

### Task 6: Page, header, footer, resume and E2E coverage

**Files:**
- Create: `src/components/site/copyright-year.tsx`, `src/components/site/copyright-year.test.tsx`, `src/components/site/site-footer.tsx`, `public/naveen-dwarapudi-resume.pdf`
- Modify: `src/components/site/site-header.tsx` (full replace), `src/app/layout.tsx` (full replace), `src/app/page.tsx` (full replace), `src/app/page.test.tsx` (full replace), `next.config.ts` (full replace), `e2e/home.spec.ts` (full replace), `e2e/motion.spec.ts` (two edits)

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `SiteHeader({ site, nav })`
  - `SiteFooter({ footer, newTabLabel })`
  - `CopyrightYear()` (async, `"use cache"`)

- [ ] **Step 1: Write the failing tests**

Replace `src/app/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home", () => {
  it("renders the full name as the only h1", () => {
    render(<Home />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveAccessibleName(
      "Bhavani Sankar Naveen Dwarapudi.",
    );
  });

  it("wraps content in a main landmark that the skip link targets", () => {
    render(<Home />);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });

  it("renders every section the header links to, in order", () => {
    const { container } = render(<Home />);
    const ids = [...container.querySelectorAll("section[id]")].map((s) => s.id);
    expect(ids).toEqual([
      "about",
      "experience",
      "skills",
      "projects",
      "credentials",
      "contact",
    ]);
  });

  it("shows all four metrics with their final values", () => {
    render(<Home />);
    for (const label of [
      "years in production",
      "client engagements",
      "faster component builds",
      "industries",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("30")).toBeInTheDocument();
  });
});
```

Create `src/components/site/copyright-year.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CopyrightYear } from "./copyright-year";

describe("CopyrightYear", () => {
  it("renders the current year", async () => {
    const { container } = render(await CopyrightYear());
    expect(container.textContent).toBe(String(new Date().getFullYear()));
  });
});
```

Replace `e2e/home.spec.ts`. This keeps the Task 1 tests:

```ts
import { expect, test } from "@playwright/test";

const NEW_TAB = "(opens in a new tab)";

test("each header link scrolls to its section", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Sections" });
  for (const [label, id] of [
    ["About", "about"],
    ["Experience", "experience"],
    ["Skills", "skills"],
    ["Projects", "projects"],
    ["Contact", "contact"],
  ] as const) {
    await nav.getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
});

test("the header nav is hidden on phones", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Sections" })).toBeHidden();
});

test("the resume downloads as a PDF that search engines must not index", async ({
  request,
}) => {
  const res = await request.get("/naveen-dwarapudi-resume.pdf");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");
  expect(res.headers()["x-robots-tag"]).toBe("noindex");
});

test("the home page itself stays indexable", async ({ request }) => {
  const res = await request.get("/");
  expect(res.headers()["x-robots-tag"]).toBeUndefined();
});

test("external links announce that they open a new tab", async ({ page }) => {
  await page.goto("/");
  for (const name of [
    `Live site: Support Ticket Management System ${NEW_TAB}`,
    `Live site: Payments Portal ${NEW_TAB}`,
    `Live site: Mom Tribute ${NEW_TAB}`,
    `LinkedIn ${NEW_TAB}`,
    `GitHub ${NEW_TAB}`,
    `Source on GitHub ${NEW_TAB}`,
  ]) {
    const link = page.getByRole("link", { name, exact: true });
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
});

test("copy email puts the address on the clipboard", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await page.getByRole("button", { name: "Copy email" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "Email address copied" }),
  ).toBeAttached();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "dbsnaveen@gmail.com",
  );
});

test("the footer shows the full name and current year", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("contentinfo")).toContainText(
    `© ${new Date().getFullYear()} Bhavani Sankar Naveen Dwarapudi`,
  );
});

test("no phone number appears anywhere on the page", async ({ page }) => {
  await page.goto("/");
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/\+?\d[\d\s-]{8,}\d/);
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
});

test("images are served as AVIF to browsers that accept it", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const src = await page
    .getByRole("img", { name: "Portrait of Bhavani Sankar Naveen Dwarapudi" })
    .evaluate((img: HTMLImageElement) => img.currentSrc);
  const res = await request.get(src, {
    headers: { accept: "image/avif,image/webp,*/*" },
  });
  expect(res.headers()["content-type"]).toBe("image/avif");
});

test("the site icon is the small SVG monogram, not the default favicon", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const href = await page
    .locator('link[rel="icon"]')
    .first()
    .getAttribute("href");
  expect(href).toMatch(/\/icon\.svg/);
  expect((await request.get("/favicon.ico")).status()).toBe(404);
});
```

In `e2e/motion.spec.ts`, make two edits:
- Change `page.getByText("client engagements")` to `page.getByText("client engagements", { exact: true })`.
- Change the heading name `"Production apps, not side quests."` to `"Five client engagements, one standard."`.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/app src/components/site`
Expected: FAIL. `./copyright-year` is unresolved, and the page has no `section[id]` list.

- [ ] **Step 3: Implement**

`src/components/site/copyright-year.tsx`:

```tsx
/**
 * Current year for the footer. Cache Components forbids `new Date()` during
 * prerender, so the value is cached ("use cache"): the page stays static and
 * the year refreshes on redeploy or cache revalidation.
 */
export async function CopyrightYear() {
  "use cache";
  return <>{new Date().getFullYear()}</>;
}
```

`src/components/site/site-footer.tsx`:

```tsx
import { Container } from "@/components/ui/container";
import { TextLink } from "@/components/ui/text-link";
import { CopyrightYear } from "./copyright-year";
import type { HomeContent } from "@/content/types";

export function SiteFooter({
  footer,
  newTabLabel,
}: {
  footer: HomeContent["footer"];
  newTabLabel: string;
}) {
  return (
    <footer className="border-t border-line">
      <Container className="flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-muted">
        <p>
          © <CopyrightYear /> {footer.name} · {footer.builtWith} ·{" "}
          <TextLink href={footer.sourceUrl} newTabLabel={newTabLabel}>
            {footer.sourceLabel}
          </TextLink>
        </p>
        <TextLink href="#top">{footer.backToTop}</TextLink>
      </Container>
    </footer>
  );
}
```

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
        <a
          href="/"
          aria-label={site.homeLabel}
          className="font-display text-xl font-extrabold tracking-[-0.04em]"
        >
          ND<span className="text-accent">.</span>
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

`src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SkipLink } from "@/components/ui/skip-link";
import { homeContent } from "@/content/en";
import { siteUrl } from "@/lib/site-url";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const geist = localFont({
  src: "../fonts/geist-400-500-latin.woff2",
  weight: "400 500",
  variable: "--font-geist",
  display: "swap",
});
const geistMono = localFont({
  src: "../fonts/geist-mono-400-latin.woff2",
  weight: "400",
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
});
const bricolage = localFont({
  src: "../fonts/bricolage-grotesque-800-latin.woff2",
  weight: "800",
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Naveen Dwarapudi | React.js & React Native Engineer",
  description:
    "Portfolio of Bhavani Sankar Naveen Dwarapudi, a React.js and React Native engineer with 4+ years building production web and mobile applications.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${bricolage.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SkipLink />
        <SiteHeader site={homeContent.site} nav={homeContent.nav} />
        {children}
        <SiteFooter
          footer={homeContent.footer}
          newTabLabel={homeContent.newTab}
        />
      </body>
    </html>
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
      <Experience experience={c.experience} techStackLabel={c.techStack} />
      <Skills skills={c.skills} />
      <Projects
        projects={c.projects}
        newTabLabel={c.newTab}
        techStackLabel={c.techStack}
      />
      <Credentials credentials={c.credentials} />
      <Contact contact={c.contact} newTabLabel={c.newTab} />
    </main>
  );
}
```

`next.config.ts`:

```ts
import type { NextConfig } from "next";
import { RESUME_PATH } from "./src/lib/resume";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // AVIF first (smaller), WebP fallback: parent spec §2.
  images: { formats: ["image/avif", "image/webp"] },
  // The resume names clients (owner-approved); keep it out of search results.
  async headers() {
    return [
      {
        source: RESUME_PATH,
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
```

Copy the resume:

```bash
mkdir -p public && cp "src/resume/Naveen Dwarapudi Resume.pdf" public/naveen-dwarapudi-resume.pdf
```

- [ ] **Step 4: Verify**

```bash
npm run format && npm run format:check && npm run lint && npm run typecheck && npm run test
npm run build && npx playwright test
```

Expected:
- **Unit tests:** 79 passed.
- **E2E:** 27 passed.
- **Build:** both routes `○ (Static)`, with Revalidate 15m and Expire 1y (from `"use cache"`).

- [ ] **Step 5: Checkpoint (no commit)**

---

### Task 7: Budgets and docs

**Files:**
- Modify: `CLAUDE.md`, `docs/superpowers/specs/2026-10-09-home-sections-design.md` (decisions log)

- [ ] **Step 1: Run Lighthouse CI twice**

```bash
npm run build
for k in 1 2; do rm -rf .lighthouseci
CHROME_PATH="$(ls -d ~/Library/Caches/ms-playwright/chromium-*/chrome-mac*/*.app/Contents/MacOS/* | head -1)" \
  npx lhci autorun --upload.target=filesystem --upload.outputDir=.lighthouseci/reports; done
```

Expected:
- Both autoruns pass.
- **Every individual run** has LCP ≤ 2500 ms (prototype: 2323–2479 ms), script about 140,447 B, and CLS ≤ 0.001.
- If any run exceeds the budget, look for bytes requested before LCP (`network-requests`). **Do not edit `lighthouserc.json`.**

- [ ] **Step 2: Update the docs**

Append these rows to the §7 decisions table in `docs/superpowers/specs/2026-10-09-home-sections-design.md`:

```markdown
| Fonts | local subsets of Geist (400–500), Geist Mono (400), Bricolage (800) | the full Google Geist fonts cost ~2 simulated round trips of LCP |
| Favicon | 309 B `icon.svg` monogram | the scaffold's 15 KB `favicon.ico` loaded before LCP |
| Image format | AVIF then WebP | hero photo 7.3 → 5.5 KB; parent spec §2 |
| About photo on phones | 280 px wide, after the text | Chrome fetched it before LCP despite `loading="lazy"` |
| Skill cards | static `Card` + CSS `.hover-lift` | keeps 9 client islands out of the RSC payload |
| Project link names | explicit `aria-label` | identical accessible names across engines |
| Footer year | `"use cache"` `CopyrightYear` | Cache Components forbids `new Date()` in prerender |
```

In `CLAUDE.md`, under `## Conventions`, replace the display-font bullet with:

```markdown
- Fonts are local subsets (Bricolage 800, Geist 400–500, Geist Mono 400): regenerate per `src/fonts/README.md`, never swap in the full Google fonts. New weights or glyphs mean regenerating.
- Page copy lives in `src/content/en.ts` (typed by `src/content/types.ts`); components never hard-code user-visible text.
- Images: `Screenshot` (lazy) or `Portrait` (eager) via `getImageProps`; AVIF is enabled. Mind bytes fetched before LCP, since Chrome may fetch lazy images early.
- External links: `newTabLabel={homeContent.newTab}` on `ButtonLink`/`TextLink`; if the visible text is generic ("Live site"), add an explicit `aria-label`.
- Cache Components: no `new Date()` / `Math.random()` in render; use `"use cache"` (see `CopyrightYear`).
```

- [ ] **Step 3: Final verification**

```bash
npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build && npx playwright test
```

Expected: everything passes. Then stop: the owner reviews the full diff before any commit.
