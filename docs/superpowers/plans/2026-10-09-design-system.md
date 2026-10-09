# Design System & Motion Toolkit (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the visual foundation for the site: the burnt-orange colour and type tokens, an OS-following theme engine with no flash, the motion toolkit and the building blocks. The placeholder home page is restyled into the approved animated hero (photo, full name, count-up metrics) as the showcase.

**Architecture:** Colours are CSS custom properties exposed to Tailwind v4 through `@theme inline`.
- **Theme:** dark tokens are the base. Light tokens apply through `prefers-color-scheme` (no JS) or `[data-theme="light"]`. An inline `<head>` script applies a stored choice before first paint.
- **Motion:** CSS wherever possible (keyframes, `animation-timeline: view()`). Small client components handle the rest (count-up, magnetic pull, spotlight/tilt, parallax, theme wipe).
- **Script budget:** `next/link` and the `next/image` component are deliberately **not** used, which saves about 9 KB. Links are plain `<a>`, and the photo uses server-side `getImageProps()`.

**Tech Stack:** Next.js 16.4 (App Router, Turbopack), React 19.3, Tailwind CSS 4, `next/font` (Geist and Geist Mono from Google; Bricolage Grotesque from a local subset), Vitest 5 with jsdom and RTL, Playwright with axe, Lighthouse CI.

**Spec:** `docs/superpowers/specs/2026-10-09-design-system-design.md` (parent: `docs/superpowers/specs/2026-09-19-nextjs-portfolio-design.md`)

**Prototype evidence:** every file in this plan was built and verified in a throwaway worktree before the plan was written.
- **Unit tests:** 53/53 passed.
- **E2E:** 13/13 passed.
- **Lighthouse (3 runs):** LCP 2324–2335 ms, script 140,072 B, CLS 0.0002, performance 0.98.

## Global Constraints

- Colours (dark / light): `bg #0B0D12 / #F6F7F9`, `surface #141821 / #FFFFFF`, `surface-2 #1B202B / #EEF0F4`, `line #262B36 / #DDE1E8`, `line-strong #646C7D / #7E8798`, `text #E7E9EE / #12151C`, `muted #9AA3B2 / #566070`, `accent #FF8A3D / #B4470F`, `on-accent #0B0D12 / #FFFFFF`.
- Theme: the first visit follows the OS setting; dark if there is no preference. A stored toggle choice (`localStorage["theme"]` = `"light"` | `"dark"`) wins. The wrong theme never flashes.
- Fonts: Bricolage Grotesque **800 only** (local subset, OFL) for display and headings, Geist for body, Geist Mono (not preloaded) for labels.
- Name: the full name **"Bhavani Sankar Naveen Dwarapudi"** where space allows (hero h1, alt text); **"Naveen Dwarapudi"** where tight (`<title>`, logo label).
- Confidentiality: never name a client, client product or client site. Describe work by domain only.
- Motion: every effect honours `prefers-reduced-motion`. Pointer effects only run on `(hover: hover) and (pointer: fine)`. No effect hides content when JS fails.
- Budgets, unchanged in `lighthouserc.json`: performance ≥ 0.95, LCP ≤ 2500 ms, CLS ≤ 0.02, script ≤ 153,600 B. **Never raise them.** Phase 2 client code must stay ≤ 10 KB over the 137,431 B framework baseline.
- Do not add `next/link`, the `next/image` `<Image>` component, `next-themes`, or the Motion library.
- Commits use conventional messages and end with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- Branch: `feat/design-system` (it already exists and holds the spec commits).

## Review Focus

1. **A garbage stored theme value** (`"blue"`, `""`): it should be ignored and the OS should decide. Pinned in Task 2 (`resolveTheme` and `themeInitScript` tests).
2. **Touch devices (coarse pointer):** cards must never tilt and buttons never shift. The glow may still follow touches. Pinned in Task 5.
3. **App JavaScript fails to load:** the full name, metrics, photo and work cards must all be visible, and a stored theme still applies. Pinned in Task 2 (no-flash with chunks blocked) and Task 7 (`motion.spec.ts`).
4. **The OS theme changes while the page is open** with nothing stored: the toggle's label must follow. Pinned in Task 3.
5. **Narrow phones (320 px):** no horizontal scroll from the photo badge. Pinned in Task 7.

---

## File Structure

| Path | Responsibility |
|---|---|
| `src/app/globals.css` | Tokens (dark base, light via OS or attribute), Tailwind `@theme` mapping, base styles, grain, focus ring, motion keyframes and utilities, reduced-motion kill switch |
| `src/app/layout.tsx` | Fonts, metadata, inline theme script, `SkipLink`, `SiteHeader` |
| `src/fonts/bricolage-grotesque-800-latin.woff2`, `src/fonts/OFL.txt`, `src/fonts/README.md` | Subset display font, its licence, regeneration steps |
| `src/lib/theme.ts` | `Theme`, `THEME_STORAGE_KEY`, `isTheme`, `resolveTheme`, `nextTheme`, `themeInitScript` |
| `src/lib/motion.ts` | `prefersReducedMotion`, `canHoverPrecisely`, `easeOutQuart` |
| `src/components/theme/theme-toggle.tsx` | Client toggle with View Transitions circular wipe |
| `src/components/site/site-header.tsx` | "ND." monogram and toggle |
| `src/components/ui/*` | `Container`, `SectionLabel`, `Section`, `Heading` + `LineReveal`, `Button` / `ButtonLink`, `Chip`, `SkipLink` |
| `src/components/motion/count-up.tsx` | Client count-up (SSR final value) |
| `src/components/motion/pointer-effects.tsx` | Client `Magnetic`, `InteractiveCard`, `Parallax` |
| `src/components/motion/hero-background.tsx` | CSS gradient mesh |
| `src/components/motion/portrait.tsx` | Photo via `getImageProps`, ring, glow, curtain reveal, badge |
| `src/app/page.tsx` | Showcase hero and sample work section |
| `src/test/setup.ts` | jsdom stand-ins: `mockMatchMedia`, no-op `IntersectionObserver`, per-test reset |
| `e2e/theme.spec.ts`, `e2e/motion.spec.ts`, `e2e/smoke.spec.ts` | Theme, motion and smoke/axe/overflow checks |

---

### Task 1: Tokens, fonts, base styles and test infrastructure

**Files:**
- Create: `src/fonts/bricolage-grotesque-800-latin.woff2`, `src/fonts/OFL.txt`, `src/fonts/README.md`, `e2e/theme.spec.ts`
- Modify: `src/app/globals.css` (full replace), `src/app/layout.tsx`, `src/test/setup.ts` (full replace)

**Interfaces:**
- Produces:
  - Tailwind colour utilities: `bg-bg`, `bg-surface`, `bg-surface-2`, `border-line`, `border-line-strong`, `text-text`, `text-muted`, `text-accent`, `bg-accent`, `text-on-accent`.
  - Font utilities: `font-sans`, `font-mono`, `font-display`.
  - Text sizes: `text-display`, `text-h2`, `text-h3`, `text-label`.
  - Easings: `ease-out-expo`, `ease-spring`.
  - CSS classes: `.line-reveal-line`, `.fade-up` (reads `--delay`), `.scroll-reveal` (reads `--i`).
  - Keyframes: `rise`, `fade-up`, `mesh-drift`, `ring-spin` (with `@property --ring-angle`), `curtain`, `bob`.
  - Font CSS variables: `--font-geist`, `--font-geist-mono`, `--font-bricolage`.
  - Test helper: `mockMatchMedia(matching?: string[]): void`, exported from `src/test/setup.ts`.

- [ ] **Step 1: Write the failing E2E test**

