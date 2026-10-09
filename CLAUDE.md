# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state

**Pre-implementation.** No application code, `package.json`, or tooling exists yet. The repo holds only:

- `docs/superpowers/specs/2026-09-19-nextjs-portfolio-design.md`: the approved design spec. It is the source of truth for every architectural decision below. Read it before starting any phase.
- `images/`: headshots (`mypic-2.jpeg` is the hero, `mypic-1.jpeg` is the about section) and project screenshots migrated from the old site.
- `resume/Naveen Dwarapudi Resume.pdf`: the canonical source for all content claims.

When tooling lands (phase 1, `feat/foundation`), replace this section with the real build, lint, test, and single-test commands.

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
- **Performance budget (CI-enforced):** Lighthouse ≥ 95 in all four categories on mobile, LCP < 1.5s, CLS < 0.02, home-route JS ≲ 120 KB gzipped.
- **Accessibility:** WCAG 2.1 AA, with axe checks on every route in **both** themes. Dark is the default, and light mode must be equally contrast-verified.
- **Design:** one accent colour only (amber/copper) on a cool near-black base. Monospace is confined to structural metadata (section numbers, dates, stack chips).
- Hindi and Telugu copy are machine-assisted drafts, and the owner must review them before a locale ships.
- **Open item:** the "5 production applications" headline metric needs an owner decision before phase 3 (spec §4).

## Build order

There are nine phase branches, each merged green via PR: `feat/foundation` → `feat/design-system` → `feat/home-sections` → `feat/case-studies` → `feat/i18n` → `feat/command-palette` → `feat/contact` → `feat/seo-perf` → `feat/polish`. CI (GitHub Actions) is set up in phase 1 so later phases can't merge broken.

## Git

Commit with the personal identity `dbsnaveen@gmail.com` (already set in the repo config), not the Aziro work address. The remote is `github.com/Naveen-Dwarapudi/portfolio`.
