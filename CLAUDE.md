# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Node 24 (`.nvmrc`). Run `npm run build` before E2E or Lighthouse, since both serve the production build.

- `npm run dev`: dev server (Turbopack)
- `npm run lint` / `npm run format` / `npm run format:check`
- `npm run typecheck`: runs `next typegen` then `tsc --noEmit`. Plain `tsc` fails on a clean checkout because `LayoutProps` and other route types are generated.
- `npm run test`: Vitest, single run. Single file: `npx vitest run src/lib/site-url.test.ts`. Single test: add `-t "<name>"`.
- `npm run test:e2e`: Playwright on port 3100. Single spec: `npx playwright test e2e/smoke.spec.ts`.
- `npm run lhci`: Lighthouse CI budgets (`lighthouserc.json`). Locally on macOS without Chrome, set `CHROME_PATH` to Playwright's Chromium.

CI (`.github/workflows/ci.yml`) runs `verify`, then `e2e` and `lighthouse` in parallel, on every PR and on pushes to `main`.

## Next.js 16 notes

This Next version differs from older training data. Read the bundled docs in `node_modules/next/dist/docs/` before using a Next API (see `AGENTS.md`). Tailwind is wired via `@tailwindcss/turbopack` in `next.config.ts`; there is no PostCSS or Tailwind config file. `cacheComponents` is enabled.

## Conventions

- Unit tests are colocated as `src/**/*.test.{ts,tsx}`. E2E specs live in `e2e/`.
- Canonical origin: import `siteUrl` from `@/lib/site-url`. Never read `NEXT_PUBLIC_SITE_URL` directly.
- Content source of truth: `src/resume/Naveen Dwarapudi Resume.pdf`. Headshots and screenshots are in `src/images/` (`mypic-2.jpeg` is the hero, `mypic-1.jpeg` is the about section).
- Design source of truth: `docs/superpowers/specs/`. Phase plans: `docs/superpowers/plans/`.
- Design tokens live in `src/app/globals.css` (dark base; light via `prefers-color-scheme` or `[data-theme="light"]`). Use the Tailwind names (`bg-bg`, `text-muted`, `text-accent`, `border-line`, `font-display`, `text-display`), never raw hex.
- Theme: `src/lib/theme.ts` plus the inline script in `layout.tsx`; the toggle is `src/components/theme/theme-toggle.tsx`.
- Motion: CSS first (`.fade-up`, `.line-reveal-line`, `.scroll-reveal`). Client effects are in `src/components/motion/`. Every effect must honour reduced motion and must not hide content when JS fails.
- JS budget: don't use `next/link` or the `<Image>` component (use `<a>` and `getImageProps()`), and don't add Motion, `next-themes` or similar without measuring with LHCI.
- Display font is a local subset: regenerate it per `src/fonts/README.md`, never swap in the full Google font.
- jsdom test helpers: `mockMatchMedia([...queries])` from `@/test/setup`; storage and `data-theme` reset after each test.

## What this is

A Next.js personal portfolio for a React / React Native engineer, aimed at senior IC roles. It replaces an older vanilla HTML site in a separate repo (`Naveen-Dwarapudi_Portfolio`), which must stay untouched. It is hosted on Vercel from a **public** repo, so commit history, PRs, and CI status count as portfolio exhibits: use conventional commits and one clean PR per phase.

## Planned stack (see spec §3)

Next.js App Router · TypeScript `strict` · Tailwind CSS v4 (CSS-first `@theme`, **no `tailwind.config.js`**) · Motion · next-intl · cmdk · Server Actions + Zod + react-hook-form · Resend · Vitest + RTL · Playwright + axe-core · Lighthouse CI · lucide-react.

Resolve version numbers against the registry at implementation time. They are not pinned in the spec.

**Explicitly rejected, do not introduce:** three.js/WebGL, MDX, any CMS, Swiper (use CSS scroll-snap), a blog, auth or a database, `output: export` / GitHub Pages hosting (it breaks Server Actions and next-intl routing).

## Architecture (planned)

