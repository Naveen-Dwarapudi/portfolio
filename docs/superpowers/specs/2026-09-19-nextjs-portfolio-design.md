# Design: Next.js Portfolio Rebuild

**Date:** 2026-09-19
**Owner:** Bhavani Sankar Naveen Dwarapudi
**Status:** Approved — ready for implementation planning

---

## 1. Purpose

Build a new personal portfolio that accurately represents 4+ years of
production React.js and React Native engineering, targeting **senior
individual-contributor and product-engineering roles**.

The existing site (`Naveen-Dwarapudi_Portfolio`, vanilla HTML/CSS/JS on the
Bedimcode template) fails at this for one overriding reason: **it contains no
professional experience section at all.** Four client engagements at Aziro
Technologies — Dr. Reddy's XCEED, Nuvei Bill Pay, Internal Capability Hub, and
the Amazon warehouse app migration — plus Emami Frankross appear nowhere on it.
A visitor sees three hobby projects and a 400-word block of emoji bullets.

The resume is substantially stronger than the portfolio. This project closes
that gap.

### Success criteria

1. A recruiter can identify seniority, stack, and measurable impact within
   15 seconds of landing.
2. Every production application on the resume has a corresponding case study.
3. Lighthouse >= 95 in all four categories on mobile.
4. WCAG 2.1 AA verified on every route, in both themes.
5. The repository itself withstands technical scrutiny — typed, tested, CI-green.

### Non-goals

- No blog or CMS. Considered and explicitly rejected: valuable only with
  sustained writing output, which is not committed to.
- No authentication, database, or admin surface.
- No client screenshots (see section 5).
- Not a redesign of the existing site. This is a replacement.

---

## 2. Repository and hosting

| Decision | Value |
|---|---|
| Repository | `github.com/Naveen-Dwarapudi/portfolio` |
| Visibility | **Public** |
| Local path | `~/Workspace/portfolio` |
| Default branch | `main` (production) |
| Host | **Vercel**, preview deployment per pull request |
| Domain | `*.vercel.app` initially; custom domain attachable later with no code change |
| Git identity | `dbsnaveen@gmail.com` (personal, not the Aziro work address) |

`portfolio` was chosen over `Naveen-Dwarapudi_Portfolio` because the GitHub
username already namespaces the repository; repeating the name is redundant and
the existing hyphen/underscore mix reads poorly.

**`naveen-dwarapudi.github.io` was explicitly rejected.** A GitHub Pages
user-site repository forces `output: export`, which eliminates Server Actions
(required by the contact form) and complicates `next-intl` locale routing. It
would constrain the architecture for no benefit given Vercel hosting.

### Canonical URL handling

All absolute URLs (metadata, Open Graph, `sitemap.xml`, `hreflang`) derive from
a single `NEXT_PUBLIC_SITE_URL` environment variable. Attaching a custom domain
later is a Vercel dashboard change plus one environment variable — no code edit.

### Relationship to the old repository

The existing repository is **left untouched** during the build; it continues
serving `naveen-dwarapudi.netlify.app` from `main`. At cutover its README gains
a pointer to the new site and the repository is **archived, not deleted**, so any
inbound links to it survive. (The `mom-tribute` GitHub Pages site lives in a
separate repository and is unaffected either way.)

### Photography

Two professional studio headshots are already committed at `images/mypic-1.jpeg`
(114 KB) and `images/mypic-2.jpeg` (128 KB). Both are shot against a dark
background, which sits naturally against the dark default theme and needs no
cut-out or background removal.

- **`mypic-2.jpeg` — hero.** The warm amber/brown cast in its background glow
  harmonizes with the chosen accent colour, and the looser crop leaves headroom
  for overlaid type.
- **`mypic-1.jpeg` — about section.** Tighter, more formal crop.

Both supersede the old repository's `Naveen-Pic.jpg` (1.27 MB), which is not
migrated. Each is served through `next/image` with AVIF/WebP derivatives and an
explicit `sizes` attribute.

### Other assets migrated from the old repository

- `Naveen Dwarapudi Resume.pdf`
- `support-ticket-management-system.png`
- `payments-portal-app.png`, `mom-tribute.png` (side-projects strip)

Everything else is left behind, including `swiper-bundle.*` (141 KB, no longer
needed) and the template CSS.

---