Create `e2e/theme.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

const DARK_BG = "rgb(11, 13, 18)";
const LIGHT_BG = "rgb(246, 247, 249)";

function htmlBackground() {
  return getComputedStyle(document.documentElement).backgroundColor;
}

test("follows the OS when no choice is stored", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  expect(await page.evaluate(htmlBackground)).toBe(LIGHT_BG);

  await page.emulateMedia({ colorScheme: "dark" });
  expect(await page.evaluate(htmlBackground)).toBe(DARK_BG);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run build && npx playwright test e2e/theme.spec.ts`
Expected: FAIL. The scaffold's `html` has no background set (`rgba(0, 0, 0, 0)`), and the body uses `#ffffff` / `#0a0a0a`.

- [ ] **Step 3: Generate the subset display font**

Bricolage Grotesque is OFL with no Reserved Font Name, so a subset may keep its name provided the licence ships with it. Only weight 800 and Latin glyphs are used; that is about 17 KB, against 41 KB for the Google variable font. Measured in the prototype, the full font cost about 150 ms of LCP.

```bash
SCR="$(mktemp -d)"
python3 -m venv "$SCR/venv" && "$SCR/venv/bin/pip" install -q fonttools brotli
curl -sL -o "$SCR/src.ttf" "https://github.com/google/fonts/raw/main/ofl/bricolagegrotesque/BricolageGrotesque%5Bopsz,wdth,wght%5D.ttf"
"$SCR/venv/bin/fonttools" varLib.instancer "$SCR/src.ttf" wght=800 opsz=96 wdth=100 -o "$SCR/b800.ttf" -q
mkdir -p src/fonts
"$SCR/venv/bin/pyftsubset" "$SCR/b800.ttf" \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+20B9" \
  --layout-features='kern,liga,calt' --flavor=woff2 \
  --output-file=src/fonts/bricolage-grotesque-800-latin.woff2
curl -sL -o src/fonts/OFL.txt https://raw.githubusercontent.com/google/fonts/main/ofl/bricolagegrotesque/OFL.txt
ls -l src/fonts
```

Expected: `bricolage-grotesque-800-latin.woff2` is about 17,000 bytes, and `OFL.txt` starts with `Copyright 2022 The Bricolage Grotesque Project Authors`.

Create `src/fonts/README.md`:

````markdown
# Fonts

`bricolage-grotesque-800-latin.woff2` is Bricolage Grotesque (SIL OFL 1.1, see
`OFL.txt`; no Reserved Font Name), instanced to wght 800 / opsz 96 / wdth 100 and
subset to Latin. This keeps the display font around 17 KB instead of 41 KB, which
protects the LCP budget. To regenerate it:

```bash
python3 -m venv /tmp/ft && /tmp/ft/bin/pip install fonttools brotli
curl -sL -o /tmp/src.ttf "https://github.com/google/fonts/raw/main/ofl/bricolagegrotesque/BricolageGrotesque%5Bopsz,wdth,wght%5D.ttf"
/tmp/ft/bin/fonttools varLib.instancer /tmp/src.ttf wght=800 opsz=96 wdth=100 -o /tmp/b800.ttf
/tmp/ft/bin/pyftsubset /tmp/b800.ttf --unicodes="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+20B9" --layout-features='kern,liga,calt' --flavor=woff2 --output-file=bricolage-grotesque-800-latin.woff2
```
````

- [ ] **Step 4: Replace `src/app/globals.css`**

```css
@import "tailwindcss";

/* ---------- Tokens: dark is the base; light via OS (no stored choice) or toggle ---------- */
:root {
  color-scheme: dark;
  --bg: #0b0d12;
  --surface: #141821;
  --surface-2: #1b202b;
  --line: #262b36;
  --line-strong: #646c7d;
  --text: #e7e9ee;
  --muted: #9aa3b2;
  --accent: #ff8a3d;
  --on-accent: #0b0d12;
  --glow-1: rgb(255 138 61 / 0.3);
  --glow-2: rgb(255 94 58 / 0.18);
  --glow-3: rgb(120 140 255 / 0.12);
  --grain-opacity: 0.06;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --dur-fast: 200ms;
  --dur-base: 450ms;
  --dur-slow: 900ms;
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    color-scheme: light;
    --bg: #f6f7f9;
    --surface: #ffffff;
    --surface-2: #eef0f4;
    --line: #dde1e8;
    --line-strong: #7e8798;
    --text: #12151c;
    --muted: #566070;
    --accent: #b4470f;
    --on-accent: #ffffff;
    --glow-1: rgb(255 138 61 / 0.28);
    --glow-2: rgb(255 170 90 / 0.22);
    --glow-3: rgb(120 140 255 / 0.1);
    --grain-opacity: 0.035;
  }
}

:root[data-theme="light"] {
  color-scheme: light;
  --bg: #f6f7f9;
  --surface: #ffffff;
  --surface-2: #eef0f4;
  --line: #dde1e8;
  --line-strong: #7e8798;
  --text: #12151c;
  --muted: #566070;
  --accent: #b4470f;
  --on-accent: #ffffff;
  --glow-1: rgb(255 138 61 / 0.28);
  --glow-2: rgb(255 170 90 / 0.22);
  --glow-3: rgb(120 140 255 / 0.1);
  --grain-opacity: 0.035;
}

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-line: var(--line);
  --color-line-strong: var(--line-strong);
  --color-text: var(--text);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --color-on-accent: var(--on-accent);

  --font-sans: var(--font-geist), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
  --font-display: var(--font-bricolage), var(--font-geist), sans-serif;

  --text-display: clamp(3rem, 9vw, 6.5rem);
  --text-display--line-height: 0.95;
  --text-h2: clamp(1.875rem, 4.5vw, 3rem);
  --text-h2--line-height: 1.05;
  --text-h3: 1.375rem;
  --text-h3--line-height: 1.2;
  --text-label: 0.75rem;
  --text-label--line-height: 1.4;

  --ease-out-expo: var(--ease-out);
  --ease-spring: var(--ease-spring);
}

/* ---------- Base ---------- */
html {
  background: var(--bg);
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  line-height: 1.6;
}

/* Grain overlay: inline SVG noise, no download. */
body::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
  opacity: var(--grain-opacity);
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}

/* ---------- Motion primitives ---------- */
@keyframes rise {
  from {
    transform: translateY(105%);
  }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
}

@keyframes mesh-drift {
  to {
    transform: rotate(360deg) scale(1.05);
  }
}

@property --ring-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

@keyframes ring-spin {
  to {
    --ring-angle: 360deg;
  }
}

@keyframes curtain {
  to {
    transform: translateY(-101%);
  }
}

@keyframes bob {
  50% {
    transform: translateY(-6px);
  }
}

/* Heading line reveal: each line slides up inside its mask. */
.line-reveal-line {
  display: block;
  overflow: hidden;
  padding-bottom: 0.06em;
}

.line-reveal-line > span {
  display: inline-block;
  animation: rise 0.9s var(--ease-out) both;
  animation-delay: calc(var(--i, 0) * 90ms);
}

.fade-up {
  animation: fade-up 0.8s var(--ease-out) both;
  animation-delay: var(--delay, 0ms);
}

/* Scroll reveal: CSS-only, browsers without view timelines show content statically. */
@supports (animation-timeline: view()) {
  .scroll-reveal {
    animation: fade-up linear both;
    animation-timeline: view();
    animation-range: entry calc(var(--i, 0) * 4%) entry
      calc(60% + var(--i, 0) * 4%);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

- [ ] **Step 5: Load the fonts in `src/app/layout.tsx`**

Replace the whole file with the version below. It loads the three fonts and uses the full name in the description. The theme script and header arrive in Tasks 2 and 3.

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geist.variable} ${geistMono.variable} ${bricolage.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Replace `src/test/setup.ts` (jsdom stand-ins used from Task 3 on)**

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom has no matchMedia or IntersectionObserver. Default: no media query
// matches; tests override with mockMatchMedia().
function createMatchMedia(matching: string[]) {
  return (query: string): MediaQueryList => ({
    matches: matching.includes(query),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

export function mockMatchMedia(matching: string[] = []) {
  window.matchMedia = createMatchMedia(matching);
}

mockMatchMedia();

class NoopIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
vi.stubGlobal("IntersectionObserver", NoopIntersectionObserver);

afterEach(() => {
  cleanup();
  mockMatchMedia();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  vi.restoreAllMocks();
});
```