- **Routes:** `/` is a single scrolling narrative. `/work/<slug>` holds six case studies (pharma-enterprise-portals, municipal-bill-payment, workflow-portal, warehouse-mobile-migration, healthcare-ecommerce-app, support-ticket-system). `/resume` is a viewer plus download. Every route has localized variants under a `[locale]` segment: `/` (en), `/hi`, `/te`.
- **Content is typed TypeScript modules per locale**, not prose files. A missing translation must fail `tsc`. A Vitest test also asserts catalog completeness across `messages/{en,hi,te}.json`.
- **Case studies share one fixed spine:** Context → My role → Problem → Approach (anchored by one diagram) → Key decisions (2–4, each with its tradeoff) → Impact → Stack.
- **Signature diagrams:** three hand-authored inline SVGs (two-tier RBAC, Ionic→RN migration, ticket lifecycle). They assemble step by step on scroll and are themed via CSS custom properties, never as separate asset files.
- **Absolute URLs** (metadata, OG, sitemap, hreflang) derive only from `NEXT_PUBLIC_SITE_URL`. Never hardcode a domain.
- **Contact form:** a Server Action with Zod validation, sent via Resend, with a honeypot, Cloudflare Turnstile, and a per-IP rate limit.
- Noto Sans Telugu and Noto Sans Devanagari load **only** on their own locales.

## Hard constraints

- **Confidentiality (public repo and public site):** never name the current employer's clients or their products/systems, link their live sites, or show client screenshots, in code, content, docs or commit messages. Describe engagements by domain and project type ("Pharma · enterprise web", "a global e-commerce company"). The employer, Aziro Technologies, may be named. Exception: the resume PDF (which names clients) stays downloadable, served with `X-Robots-Tag: noindex`. No metric the owner can't defend in an interview. Only the self-owned Support Ticket System may show real screenshots.
- **Motion:** the owner wants the site visually rich and interactive (animated hero, scroll reveals, cursor effects, count-ups, theme wipe). Prefer CSS and scroll-driven animations; keep JS small and lazy-load Motion. `prefers-reduced-motion` is honored everywhere. Content is server-rendered and never gated behind animation.
- **Performance budget (CI-enforced in `lighthouserc.json`):** Lighthouse ≥ 95 in all four categories on mobile, CLS < 0.02, LCP ≤ 2500 ms, script transfer ≤ 150 KiB. These replace the original LCP < 1.5 s / JS ≈ 120 KB targets (spec §7, amended), because the empty Next.js baseline already measures about 2170 ms and 134 KiB. Never raise a budget to make CI pass; lazy-load instead.
- **Name:** use the full name "Bhavani Sankar Naveen Dwarapudi" wherever space allows (hero h1, About, footer, alt text, structured data). Use "Naveen Dwarapudi" where space is tight (`<title>`, OG titles, compact nav and labels).
- **Zero cost:** everything must run on free tiers (Vercel Hobby, GitHub Actions on the public repo, the Resend free tier, Cloudflare Turnstile). Flag anything paid and offer a free alternative.
- **Accessibility:** WCAG 2.1 AA, with axe checks on every route in **both** themes. On first visit the theme follows the visitor's OS setting (dark if none), and a toggle choice is remembered. Both themes must be equally contrast-verified.
- **Design:** one accent colour only, burnt orange (`#FF8A3D` dark / `#B4470F` light), on a cool near-black base. Headings use Bricolage Grotesque, body Geist, labels Geist Mono. See `docs/superpowers/specs/2026-10-09-design-system-design.md`. Monospace is confined to structural metadata (section numbers, dates, stack chips).
- Hindi and Telugu copy are machine-assisted drafts, and the owner must review them before a locale ships.
- **Open item:** the "5 production applications" headline metric needs an owner decision before phase 3 (spec §4).

## Build order

There are nine phase branches, each merged green via PR: `feat/foundation` → `feat/design-system` → `feat/home-sections` → `feat/case-studies` → `feat/i18n` → `feat/command-palette` → `feat/contact` → `feat/seo-perf` → `feat/polish`. CI (GitHub Actions) is set up in phase 1 so later phases can't merge broken.

## Git

Commit with the personal identity `dbsnaveen@gmail.com` (already set in the repo config), not the Aziro work address. The remote is `github.com/Naveen-Dwarapudi/portfolio`.