## 3. Technology stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js latest stable, **App Router** | Listed on the resume, demonstrated nowhere. Server components keep bundle size low despite heavy animation. |
| Language | TypeScript, `strict: true` | |
| Styling | **Tailwind CSS v4** (CSS-first `@theme`) | Current generation; design tokens live in CSS, no `tailwind.config.js` indirection. |
| Animation | **Motion** (`motion`, formerly Framer Motion) | Standard for React animation; layout animations, scroll-linked effects, view transitions. |
| i18n | **next-intl** | JSON message catalogs mirror the configuration-driven multilingual layer shipped at Dr. Reddy's. |
| Command palette | **cmdk** | Small, accessible, well-established primitive. |
| Forms | Server Action + **Zod** + react-hook-form | Server-side validation; no third-party form-service branding. |
| Email delivery | **Resend** | Replaces the current `formsubmit.co` endpoint. |
| Spam control | Honeypot field + Cloudflare Turnstile + per-IP rate limit | |
| Content | **Typed TypeScript modules per locale** | Case studies are structured data, not prose. A missing translation becomes a compile error. |
| Unit/component tests | **Vitest + React Testing Library** | On the resume; tests double as a hiring signal. |
| E2E and a11y | **Playwright** + `axe-core` | |
| Perf enforcement | **Lighthouse CI** | |
| Icons | `lucide-react` | Replaces the Unicons CDN stylesheet. |

Version numbers are resolved against the registry at implementation time rather
than pinned in this document.

### Deliberately excluded

- **three.js / WebGL hero** — 500KB+ of JavaScript for decoration; damages the
  performance budget. For an engineering-serious direction, restraint reads as
  more senior than spectacle.
- **MDX** — long-form authoring is unnecessary for structured case studies and
  interacts badly with typed i18n catalogs.
- **CMS** — content changes ship with code; a CMS adds a service dependency and
  an untyped content boundary for no gain at this scale.
- **Swiper** — replaced by native CSS scroll-snap where carousels are needed.

---

## 4. Information architecture

Home is a single scrolling narrative. Each engagement gets a dedicated route.

```
/                                Hero -> Impact metrics -> About
                                 -> Experience timeline -> Skills matrix
                                 -> Independent project -> Side projects
                                 -> Certifications & Education -> Contact

/work/xceed-api                  Dr. Reddy's — three enterprise portals, RBAC
/work/nuvei-bill-pay             Municipal bill payment — Admin + Citizen
/work/ich-portal                 Workflow portal — Google OAuth, built from zero
/work/amazon-warehouse-apps      Ionic -> React Native migration
/work/emami-frankross            Healthcare e-commerce mobile
/work/support-ticket-system      Independent MERN application

/resume                          Embedded viewer + download

Localized variants: /hi/*, /te/*
```

### Home section specifications

**Hero.** Name, resume positioning line ("React.js Developer | React Native
Developer | Full-Stack (MERN) Engineer"), one-sentence summary, two CTAs
(View work / Download resume). Animated CSS gradient mesh plus grain overlay.
No WebGL.

**Impact metrics.** Four figures, count-up on first view:
`4+ years` · `5 production applications` · `30%+ component build-time reduction`
· `4 industries`

**Open item — the application count needs the owner's decision.** The resume's
Key Achievements state "5 production applications (3 enterprise web portals,
2 cross-platform mobile apps)", but the experience section describes five
*engagements* spanning more deliverables than that: XCEED (three portals), Nuvei
(two SPAs), ICH (one portal), Amazon (WoW and AMS), Emami (one app). Displayed
prominently as a headline metric, this invites a question the owner must be able
to answer crisply. Either the count is revised upward, or the label is changed to
something unambiguous such as `5 client engagements`. Resolve before phase 3, and
align the resume to match.

**About.** Rewritten to approximately 120 words of prose. The current ~400-word
emoji-bulleted block is replaced; its content migrates to the skills matrix,
where it belongs.

**Experience timeline.** Aziro Technologies, June 2022 – Present, with the five
engagements as cards. Each card links to its case study.

**Skills matrix.** Grouped exactly as the resume groups them: Frontend,
Backend & APIs, Databases, Testing, Mobile, Cloud & DevOps, Monitoring &
Analytics, Project Tools, AI-Assisted Development.

Corrections against the current site: **adds** Next.js, RTK Query, Jest, React
Testing Library, Vitest, AWS, MySQL, PostgreSQL, Strapi CMS. **Removes** Python
and SQLite, which do not appear on the resume.

