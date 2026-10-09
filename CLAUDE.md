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

## What this is

A Next.js personal portfolio for a React / React Native engineer, aimed at senior IC roles. It replaces an older vanilla HTML site in a separate repo (`Naveen-Dwarapudi_Portfolio`), which must stay untouched. It is hosted on Vercel from a **public** repo, so commit history, PRs, and CI status count as portfolio exhibits: use conventional commits and one clean PR per phase.

## Planned stack (see spec §3)

Next.js App Router · TypeScript `strict` · Tailwind CSS v4 (CSS-first `@theme`, **no `tailwind.config.js`**) · Motion · next-intl · cmdk · Server Actions + Zod + react-hook-form · Resend · Vitest + RTL · Playwright + axe-core · Lighthouse CI · lucide-react.

Resolve version numbers against the registry at implementation time. They are not pinned in the spec.

**Explicitly rejected, do not introduce:** three.js/WebGL, MDX, any CMS, Swiper (use CSS scroll-snap), a blog, auth or a database, `output: export` / GitHub Pages hosting (it breaks Server Actions and next-intl routing).

## Architecture (planned)

- **Routes:** `/` is a single scrolling narrative. `/work/<slug>` holds six case studies (xceed-api, nuvei-bill-pay, ich-portal, amazon-warehouse-apps, emami-frankross, support-ticket-system). `/resume` is a viewer plus download. Every route has localized variants under a `[locale]` segment: `/` (en), `/hi`, `/te`.
- **Content is typed TypeScript modules per locale**, not prose files. A missing translation must fail `tsc`. A Vitest test also asserts catalog completeness across `messages/{en,hi,te}.json`.
- **Case studies share one fixed spine:** Context → My role → Problem → Approach (anchored by one diagram) → Key decisions (2–4, each with its tradeoff) → Impact → Stack.
- **Signature diagrams:** three hand-authored inline SVGs (XCEED RBAC, Ionic→RN migration, ticket lifecycle). They assemble step by step on scroll and are themed via CSS custom properties, never as separate asset files.
- **Absolute URLs** (metadata, OG, sitemap, hreflang) derive only from `NEXT_PUBLIC_SITE_URL`. Never hardcode a domain.
- **Contact form:** a Server Action with Zod validation, sent via Resend, with a honeypot, Cloudflare Turnstile, and a per-IP rate limit.
- Noto Sans Telugu and Noto Sans Devanagari load **only** on their own locales.

## Hard constraints

- **Confidentiality:** no client screenshots. Case-study detail stays at or below the resume's specificity: no internal system names beyond XCEED, WoW, and AMS, and no metric the owner can't defend in an interview. Only the self-owned Support Ticket System may show real screenshots.
- **Motion:** it explains, never decorates. `prefers-reduced-motion` is honored everywhere. Content is server-rendered and never gated behind animation.
- **Performance budget (CI-enforced in `lighthouserc.json`):** Lighthouse ≥ 95 in all four categories on mobile, CLS < 0.02, LCP ≤ 2500 ms, script transfer ≤ 150 KiB. The spec's targets were LCP < 1.5 s and JS ≈ 120 KB, but under Lighthouse's simulated mobile throttling the empty Next.js baseline already measures about 2170 ms and 134 KiB. **Open item:** the owner should amend spec §7. Never raise a budget to make CI pass; lazy-load instead.
- **Accessibility:** WCAG 2.1 AA, with axe checks on every route in **both** themes. Dark is the default, and light mode must be equally contrast-verified.
- **Design:** one accent colour only (amber/copper) on a cool near-black base. Monospace is confined to structural metadata (section numbers, dates, stack chips).
- Hindi and Telugu copy are machine-assisted drafts, and the owner must review them before a locale ships.
- **Open item:** the "5 production applications" headline metric needs an owner decision before phase 3 (spec §4).

## Build order

There are nine phase branches, each merged green via PR: `feat/foundation` → `feat/design-system` → `feat/home-sections` → `feat/case-studies` → `feat/i18n` → `feat/command-palette` → `feat/contact` → `feat/seo-perf` → `feat/polish`. CI (GitHub Actions) is set up in phase 1 so later phases can't merge broken.

## Git

Commit with the personal identity `dbsnaveen@gmail.com` (already set in the repo config), not the Aziro work address. The remote is `github.com/Naveen-Dwarapudi/portfolio`.