- [ ] **Step 7: Verify**

```bash
npm run format && npm run lint && npm run typecheck && npm run test
npm run build && npx playwright test
```

Expected:
- **Unit tests:** pass (the 12 existing tests).
- **E2E:** all pass, including `follows the OS when no choice is stored`, plus the existing smoke and axe tests in both schemes.

- [ ] **Step 8: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/fonts src/test/setup.ts e2e/theme.spec.ts
git commit -m "feat: add design tokens, fonts and OS-following theme styles

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Theme logic and the no-flash inline script

**Files:**
- Create: `src/lib/theme.ts`, `src/lib/theme.test.ts`
- Modify: `src/app/layout.tsx`, `e2e/theme.spec.ts` (append a test)

**Interfaces:**
- Consumes: the `[data-theme="light" | "dark"]` selectors in `globals.css` (Task 1).
- Produces:
  - `type Theme = "light" | "dark"`
  - `THEME_STORAGE_KEY = "theme"`
  - `isTheme(value: unknown): value is Theme`
  - `resolveTheme(stored: string | null, prefersLight: boolean): Theme`
  - `nextTheme(current: Theme): Theme`
  - `themeInitScript: string`

- [ ] **Step 1: Write the failing unit test `src/lib/theme.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { isTheme, nextTheme, resolveTheme, themeInitScript } from "./theme";

describe("resolveTheme", () => {
  it("uses a stored light choice even when the OS prefers dark", () => {
    expect(resolveTheme("light", false)).toBe("light");
  });

  it("uses a stored dark choice even when the OS prefers light", () => {
    expect(resolveTheme("dark", true)).toBe("dark");
  });

  it("follows the OS when nothing is stored", () => {
    expect(resolveTheme(null, true)).toBe("light");
    expect(resolveTheme(null, false)).toBe("dark");
  });

  it("ignores a garbage stored value and follows the OS", () => {
    expect(resolveTheme("blue", true)).toBe("light");
    expect(resolveTheme("", false)).toBe("dark");
  });
});

describe("nextTheme", () => {
  it("flips between light and dark", () => {
    expect(nextTheme("dark")).toBe("light");
    expect(nextTheme("light")).toBe("dark");
  });
});

describe("isTheme", () => {
  it("accepts only light and dark", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("system")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });
});

describe("themeInitScript", () => {
  function run(stored: string | null) {
    document.documentElement.removeAttribute("data-theme");
    if (stored === null) localStorage.removeItem("theme");
    else localStorage.setItem("theme", stored);
    new Function(themeInitScript)();
    return document.documentElement.getAttribute("data-theme");
  }

  it("applies a stored valid choice", () => {
    expect(run("light")).toBe("light");
    expect(run("dark")).toBe("dark");
  });

  it("leaves the attribute unset when nothing valid is stored", () => {
    expect(run(null)).toBeNull();
    expect(run("blue")).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/theme.test.ts`
Expected: FAIL with `Failed to resolve import "./theme"`.

- [ ] **Step 3: Implement `src/lib/theme.ts`**

```ts
export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/** Effective theme: a stored choice wins; otherwise the OS preference; otherwise dark. */
export function resolveTheme(
  stored: string | null,
  prefersLight: boolean,
): Theme {
  if (isTheme(stored)) return stored;
  return prefersLight ? "light" : "dark";
}

export function nextTheme(current: Theme): Theme {
  return current === "dark" ? "light" : "dark";
}

/**
 * Runs inline in <head> before first paint. Only applies a stored choice;
 * with no choice, CSS follows prefers-color-scheme on its own.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/lib/theme.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Append the failing no-flash E2E test to `e2e/theme.spec.ts`**

```ts
test("a stored choice applies before any app JavaScript runs (no flash)", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  // Block every app chunk: only the inline <head> script can set the theme.
  await page.route("**/_next/static/chunks/**/*.js", (route) => route.abort());
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(htmlBackground)).toBe(LIGHT_BG);
});
```

Run: `npm run build && npx playwright test e2e/theme.spec.ts`
Expected: the new test FAILS, because `data-theme` is never set.

- [ ] **Step 6: Inject the script in `src/app/layout.tsx`**

This follows the pattern in `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`. Add the import:

```tsx
import { themeInitScript } from "@/lib/theme";
```

Add `suppressHydrationWarning` to `<html>` and a `<head>` with the script, so the `return` becomes:

```tsx
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${bricolage.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
```

- [ ] **Step 7: Verify**

```bash
npm run format && npm run lint && npm run typecheck && npm run test
npm run build && npx playwright test
```

Expected: everything passes, including the no-flash test.

- [ ] **Step 8: Commit**

```bash
git add src/lib/theme.ts src/lib/theme.test.ts src/app/layout.tsx e2e/theme.spec.ts
git commit -m "feat: apply stored theme before first paint

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: ThemeToggle, site header and skip link

**Files:**
- Create: `src/components/theme/theme-toggle.tsx`, `src/components/theme/theme-toggle.test.tsx`, `src/components/site/site-header.tsx`, `src/components/ui/container.tsx`, `src/components/ui/skip-link.tsx`
- Modify: `src/app/layout.tsx`, `src/app/page.tsx` (`<main>` gets `id="main"`), `e2e/theme.spec.ts` (append tests)

**Interfaces:**
- Consumes: `isTheme`, `nextTheme`, `resolveTheme`, `THEME_STORAGE_KEY`, `Theme` from `@/lib/theme`; `mockMatchMedia` from `@/test/setup`.
- Produces:
  - `ThemeToggle(): JSX.Element`. Its accessible name is `"Switch to light theme"` or `"Switch to dark theme"` (or `"Toggle theme"` before hydration).
  - `Container({ children, className? })`
  - `SkipLink()`, which targets `#main`
  - `SiteHeader()`

- [ ] **Step 1: Write the failing unit test `src/components/theme/theme-toggle.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mockMatchMedia } from "@/test/setup";
import { ThemeToggle } from "./theme-toggle";

describe("ThemeToggle", () => {
  it("offers light when the effective theme is dark (no OS preference)", () => {
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
  });

  it("offers dark when the OS prefers light", () => {
    mockMatchMedia(["(prefers-color-scheme: light)"]);
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    ).toBeInTheDocument();
  });

  it("flips the theme, stores the choice, and updates its label", async () => {
    render(<ThemeToggle />);
    await userEvent.click(
      screen.getByRole("button", { name: "Switch to light theme" }),
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
    expect(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    ).toBeInTheDocument();
  });

  it("still switches when storage throws", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<ThemeToggle />);
    await userEvent.click(
      screen.getByRole("button", { name: "Switch to light theme" }),
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/theme/theme-toggle.test.tsx`
Expected: FAIL with `Failed to resolve import "./theme-toggle"`.

- [ ] **Step 3: Implement `src/components/theme/theme-toggle.tsx`**

```tsx
"use client";

import { useSyncExternalStore } from "react";
import {
  isTheme,
  nextTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/lib/theme";

function readStored(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function currentTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (isTheme(attr)) return attr;
  return resolveTheme(
    readStored(),
    window.matchMedia("(prefers-color-scheme: light)").matches,
  );
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: light)");
  media.addEventListener("change", listener);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", listener);
  };
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage unavailable (private mode): the choice lasts for this page only.
  }
  listeners.forEach((l) => l());
}

export function ThemeToggle() {
  // Server snapshot is null: the label renders after hydration to avoid a mismatch.
  const theme = useSyncExternalStore(subscribe, currentTheme, () => null);
  const target = theme ? nextTheme(theme) : null;

  function onClick(event: React.MouseEvent<HTMLButtonElement>) {
    const next = nextTheme(currentTheme());
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!document.startViewTransition || reduce) {
      applyTheme(next);
      return;
    }
    const { clientX: x, clientY: y } = event;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );
    document
      .startViewTransition(() => applyTheme(next))
      .ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 650,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={target ? `Switch to ${target} theme` : "Toggle theme"}
      className="inline-flex size-10 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:text-text"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
      </svg>
    </button>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/components/theme/theme-toggle.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Create `src/components/ui/container.tsx`, `src/components/ui/skip-link.tsx` and `src/components/site/site-header.tsx`**

`src/components/ui/container.tsx`:

```tsx
import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1040px] px-6 ${className}`}>
      {children}
    </div>
  );
}
```