**Independent project.** Support Ticket Management System — the one project with
real screenshots, since it is self-owned. Live links to the Vercel frontend and
Render backend.

**Side projects.** Payments Portal and Mom Tribute, in a compact strip, honestly
labelled as practice projects. On the current site these carry the same visual
weight as the Amazon engagement, which inverts the actual story.

**Certifications & Education.** Six certifications plus B.Tech ECE (2019),
Ramachandra College of Engineering.

The existing site's qualification section does include the B.Tech, but buries it
among 10th/SSC, a Diploma, and an NxtWave/CCBP trainee program — four entries of
equal visual weight, two of which are pre-university. For a senior role this
dilutes the credential rather than presenting it. The rebuilt section carries the
B.Tech plus the six professional certifications; school and diploma entries are
dropped.

**Contact.** Validated form, plus direct email, phone, and LinkedIn.

---

## 5. Case studies

### Confidentiality position

**No client screenshots.** Every engagement is presented as a written case study
with purpose-built diagrams.

Detail is held **at or below the specificity the resume already uses**: no
internal system names beyond XCEED, WoW, and AMS as already written; no
architecture detail not inferable from the public product; no metric that cannot
be defended in an interview.

The resume already names Dr. Reddy's, Nuvei, Amazon, and Emami, so naming them
is consistent with existing practice. The distinction acknowledged here is that
a resume reaches one recruiter while a website is indexed — hence the ceiling on
specificity rather than a ceiling on naming.

For a senior role this is a strength, not a limitation: a screenshot shows
presence, a diagram shows system comprehension.

### Shared template

Every case study page uses one spine, so the body of work reads coherently:

1. **Context** — client, industry, team shape
2. **My role**
3. **The problem**
4. **Approach** — anchored by one custom diagram
5. **Key decisions** — two to four, each with the tradeoff stated
6. **Impact**
7. **Stack**

### Signature diagrams

Three hand-authored, theme-aware inline SVG diagrams that **assemble step by step
as the reader scrolls** (scroll-pinned). This is the site's signature
interaction — substantive rather than decorative.

1. **Two-tier RBAC model** — super admin / limited admin enforced across the
   Admin, SPOC, and Customer portals (XCEED)
2. **Ionic -> React Native migration** — hybrid webview versus native bridge,
   and what moved (Amazon)
3. **Ticket lifecycle** — creation -> assignment -> tracking -> escalation ->
   resolution (independent MERN project)

Diagrams are authored as inline SVG with CSS custom properties for color, so
they respond to the active theme without a second asset.

---

## 6. Design system

Dark is the default. **Light mode is a first-class citizen**, contrast-verified
rather than an afterthought.

### Color

- Near-black base with a slight cool cast; layered surface tokens express
  elevation instead of heavy shadows.
- **One accent: amber/copper.** Chosen over the cyan-or-violet gradient
  convention of developer portfolios. A warm accent against a cool dark base is
  distinctive, reads confident rather than flashy, and immediately signals a
  non-template origin.
- Tokens defined per theme in CSS through Tailwind v4 `@theme`.
- Every foreground/background pair verified to WCAG AA in both themes.

### Typography

- **Headings** — tight display face, fluid sizing via `clamp()`
- **Body** — Geist Sans or Inter, tuned for reading
- **Mono** — section numbers, stack chips, dates, metadata labels

Monospace confined to structural metadata is what produces the engineering
character without committing to a full terminal aesthetic.

### Surface

1px hairline borders, restrained radii, very-low-opacity grain overlay for
depth, 8px spacing base.

---

## 7. Motion strategy

Three governing rules:

1. **Motion explains, never decorates.** Every animation indicates hierarchy, a
   state change, or a spatial relationship.
2. **`prefers-reduced-motion` is honored everywhere.** Non-negotiable, and
   detectable by accessibility audit tooling.
3. **Motion never gates content.** Text is server-rendered and visible;
   animation enhances what is already present.

| Technique | Application |
|---|---|
| View Transitions API | Route changes home -> case study, Motion fallback |
| CSS `animation-timeline: scroll()/view()` | Native scroll-linked effects where supported; Motion `useScroll` fallback |
| Scroll-pinned diagram assembly | The three case-study diagrams — the showpiece |
| Staggered reveals | Section entrances via `whileInView`, once only |
| Per-line clip-path reveal | Headings |
| Count-up | The four impact metrics, once on view |
| Cursor-follow spotlight | Project cards, via CSS custom properties |
| Circular theme reveal | View Transitions wipe originating from the toggle |
| Spring hover | CTAs and cards, 2–4px displacement |