`src/components/ui/skip-link.tsx`:

```tsx
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only rounded-md bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60]"
    >
      Skip to content
    </a>
  );
}
```

`src/components/site/site-header.tsx`. It uses a plain `<a>`, not `next/link`, to save about 8 KB of client JS; Task 7 turns off the lint rule that objects. Until then, keep the single-line disable shown here:

```tsx
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Container } from "@/components/ui/container";

export function SiteHeader() {
  return (
    <header className="relative z-10">
      <Container className="flex items-center justify-between py-5">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- removed in Task 7 */}
        <a
          href="/"
          aria-label="Naveen Dwarapudi, home"
          className="font-display text-xl font-extrabold tracking-[-0.04em]"
        >
          ND<span className="text-accent">.</span>
        </a>
        <ThemeToggle />
      </Container>
    </header>
  );
}
```

- [ ] **Step 6: Mount them in `src/app/layout.tsx`**

Add these imports:

```tsx
import { SiteHeader } from "@/components/site/site-header";
import { SkipLink } from "@/components/ui/skip-link";
```

Change `<body>` to:

```tsx
      <body className="flex min-h-dvh flex-col">
        <SkipLink />
        <SiteHeader />
        {children}
      </body>
```

In `src/app/page.tsx`, change `<main className=...>` to `<main id="main" className=...>`, so the skip link has a target.

- [ ] **Step 7: Append the toggle E2E tests to `e2e/theme.spec.ts`**

```ts
test("the toggle persists across reloads and keeps its label in sync", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeVisible();

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeVisible();
});

test("the toggle label follows a live OS change when nothing is stored", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeVisible();
});
```

- [ ] **Step 8: Verify**

```bash
npm run format && npm run lint && npm run typecheck && npm run test
npm run build && npx playwright test
```

Expected: everything passes. The 4 theme E2E tests are green, and axe passes in both schemes with the new header.

- [ ] **Step 9: Commit**

```bash
git add src/components src/app/layout.tsx src/app/page.tsx e2e/theme.spec.ts
git commit -m "feat: add theme toggle with circular wipe, site header and skip link

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: UI building blocks

**Files:**
- Create: `src/components/ui/section-label.tsx`, `src/components/ui/section.tsx`, `src/components/ui/heading.tsx`, `src/components/ui/button.tsx`, `src/components/ui/chip.tsx`, `src/components/ui/text-link.tsx`, `src/components/ui/card.tsx`, and tests `src/components/ui/button.test.tsx`, `src/components/ui/heading.test.tsx`, `src/components/ui/section.test.tsx`

**Interfaces:**
- Consumes: `Container` (Task 3); Tailwind tokens (Task 1).
- Produces:
  - `SectionLabel({ index: string, children: string })`
  - `Section({ id, index, label, children })`. It renders `<section id aria-labelledby={`${id}-heading`}>`, so the caller provides an element with id `${id}-heading`.
  - `Heading({ level: "display" | "h2" | "h3", id?, className?, children })`. `display` renders an `h1`.
  - `type RevealLine = { text: string; className?: string }`
  - `LineReveal({ lines: RevealLine[] })`. It renders an sr-only full text plus aria-hidden animated lines.
  - `Button(props & { variant?, arrow? })`, which always has `type="button"`.
  - `ButtonLink(anchor props & { variant?, arrow? })`, a plain `<a>`.
  - `buttonClass(variant?)`
  - `Chip({ children: string })`
  - `TextLink(anchor props)`: an accent-underlined `<a>`
  - `Card({ children, className? })`: a static surface with a hairline border

- [ ] **Step 1: Write the failing tests**

`src/components/ui/button.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, ButtonLink } from "./button";

describe("ButtonLink", () => {
  it("renders a plain anchor with its href and accessible name", () => {
    render(
      <ButtonLink href="#work" arrow="→">
        View work
      </ButtonLink>,
    );
    const link = screen.getByRole("link", { name: "View work" });
    expect(link).toHaveAttribute("href", "#work");
  });

  it("hides the decorative arrow from assistive tech", () => {
    render(
      <ButtonLink href="#work" arrow="→">
        View work
      </ButtonLink>,
    );
    expect(screen.getByText("→")).toHaveAttribute("aria-hidden", "true");
  });

  it("uses the accent fill for primary and a hairline for secondary", () => {
    render(
      <>
        <ButtonLink href="#a">Primary</ButtonLink>
        <ButtonLink href="#b" variant="secondary">
          Secondary
        </ButtonLink>
      </>,
    );
    expect(screen.getByRole("link", { name: "Primary" }).className).toContain(
      "bg-accent",
    );
    expect(screen.getByRole("link", { name: "Secondary" }).className).toContain(
      "border-line",
    );
  });
});

describe("Button", () => {
  it("defaults to type=button so it never submits a form by accident", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button", { name: "Go" })).toHaveAttribute(
      "type",
      "button",
    );
  });
});
```

`src/components/ui/heading.test.tsx`. The first `LineReveal` test pins a real bug found in the prototype: without the sr-only copy, the accessible name was computed as `"Bhavani SankarNaveenDwarapudi."`.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Heading, LineReveal } from "./heading";

describe("Heading", () => {
  it("maps display to h1, and h2/h3 to themselves", () => {
    render(
      <>
        <Heading level="display">Display</Heading>
        <Heading level="h2">Two</Heading>
        <Heading level="h3">Three</Heading>
      </>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Display" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Two" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Three" }),
    ).toBeInTheDocument();
  });
});

describe("LineReveal", () => {
  it("keeps the full text as the heading's accessible name", () => {
    render(
      <Heading level="display">
        <LineReveal
          lines={[
            { text: "Bhavani Sankar" },
            { text: "Naveen" },
            { text: "Dwarapudi." },
          ]}
        />
      </Heading>,
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Bhavani Sankar Naveen Dwarapudi.",
      }),
    ).toBeInTheDocument();
  });

  it("hides the animated fragments from assistive tech", () => {
    const { container } = render(
      <LineReveal lines={[{ text: "A" }, { text: "B" }]} />,
    );
    expect(
      container
        .querySelector(".line-reveal-line")
        ?.closest("[aria-hidden='true']"),
    ).not.toBeNull();
  });

  it("staggers each line with an index", () => {
    const { container } = render(
      <LineReveal lines={[{ text: "A" }, { text: "B" }]} />,
    );
    const lines = container.querySelectorAll<HTMLElement>(".line-reveal-line");
    expect(lines).toHaveLength(2);
    expect(lines[1]?.style.getPropertyValue("--i")).toBe("1");
  });
});
```

`src/components/ui/section.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "./card";
import { Chip } from "./chip";
import { Section } from "./section";
import { TextLink } from "./text-link";

describe("Section", () => {
  it("is a labelled region with its numbered label", () => {
    render(
      <Section id="work" index="02" label="Selected work">
        <h2 id="work-heading">Work</h2>
      </Section>,
    );
    expect(screen.getByRole("region", { name: "Work" })).toHaveAttribute(
      "id",
      "work",
    );
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText(/Selected work/)).toBeInTheDocument();
  });
});

describe("Chip", () => {
  it("renders its text", () => {
    render(<Chip>React</Chip>);
    expect(screen.getByText("React")).toBeInTheDocument();
  });
});

describe("TextLink", () => {
  it("renders an accent-underlined anchor", () => {
    render(<TextLink href="/resume">Resume</TextLink>);
    const link = screen.getByRole("link", { name: "Resume" });
    expect(link).toHaveAttribute("href", "/resume");
    expect(link.className).toContain("text-accent");
  });
});

describe("Card", () => {
  it("renders a surface with a hairline border", () => {
    render(<Card>Body</Card>);
    const card = screen.getByText("Body");
    expect(card.className).toContain("bg-surface");
    expect(card.className).toContain("border-line");
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/components/ui`
Expected: FAIL with unresolved imports `./button`, `./heading`, `./section`, `./chip`, `./text-link` and `./card`.

- [ ] **Step 3: Implement the components**

`src/components/ui/section-label.tsx`:

```tsx
export function SectionLabel({
  index,
  children,
}: {
  index: string;
  children: string;
}) {
  return (
    <p className="font-mono text-label tracking-[0.1em] text-muted uppercase">
      <span className="text-accent">{index}</span> / {children}
    </p>
  );
}
```

`src/components/ui/section.tsx`:

```tsx
import type { ReactNode } from "react";
import { Container } from "./container";
import { SectionLabel } from "./section-label";

export function Section({
  id,
  index,
  label,
  children,
}: {
  id: string;
  index: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="py-20">
      <Container>
        <SectionLabel index={index}>{label}</SectionLabel>
        {children}
      </Container>
    </section>
  );
}
```

`src/components/ui/heading.tsx`:

```tsx
import type { ReactNode } from "react";

type Level = "display" | "h2" | "h3";

const styles: Record<Level, string> = {
  display: "font-display text-display font-extrabold tracking-[-0.045em]",
  h2: "font-display text-h2 font-extrabold tracking-[-0.035em]",
  h3: "font-display text-h3 font-extrabold tracking-[-0.02em]",
};

const tags = { display: "h1", h2: "h2", h3: "h3" } as const;

export function Heading({
  level,
  id,
  className = "",
  children,
}: {
  level: Level;
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const Tag = tags[level];
  return (
    <Tag id={id} className={`${styles[level]} ${className}`}>
      {children}
    </Tag>
  );
}

export type RevealLine = { text: string; className?: string };

/**
 * Lines rise into view one after another. Assistive tech reads the full text
 * once (sr-only); the animated fragments are hidden from it.
 */
export function LineReveal({ lines }: { lines: RevealLine[] }) {
  return (
    <>
      <span className="sr-only">{lines.map((l) => l.text).join(" ")}</span>
      <span aria-hidden="true">
        {lines.map((line, i) => (
          <span
            key={line.text}
            className={`line-reveal-line ${line.className ?? ""}`}
            style={{ "--i": i } as React.CSSProperties}
          >
            <span>{line.text}</span>
          </span>
        ))}
      </span>
    </>
  );
}
```

`src/components/ui/button.tsx`:

```tsx
import type { ComponentProps, ReactNode } from "react";

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
  children,
  ...props
}: ComponentProps<"a"> & { variant?: Variant; arrow?: string }) {
  return (
    <a className={buttonClass(variant)} {...props}>
      {children}
      {arrow ? <Arrow>{arrow}</Arrow> : null}
    </a>
  );
}
```

`src/components/ui/chip.tsx`:

```tsx
export function Chip({ children }: { children: string }) {
  return (
    <span className="rounded-md border border-line px-2 py-1 font-mono text-[11px] text-muted">
      {children}
    </span>
  );
}
```

`src/components/ui/text-link.tsx`:

```tsx
import type { ComponentProps } from "react";

export function TextLink({ className = "", ...props }: ComponentProps<"a">) {
  return (
    <a
      className={`text-accent underline underline-offset-[3px] transition-colors hover:text-text ${className}`}
      {...props}
    />
  );
}
```

`src/components/ui/card.tsx`:

```tsx
import type { ReactNode } from "react";

/** Static surface card. For the pointer spotlight and tilt, use InteractiveCard. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[14px] border border-line bg-surface p-6 ${className}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npx vitest run src/components/ui`
Expected: PASS, 12 tests.

- [ ] **Step 5: Verify and commit**

```bash
npm run format && npm run lint && npm run typecheck && npm run test
git add src/components/ui
git commit -m "feat: add section, heading with line reveal, button, chip, link and card primitives

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Motion helpers, CountUp and pointer effects

**Files:**
- Create: `src/lib/motion.ts`, `src/lib/motion.test.ts`, `src/components/motion/count-up.tsx`, `src/components/motion/count-up.test.tsx`, `src/components/motion/pointer-effects.tsx`, `src/components/motion/pointer-effects.test.tsx`

**Interfaces:**
- Consumes: `mockMatchMedia` (Task 1); the `ease-spring` and `ease-out-expo` utilities (Task 1).
- Produces:
  - `prefersReducedMotion(): boolean`
  - `canHoverPrecisely(): boolean`
  - `easeOutQuart(t: number): number`
  - `CountUp({ value: number, durationMs?: number, delayMs?: number })`
  - `Magnetic({ children })`
  - `InteractiveCard({ children, className? })`. Its root has class `group` and sets `--mx` and `--my`.
  - `Parallax({ children })`

- [ ] **Step 1: Write the failing tests**

`src/lib/motion.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { mockMatchMedia } from "@/test/setup";
import {
  canHoverPrecisely,
  easeOutQuart,
  prefersReducedMotion,
} from "./motion";

describe("easeOutQuart", () => {
  it("starts at 0 and ends at 1", () => {
    expect(easeOutQuart(0)).toBe(0);
    expect(easeOutQuart(1)).toBe(1);
  });

  it("is past halfway at the midpoint (fast start)", () => {
    expect(easeOutQuart(0.5)).toBeCloseTo(0.9375);
  });

  it("clamps out-of-range input", () => {
    expect(easeOutQuart(-1)).toBe(0);
    expect(easeOutQuart(2)).toBe(1);
  });
});

describe("media helpers", () => {
  it("report false when nothing matches", () => {
    expect(prefersReducedMotion()).toBe(false);
    expect(canHoverPrecisely()).toBe(false);
  });

  it("report true when the query matches", () => {
    mockMatchMedia([
      "(prefers-reduced-motion: reduce)",
      "(hover: hover) and (pointer: fine)",
    ]);
    expect(prefersReducedMotion()).toBe(true);
    expect(canHoverPrecisely()).toBe(true);
  });
});
```

`src/components/motion/count-up.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { mockMatchMedia } from "@/test/setup";
import { CountUp } from "./count-up";