### Performance budget (enforced in CI)

- LCP < 1.5s
- CLS < 0.02
- Lighthouse >= 95 in all four categories, mobile
- Home-route JavaScript under approximately 120 KB gzipped

A portfolio that animates beautifully and scores 70 is an argument against its
author.

---

## 8. Command palette

`cmdk`-based, opened with Cmd/Ctrl+K.

- **Navigation** — every home section and case study
- **Actions** — copy email, download resume, open GitHub, open LinkedIn, toggle
  theme, switch language
- Fuzzy search, fully keyboard navigable, `aria-live` result announcements
- On mobile, surfaced as a visible search button rather than a dead shortcut

---

## 9. Internationalization

- `next-intl` with a `[locale]` route segment: `/` (en), `/hi`, `/te`
- Catalogs at `messages/en.json`, `messages/hi.json`, `messages/te.json`
- **Typed message keys**: a missing translation fails `tsc` rather than
  rendering an empty section. This is the detail that makes the
  configuration-driven multilingual claim on the resume provable in public.
- Script support: Noto Sans Telugu and Noto Sans Devanagari, subset and loaded
  **only** on their respective locales
- `hreflang` alternates; metadata localized per route

### Translation review requirement

Hindi and Telugu translations are machine-assisted drafts and **must be reviewed
by the owner before shipping** — particularly Telugu, the owner's native
language. Professional positioning does not survive unreviewed translation.
Locales ship only once reviewed; the typed-catalog test gates incomplete ones.

---

## 10. Testing strategy

**Vitest + React Testing Library**
- Component behavior and rendering
- Command palette filtering
- Contact form validation, including rejection paths
- **Locale catalog completeness** — asserts every locale defines every key

**Playwright**
- Navigation smoke across all routes
- Theme toggle and persistence
- Command palette open -> search -> navigate
- Contact form happy path and error path
- Locale switching

**axe-core** via Playwright on every route, in **both** themes.

**Lighthouse CI** enforcing the section 7 budgets, failing the build on
regression.

---

## 11. Build order

Nine pull requests, each merging green. Phases 1–2 unblock everything else.

| # | Branch | Contents |
|---|---|---|
| 1 | `feat/foundation` | Next.js, TS strict, Tailwind v4, GitHub Actions CI |
| 2 | `feat/design-system` | Tokens, type scale, theme engine, primitives |
| 3 | `feat/home-sections` | Hero, metrics, about, timeline, skills matrix |
| 4 | `feat/case-studies` | `/work/*` routes, three scroll-assembled diagrams |
| 5 | `feat/i18n` | next-intl, typed catalogs, locale switcher |
| 6 | `feat/command-palette` | cmdk Cmd+K |
| 7 | `feat/contact` | Server Action, Zod, Resend, spam controls |
| 8 | `feat/seo-perf` | Metadata, dynamic OG images, sitemap, image pipeline |
| 9 | `feat/polish` | a11y audit, reduced-motion pass, Lighthouse budget |

CI is established in phase 1 deliberately: no later phase can merge broken, and
a passing badge on a public repository is free credibility.

### Public-repo discipline

Because the repository is public, **commit history, pull requests, and CI status
are themselves portfolio artifacts.** Conventional commits and one clean PR per
phase are exhibits, not ceremony.

---

## 12. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Case study writing is the schedule bottleneck** | High | Six case studies drafted from the resume, but every claim requires owner verification and interview-defensibility. This review loop, not the code, drives the timeline. |
| Animation degrades performance | Medium | Lighthouse CI budget from phase 1; WebGL rejected outright |
| Hindi/Telugu translation quality | Medium | Owner review gate before any locale ships (section 9) |
| Confidentiality overreach in case studies | Medium | Specificity ceiling defined in section 5 |
| Scope creep back toward a blog/CMS | Low | Recorded as an explicit non-goal (section 1) |

---

## 13. Cutover

1. Build through phases 1–9 on Vercel preview URLs
2. Verify on real mobile hardware, not only a simulator
3. Promote to production on the `*.vercel.app` domain
4. Attach a custom domain when acquired — Vercel DNS plus
   `NEXT_PUBLIC_SITE_URL`, no code change
5. Update LinkedIn, the resume PDF, and the GitHub profile to the new URL
6. Add a pointer to the old repository's README and **archive** it