describe("CountUp", () => {
  it("server-renders the final value", () => {
    expect(renderToString(<CountUp value={30} />)).toContain(">30<");
  });

  it("shows the final value immediately under reduced motion", () => {
    mockMatchMedia(["(prefers-reduced-motion: reduce)"]);
    render(<CountUp value={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});
```

`src/components/motion/pointer-effects.test.tsx`. jsdom reports every element as 0×0, so the tilt test stubs `getBoundingClientRect`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockMatchMedia } from "@/test/setup";
import { InteractiveCard, Magnetic } from "./pointer-effects";

const FINE = "(hover: hover) and (pointer: fine)";
const REDUCE = "(prefers-reduced-motion: reduce)";

function wrapperOf(text: string) {
  const el = screen.getByText(text).closest("[class*='transition']");
  if (!(el instanceof HTMLElement)) throw new Error("wrapper not found");
  return el;
}

describe("Magnetic", () => {
  it("moves toward the pointer on precise-pointer devices", () => {
    mockMatchMedia([FINE]);
    render(
      <Magnetic>
        <span>Pull</span>
      </Magnetic>,
    );
    const el = wrapperOf("Pull");
    fireEvent.pointerMove(el, { clientX: 50, clientY: 10 });
    expect(el.style.transform).toMatch(/^translate\(/);
    fireEvent.pointerLeave(el);
    expect(el.style.transform).toBe("");
  });

  it("stays still on touch devices", () => {
    mockMatchMedia([]);
    render(
      <Magnetic>
        <span>Pull</span>
      </Magnetic>,
    );
    const el = wrapperOf("Pull");
    fireEvent.pointerMove(el, { clientX: 50, clientY: 10 });
    expect(el.style.transform).toBe("");
  });

  it("stays still under reduced motion", () => {
    mockMatchMedia([FINE, REDUCE]);
    render(
      <Magnetic>
        <span>Pull</span>
      </Magnetic>,
    );
    const el = wrapperOf("Pull");
    fireEvent.pointerMove(el, { clientX: 50, clientY: 10 });
    expect(el.style.transform).toBe("");
  });
});

describe("InteractiveCard", () => {
  it("tracks the pointer for the glow and tilts on precise pointers", () => {
    mockMatchMedia([FINE]);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
      DOMRect.fromRect({ x: 0, y: 0, width: 200, height: 100 }),
    );
    render(
      <InteractiveCard>
        <p>Card body</p>
      </InteractiveCard>,
    );
    const card = screen.getByText("Card body").closest(".group");
    if (!(card instanceof HTMLElement)) throw new Error("card not found");
    fireEvent.pointerMove(card, { clientX: 20, clientY: 30 });
    expect(card.style.getPropertyValue("--mx")).toBe("20px");
    expect(card.style.transform).toContain("perspective(800px)");
  });

  it("keeps the glow but never tilts on touch devices", () => {
    mockMatchMedia([]);
    render(
      <InteractiveCard>
        <p>Card body</p>
      </InteractiveCard>,
    );
    const card = screen.getByText("Card body").closest(".group");
    if (!(card instanceof HTMLElement)) throw new Error("card not found");
    fireEvent.pointerMove(card, { clientX: 20, clientY: 30 });
    expect(card.style.getPropertyValue("--mx")).toBe("20px");
    expect(card.style.transform).toBe("");
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/lib/motion.test.ts src/components/motion`
Expected: FAIL with unresolved imports.

- [ ] **Step 3: Implement**

`src/lib/motion.ts`:

```ts
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Pointer-driven effects (tilt, magnetic, parallax) only on mouse/trackpad devices. */
export function canHoverPrecisely(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/** ease-out-quart: fast start, gentle landing. Input and output in [0, 1]. */
export function easeOutQuart(t: number): number {
  const clamped = Math.min(Math.max(t, 0), 1);
  return 1 - Math.pow(1 - clamped, 4);
}
```

`src/components/motion/count-up.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { easeOutQuart, prefersReducedMotion } from "@/lib/motion";

type CountUpProps = {
  value: number;
  durationMs?: number;
  delayMs?: number;
};

/**
 * Server-renders the final value (readable without JS, by crawlers, and under
 * reduced motion). On first view it counts up from 0, once.
 */
export function CountUp({
  value,
  durationMs = 1400,
  delayMs = 0,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now() + delayMs;
        el.textContent = "0";
        const tick = (now: number) => {
          const progress = (now - start) / durationMs;
          el.textContent = String(Math.round(value * easeOutQuart(progress)));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = String(value);
    };
  }, [value, durationMs, delayMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
    </span>
  );
}
```

`src/components/motion/pointer-effects.tsx`:

```tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { canHoverPrecisely, prefersReducedMotion } from "@/lib/motion";

function motionAllowed() {
  return canHoverPrecisely() && !prefersReducedMotion();
}

/** Pulls its child toward the pointer and springs back on leave. */
export function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <span
      ref={ref}
      className="inline-flex transition-transform duration-300 ease-spring"
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el || !motionAllowed()) return;
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) * 0.18;
        const dy = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      }}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = "";
      }}
    >
      {children}
    </span>
  );
}

/** Card whose glow follows the pointer, with a slight 3D tilt. */
export function InteractiveCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-[14px] border border-line bg-surface p-6 transition-[transform,border-color] duration-500 ease-spring hover:border-accent/45 ${className}`}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        el.style.setProperty("--mx", `${x}px`);
        el.style.setProperty("--my", `${y}px`);
        if (!motionAllowed() || r.width === 0 || r.height === 0) return;
        const rx = (0.5 - y / r.height) * 6;
        const ry = (x / r.width - 0.5) * 6;
        el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
      }}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = "";
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/** Drifts its child slightly as the pointer moves anywhere in the window. */
export function Parallax({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!motionAllowed()) return;
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const dx = e.clientX / window.innerWidth - 0.5;
      const dy = e.clientY / window.innerHeight - 0.5;
      el.style.transform = `translate(${dx * 14}px, ${dy * 14}px) rotate(${dx * 2}deg)`;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return (
    <div ref={ref} className="transition-transform duration-500 ease-out-expo">
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npx vitest run src/lib/motion.test.ts src/components/motion`
Expected: PASS, 12 tests.

- [ ] **Step 5: Verify and commit**

```bash
npm run format && npm run lint && npm run typecheck && npm run test
git add src/lib/motion.ts src/lib/motion.test.ts src/components/motion
git commit -m "feat: add count-up, magnetic, spotlight-tilt card and parallax effects

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Hero background and portrait

**Files:**
- Create: `src/components/motion/hero-background.tsx`, `src/components/motion/portrait.tsx`, `src/components/motion/portrait.test.tsx`

**Interfaces:**
- Consumes: `Parallax` (Task 5); the `mesh-drift`, `ring-spin`, `curtain` and `bob` keyframes and `--glow-*` tokens (Task 1).
- Produces:
  - `HeroBackground()`
  - `Portrait({ src: StaticImageData, alt: string, badge?: ReactNode })`. The image uses `loading="eager"`, `fetchpriority="high"` and an optimised `srcset`.

Why `getImageProps()` rather than `<Image>`:
- `<Image>` is a client component that adds about 3 KB of script. `getImageProps()` runs on the server and still serves optimised AVIF/WebP.
- Next 16 deprecates `priority`. The bundled `image.md` docs recommend `loading="eager"` and `fetchPriority="high"` instead.

The reveal is a curtain overlay sliding off the photo, so the image itself paints immediately. In the prototype the photo was the LCP element at about 2.33 s.

- [ ] **Step 1: Write the failing test `src/components/motion/portrait.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Portrait } from "./portrait";

const image = {
  src: "/_next/static/media/mypic-2.jpeg",
  width: 886,
  height: 886,
};

describe("Portrait", () => {
  it("renders an optimized, eagerly loaded image with alt text", () => {
    render(
      <Portrait
        src={image}
        alt="Portrait of Bhavani Sankar Naveen Dwarapudi"
      />,
    );
    const img = screen.getByRole("img", {
      name: "Portrait of Bhavani Sankar Naveen Dwarapudi",
    });
    expect(img).toHaveAttribute(
      "srcset",
      expect.stringContaining("/_next/image?url="),
    );
    expect(img).toHaveAttribute("fetchpriority", "high");
    expect(img).not.toHaveAttribute("loading", "lazy");
  });

  it("renders the badge when given", () => {
    render(<Portrait src={image} alt="Portrait" badge="4+ yrs" />);
    expect(screen.getByText("4+ yrs")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/motion/portrait.test.tsx`
Expected: FAIL with `Failed to resolve import "./portrait"`.

- [ ] **Step 3: Implement**

`src/components/motion/hero-background.tsx`:

```tsx
/** Slowly drifting gradient mesh. Pure CSS, decorative. */
export function HeroBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="absolute -inset-[30%] blur-[60px] motion-safe:animate-[mesh-drift_28s_linear_infinite]"
        style={{
          background:
            "radial-gradient(40% 35% at 25% 35%, var(--glow-1), transparent 70%), radial-gradient(35% 40% at 75% 30%, var(--glow-2), transparent 70%), radial-gradient(45% 40% at 55% 80%, var(--glow-3), transparent 70%)",
        }}
      />
    </div>
  );
}
```

`src/components/motion/portrait.tsx`:

```tsx
import { getImageProps, type StaticImageData } from "next/image";
import { Parallax } from "./pointer-effects";

/**
 * Hero photo. The image paints immediately (it is the LCP candidate); the
 * reveal is a curtain overlay sliding away, so animation never delays LCP.
 */
export function Portrait({
  src,
  alt,
  badge,
}: {
  src: StaticImageData;
  alt: string;
  badge?: React.ReactNode;
}) {
  const { props: imageProps } = getImageProps({
    src,
    alt,
    loading: "eager",
    fetchPriority: "high",
    sizes: "(max-width: 820px) 200px, 340px",
  });
  return (
    <Parallax>
      <div className="relative aspect-square w-[200px] md:w-[340px]">
        <div
          aria-hidden="true"
          className="absolute -inset-[3px] rounded-[30px] motion-safe:animate-[ring-spin_6s_linear_infinite]"
          style={{
            background:
              "conic-gradient(from var(--ring-angle), var(--accent), transparent 30%, transparent 60%, var(--accent))",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-[12%_-10%_-10%_12%] -z-10 rounded-[40px] bg-[var(--glow-1)] blur-[50px]"
        />
        <div className="absolute inset-0 overflow-hidden rounded-[28px] bg-[#111]">
          {/* eslint-disable-next-line @next/next/no-img-element -- props come from getImageProps (optimized, server-only, no client JS) */}
          <img {...imageProps} alt={alt} className="size-full object-cover" />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-bg motion-safe:animate-[curtain_0.9s_var(--ease-out)_0.2s_forwards] motion-reduce:hidden"
          />
        </div>
        {badge ? (
          <div className="absolute bottom-5 left-[40%] rounded-xl border border-line bg-surface px-3.5 py-2.5 font-mono text-xs whitespace-nowrap text-muted shadow-[0_12px_30px_-12px_rgb(0_0_0/0.5)] motion-safe:animate-[bob_4s_ease-in-out_2s_infinite] md:-left-5">
            {badge}
          </div>
        ) : null}
      </div>
    </Parallax>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/components/motion/portrait.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Verify and commit**

```bash
npm run format && npm run lint && npm run typecheck && npm run test
git add src/components/motion/hero-background.tsx src/components/motion/portrait.tsx src/components/motion/portrait.test.tsx
git commit -m "feat: add gradient-mesh hero background and animated portrait

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Showcase page, E2E coverage, budgets and docs

**Files:**
- Modify: `src/app/page.tsx` (full replace), `src/app/page.test.tsx` (full replace), `e2e/smoke.spec.ts` (full replace), `eslint.config.mjs`, `src/components/site/site-header.tsx` (drop the inline disable), `CLAUDE.md`, `docs/superpowers/specs/2026-10-09-design-system-design.md`
- Create: `e2e/motion.spec.ts`

**Interfaces:**
- Consumes: everything from Tasks 1–6, and `src/images/mypic-2.jpeg`.

- [ ] **Step 1: Replace `src/app/page.test.tsx` (failing)**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("@/images/mypic-2.jpeg", () => ({
  default: { src: "/_next/static/media/mypic-2.jpeg", width: 886, height: 886 },
}));

describe("Home (design-system showcase)", () => {
  it("renders the full name as the only h1", () => {
    render(<Home />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveAccessibleName(
      "Bhavani Sankar Naveen Dwarapudi.",
    );
  });

  it("renders the resume positioning line", () => {
    render(<Home />);
    expect(
      screen.getByText(
        "React.js Developer | React Native Developer | Full-Stack (MERN) Engineer",
      ),
    ).toBeInTheDocument();
  });

  it("wraps content in a main landmark that the skip link targets", () => {
    render(<Home />);
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });

  it("shows the portrait with the full name in its alt text", () => {
    render(<Home />);
    expect(
      screen.getByRole("img", {
        name: "Portrait of Bhavani Sankar Naveen Dwarapudi",
      }),
    ).toBeInTheDocument();
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

  it("states that client names are withheld", () => {
    // Names themselves are guarded repo-wide by src/test/confidentiality.test.ts.
    render(<Home />);
    expect(
      screen.getByText(/names withheld under confidentiality/i),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/app/page.test.tsx`
Expected: FAIL. The placeholder h1 is "Naveen Dwarapudi" and there is no portrait or metrics.

- [ ] **Step 3: Replace `src/app/page.tsx`**

```tsx
import portraitImage from "@/images/mypic-2.jpeg";
import { CountUp } from "@/components/motion/count-up";
import { HeroBackground } from "@/components/motion/hero-background";
import { InteractiveCard, Magnetic } from "@/components/motion/pointer-effects";
import { Portrait } from "@/components/motion/portrait";
import { ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Container } from "@/components/ui/container";
import { Heading, LineReveal } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { SectionLabel } from "@/components/ui/section-label";

const metrics = [
  { value: 4, suffix: "+", label: "years in production" },
  { value: 5, suffix: "", label: "client engagements" },
  { value: 30, suffix: "%+", label: "faster component builds" },
  { value: 4, suffix: "", label: "industries" },
];

const work = [
  {
    kicker: "Pharma · Enterprise web",
    title: "Multi-portal enterprise platform",
    body: "Three role-based portals (admin, partner and customer) with two-tier access control.",
    chips: ["React", "RTK Query", "RBAC"],
  },
  {
    kicker: "Payments · Public sector",
    title: "Municipal bill payment",
    body: "Admin and citizen single-page apps for paying civic bills online.",
    chips: ["React", "TypeScript"],
  },
  {
    kicker: "Logistics · Mobile",
    title: "Warehouse operations apps",
    body: "Migrated hybrid Ionic apps to React Native for a global e-commerce company.",
    chips: ["React Native", "Migration"],
  },
];

export default function Home() {
  return (
    <main id="main" className="flex-1">
      <div className="relative -mt-[80px] overflow-hidden border-b border-line pt-[80px]">
        <HeroBackground />
        <Container className="relative grid items-center gap-12 py-16 md:grid-cols-[1.25fr_0.75fr] md:py-20">
          <div>
            <div className="fade-up">
              <SectionLabel index="01">
                React · React Native · Next.js
              </SectionLabel>
            </div>
            <Heading level="display" className="mt-5 mb-6">
              <LineReveal
                lines={[
                  {
                    text: "Bhavani Sankar",
                    className: "text-[0.38em] tracking-[-0.02em] text-muted",
                  },
                  { text: "Naveen" },
                  { text: "Dwarapudi.", className: "text-accent" },
                ]}
              />
            </Heading>
            <p
              className="fade-up max-w-[620px] text-lg text-muted"
              style={{ "--delay": "350ms" } as React.CSSProperties}
            >
              React.js Developer | React Native Developer | Full-Stack (MERN)
              Engineer
            </p>
            <div
              className="fade-up mt-8 flex flex-wrap gap-3.5"
              style={{ "--delay": "500ms" } as React.CSSProperties}
            >
              <Magnetic>
                <ButtonLink href="#work" arrow="→">
                  View work
                </ButtonLink>
              </Magnetic>
              <Magnetic>
                <ButtonLink href="#work" variant="secondary" arrow="↓">
                  Download resume
                </ButtonLink>
              </Magnetic>
            </div>
          </div>
          <div className="order-first justify-self-start md:order-none md:justify-self-end">
            <Portrait
              src={portraitImage}
              alt="Portrait of Bhavani Sankar Naveen Dwarapudi"
              badge={
                <>
                  <span className="text-accent">4+ yrs</span> · React &amp;
                  React Native
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
                  <span className="text-accent">{m.suffix}</span>
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </div>

      <Section id="work" index="02" label="Selected work">
        <Heading level="h2" id="work-heading" className="scroll-reveal mt-4">
          Production apps, not side quests.
        </Heading>
        <p className="mt-3 mb-8 font-mono text-label tracking-[0.08em] text-muted uppercase">
          Client work · names withheld under confidentiality
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {work.map((w, i) => (
            <div
              key={w.title}
              className="scroll-reveal"
              style={{ "--i": i } as React.CSSProperties}
            >
              <InteractiveCard className="h-full">
                <p className="font-mono text-label tracking-[0.1em] text-accent uppercase">
                  {w.kicker}
                </p>
                <Heading level="h3" className="mt-2.5 mb-2">
                  {w.title}
                </Heading>
                <p className="mb-4 text-sm text-muted">{w.body}</p>
                <div className="flex flex-wrap gap-1.5">
                  {w.chips.map((c) => (
                    <Chip key={c}>{c}</Chip>
                  ))}
                </div>
              </InteractiveCard>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/app/page.test.tsx`
Expected: PASS, 6 tests.

- [ ] **Step 5: Allow plain `<a>` navigation site-wide**

In `eslint.config.mjs`, add this object as the last entry of the `defineConfig([...])` array, after `prettier`:

```js
  {
    // Navigation uses plain <a>: next/link costs ~8 KB of client JS against a
    // tight script budget, and page transitions use cross-document View
    // Transitions instead (see docs/superpowers/specs/2026-10-09-design-system-design.md).
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
```

Then delete the `{/* eslint-disable-next-line ... */}` line in `src/components/site/site-header.tsx`.

- [ ] **Step 6: Replace `e2e/smoke.spec.ts` and create `e2e/motion.spec.ts`**

`e2e/smoke.spec.ts` runs axe in four states (OS light, OS dark, toggled light, toggled dark) and checks for horizontal scroll at 320 px and 375 px:

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectNoAxeViolations(page: Page) {
  // Let entrance animations settle so axe sees final colours and opacity.
  await page.waitForTimeout(1500);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations).toEqual([]);
}

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
    await expectNoAxeViolations(page);
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
    await expectNoAxeViolations(page);
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
}
```

`e2e/motion.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("reduced motion shows the final state with no movement", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByText("client engagements")).toBeVisible();
  const metric = page.locator("dd").filter({ hasText: "30" });
  await expect(metric).toContainText("30");

  const animations = await page.evaluate(
    () =>
      document.getAnimations().filter((a) => a.playState === "running").length,
  );
  expect(animations).toBe(0);
});

test("content is complete when app JavaScript fails to load", async ({
  page,
}) => {
  await page.route("**/_next/static/chunks/**/*.js", (route) => route.abort());
  await page.goto("/");
  await page.waitForTimeout(1500);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Bhavani Sankar Naveen Dwarapudi.",
    }),
  ).toBeVisible();
  for (const value of ["4", "5", "30"]) {
    await expect(
      page.locator("dd").filter({ hasText: value }).first(),
    ).toBeVisible();
  }
  await expect(
    page.getByRole("img", { name: /Portrait of Bhavani Sankar/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Production apps, not side quests." }),
  ).toBeVisible();
});
```

- [ ] **Step 7: Run the full suite**

```bash
npm run format && npm run format:check && npm run lint && npm run typecheck && npm run test
npm run build && npx playwright test
```

Expected:
- **Unit tests:** 53 passed.
- **E2E:** 13 passed (smoke 7, theme 4, motion 2).

If port 3100 is busy from an earlier run, free it first with `lsof -ti tcp:3100 | xargs kill`.

- [ ] **Step 8: Check the budgets with Lighthouse CI**

```bash
npm run build
CHROME_PATH="$(ls -d ~/Library/Caches/ms-playwright/chromium-*/chrome-mac*/*.app/Contents/MacOS/* | head -1)" \
  npx lhci autorun --upload.target=filesystem --upload.outputDir=.lighthouseci/reports
```

Expected: `All results processed!` with no `✘`. The prototype measured LCP of about 2330 ms, script 140,072 B and performance 0.98. If any assertion fails, **do not edit `lighthouserc.json`**. Find the regression: compare the script bytes and the LCP element against these numbers.

- [ ] **Step 9: Update the docs**

In `docs/superpowers/specs/2026-10-09-design-system-design.md`, append these rows to the §9 decisions table:

```markdown
| Links | plain `<a>`, no `next/link` | saves ~8 KB of client JS; cross-document View Transitions planned for page changes |
| Images | `getImageProps()` + `<img>`, `loading="eager"` + `fetchPriority="high"` | server-only, ~3 KB less JS; `priority` is deprecated in Next 16 |
| Display font | Bricolage Grotesque 800, local Latin subset (~17 KB) | the full variable font (41 KB) cost ~150 ms of LCP |
| Split-text accessibility | sr-only full text + aria-hidden animated lines | screen readers read the full name with proper spaces |
```

In `CLAUDE.md`, under `## Conventions`, add:

```markdown
- Design tokens live in `src/app/globals.css` (dark base; light via `prefers-color-scheme` or `[data-theme="light"]`). Use the Tailwind names (`bg-bg`, `text-muted`, `text-accent`, `border-line`, `font-display`, `text-display`), never raw hex.
- Theme: `src/lib/theme.ts` plus the inline script in `layout.tsx`; the toggle is `src/components/theme/theme-toggle.tsx`.
- Motion: CSS first (`.fade-up`, `.line-reveal-line`, `.scroll-reveal`). Client effects are in `src/components/motion/`. Every effect must honour reduced motion and must not hide content when JS fails.
- JS budget: don't use `next/link` or the `<Image>` component (use `<a>` and `getImageProps()`), and don't add Motion, `next-themes` or similar without measuring with LHCI.
- Display font is a local subset: regenerate it per `src/fonts/README.md`, never swap in the full Google font.
- jsdom test helpers: `mockMatchMedia([...queries])` from `@/test/setup`; storage and `data-theme` reset after each test.
```

- [ ] **Step 10: Commit**

```bash
npm run format:check
git add src/app/page.tsx src/app/page.test.tsx e2e eslint.config.mjs src/components/site/site-header.tsx CLAUDE.md docs/superpowers/specs/2026-10-09-design-system-design.md
git commit -m "feat: restyle home as design-system showcase with full E2E coverage

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 11: Push and open the PR (ask the owner first)**

```bash
git push -u origin feat/design-system
```

`gh` is not installed. Open `https://github.com/Naveen-Dwarapudi/portfolio/compare/main...feat/design-system?quick_pull=1` with a prefilled title and description, as in phase 1. Confirm all three CI jobs pass, and check the Vercel preview in both themes.
