# Design: Design System & Motion Toolkit (Phase 2)

**Date:** 2026-10-09
**Status:** Draft — awaiting owner review
**Parent spec:** `2026-09-19-nextjs-portfolio-design.md` (§6, §7, §11 phase 2)
**Branch:** `feat/design-system`

---

## 1. Purpose

Phase 2 builds the visual foundation every later phase uses:
- colour and type tokens;
- a theme engine;
- a reusable motion toolkit;
- the basic building blocks.

The owner's direction for the site is that it should be **visually interactive and
engaging, with a standout look and animation**, not merely clean. Phase 2
therefore delivers the motion toolkit as well as static primitives. The owner
approved the look from a live prototype (§9).

Phase 2 does **not** build the real home-page content (phase 3). The placeholder
home page is restyled as a showcase of the toolkit so it can be judged on the
Vercel preview.

### Success criteria

1. On first load the site matches the visitor's OS theme. A toggle choice
   persists across reloads, and the wrong theme never flashes.
2. Every text/background pair passes WCAG 2.1 AA in both themes (axe-verified).
3. The showcase hero shows the photo, line reveal, gradient mesh, grain, count-up
   metrics, magnetic CTAs, a spotlight/tilt card and the circular theme wipe.
4. With `prefers-reduced-motion: reduce`, the same content renders with no movement.
5. The phase 1 Lighthouse budgets still pass, with no budget raised.
6. Every phase 2 client-side script together adds **≤ 10 KB** of transferred
   JavaScript.

---

## 2. Visual direction (owner-selected: "C")

### Colour tokens

| Token | Dark | Light | Use |
|---|---|---|---|
| `bg` | `#0B0D12` | `#F6F7F9` | page background |
| `surface` | `#141821` | `#FFFFFF` | cards, raised areas |
| `surface-2` | `#1B202B` | `#EEF0F4` | nested / hover surfaces |
| `line` | `#262B36` | `#DDE1E8` | 1px hairline borders (decorative) |
| `line-strong` | `#646C7D` | `#7E8798` | form-control borders (phase 7). ≥ 3:1 on `bg` and `surface` (dark 3.69 / 3.37, light 3.37 / 3.62) |
| `text` | `#E7E9EE` | `#12151C` | body and headings |
| `muted` | `#9AA3B2` | `#566070` | secondary text |
| `accent` | `#FF8A3D` | `#B4470F` | burnt orange: links, highlights, primary button |
| `on-accent` | `#0B0D12` | `#FFFFFF` | text on the accent |
| `glow-1/2/3` | orange / red-orange / cool blue at low alpha | same, lighter | hero gradient mesh |

Measured contrast (WCAG AA needs 4.5:1 for text):

| Pair | Dark | Light |
|---|---|---|
| `accent` on `bg` | 8.29 | 5.09 |
| `on-accent` on `accent` | 8.29 | 5.46 |
| `text` on `bg` | 16.0 | 17.0 |
| `muted` on `bg` | 7.64 | 5.93 |
| `muted` on `surface` | 6.98 | 6.36 |

These colours are defined as CSS custom properties and exposed to Tailwind v4
through `@theme inline` (`bg-bg`, `text-muted`, `border-line`, `text-accent`, …).

### Typography

All fonts are free Google Fonts, self-hosted via `next/font/google`, so the site
makes no requests to Google at runtime.

| Role | Face | Notes |
|---|---|---|
| Display / headings | **Bricolage Grotesque** (variable, weights 600–800) | tight tracking (−0.035 to −0.045em) |
| Body | **Geist** | fixes the scaffold's leftover Arial |
| Labels / metadata | **Geist Mono** | section numbers, dates, chips only |

Fluid type scale via `clamp()`:

| Token | Value |
|---|---|
| `display` | `clamp(3rem, 9vw, 6.5rem)`, line-height 0.95 |
| `h2` | `clamp(1.875rem, 4.5vw, 3rem)` |
| `h3` | `1.375rem` |
| `body` | `1rem`, line-height 1.6 |
| `small` | `0.875rem` |
| `label` | `0.75rem`, mono, uppercase, tracking 0.1em |

### Surface

- 1px hairlines and restrained radii (8 / 14 / 28 px).
- A fixed grain overlay: an inline SVG `feTurbulence` data URI at about 6% opacity
  in dark and 3.5% in light, with `pointer-events: none`. No image download.
- Spacing on multiples of 8px.

### Motion tokens

| Token | Value |
|---|---|
| `--ease-out` | `cubic-bezier(.16, 1, .3, 1)` |
| `--ease-spring` | `cubic-bezier(.34, 1.56, .64, 1)` |
| `--dur-fast` | 200ms |
| `--dur-base` | 450ms |
| `--dur-slow` | 900ms |

---

## 3. Theme engine

**Approach: hand-rolled, no dependency.**
- `next-themes` was considered and rejected. It adds a dependency, and we have
  roughly 16 KB of script budget left.
- Its compatibility with Next 16 `cacheComponents` is unverified.

**CSS.** The default `:root` holds the dark tokens. The light tokens apply in two
cases:
- `@media (prefers-color-scheme: light) { :root:not([data-theme="dark"]) }`
- `:root[data-theme="light"]`

So with no stored choice, the OS setting decides the theme **without any
JavaScript**, and "no preference" falls back to dark. `color-scheme` is set to
match each theme, so scrollbars and form controls follow.

**Stored choice.** `localStorage["theme"]` holds `"light"` or `"dark"`.

**No-flash script.** A tiny inline `<script>` in `<head>` runs before first paint.
- If a valid stored value exists, it sets `document.documentElement.dataset.theme`
  to it.
- It is wrapped in try/catch, because storage can throw in private modes.
- `<html suppressHydrationWarning>` covers the attribute it adds.

**Pure logic, unit-tested:**
- `resolveTheme(stored: string | null, prefersLight: boolean): "light" | "dark"`
  returns the effective theme.
- `nextTheme(current)` flips it.

**`ThemeToggle` (client component).**
- It reads the effective theme, flips it, stores it and sets `data-theme`.
- Its accessible name says the action ("Switch to light theme").
- **Circular wipe:** `document.startViewTransition` plus a `clip-path` circle that
  grows from the click point. When View Transitions are unsupported or reduced
  motion is on, the theme changes instantly.

---

## 4. Motion toolkit

These rules apply to every effect:
- **Never gate content.** Text is server-rendered and readable with JS off or failed.
- **Honour reduced motion.** Under `prefers-reduced-motion: reduce`, every effect
  shows its final state without movement.
- **Pointer-only effects stay on pointer devices.** Tilt, magnetic pull and
  parallax are limited to `(hover: hover) and (pointer: fine)`.
- **Don't delay LCP.** An entrance effect must not hide the largest content
  element. The portrait is revealed by a curtain overlay sliding away, not by
  clipping the image itself. If the Lighthouse LCP gate fails, the effect is
  shortened or removed, never the budget raised.

| Effect | Mechanism | JS? |
|---|---|---|
| Hero gradient mesh | layered radial gradients, slow rotate/drift, blur | no |
| Grain overlay | SVG noise data URI on `body::after` | no |
| Heading line reveal (`LineReveal`) | each line slides up inside an overflow-hidden mask, staggered | no |
| Fade-up entrance | CSS keyframes with stagger delays | no |
| Scroll reveal (`Reveal`) | CSS `animation-timeline: view()` inside `@supports`. Browsers without support show content statically | no |
| Count-up (`CountUp`) | SSR renders the final value. On first view an IntersectionObserver eases it up from 0 (ease-out-quart, about 1.4s), once | yes, tiny |
| Spotlight + tilt card (`InteractiveCard`) | pointer position → CSS vars `--mx/--my` for a radial glow, plus a ±3° perspective tilt | yes, tiny |
| Magnetic button (`Magnetic`) | the button translates toward the pointer (×0.18 / ×0.3) and springs back | yes, tiny |
| Portrait (`Portrait`) | `next/image` (priority, AVIF/WebP); curtain reveal, rotating conic ring (`@property` angle), glow, floating badge — CSS; cursor parallax ±14px — client | parallax only |
| Theme wipe | View Transitions API (§3) | in `ThemeToggle` |
| Hover springs | arrow slide, card lift of 2–4px | no |

The **Motion** library is **not** added in phase 2. Phase 4's scroll-assembled
diagrams decide whether they need it, and if they do, it is lazy-loaded.

---

## 5. Building blocks

All of these are server components unless marked *client*.

| Component | Purpose |
|---|---|
| `Container` | max width (1040px), 24px gutter |
| `Section` | `<section>` with a numbered mono label ("02 / Selected work") and a heading |
| `Heading` | `display` / `h2` / `h3` levels; optional `LineReveal` |
| `Button` / `ButtonLink` | `primary` (accent fill) and `secondary` (hairline, translucent); optional trailing arrow; wrap in `Magnetic` for the pull |
| `TextLink` | accent underline, offset 3px |
| `Chip` | mono tech tag |
| `Card` | surface plus hairline. `InteractiveCard` (*client*) adds spotlight and tilt |
| `Portrait` | hero photo with the effects in §4 (*client* only for parallax) |
| `CountUp` | *client* |
| `ThemeToggle` | *client* |
| `SkipLink` | "Skip to content", visible on focus |
| `HeroBackground` | gradient mesh layer |

Focus: every interactive element shows a 2px `accent` focus ring with a 2px
offset, on `:focus-visible` only.

---

## 6. Showcase (placeholder home page)

The placeholder home page is restyled into a hero and a sample section:

- **Nav:** "ND." monogram and `ThemeToggle`.
- **Hero:**
  - `HeroBackground` behind everything.
  - Mono label "01 / React · React Native · Next.js".
  - Full name as a three-line `LineReveal`: "Bhavani Sankar" (smaller, muted),
    then "Naveen" and "Dwarapudi." (in accent). The `<h1>`'s accessible text is
    the full name, "Bhavani Sankar Naveen Dwarapudi".
  - The resume positioning line.
  - `Magnetic` CTAs "View work" and "Download resume". In phase 2 these link to
    in-page anchors; their real targets are wired in phases 3 and 8.
  - `Portrait` with `src/images/mypic-2.jpeg`.
  - Four `CountUp` metrics: `4+` years · `5` client engagements · `30%+` faster
    component builds · `4` industries.
- **Sample section** "02 / Selected work":
  - Heading "Production apps, not side quests."
  - The note "Client work · names withheld under confidentiality".
  - Three `InteractiveCard`s that describe engagements by domain only (pharma
    enterprise web; municipal bill payment; warehouse mobile migration), each with
    `Reveal`.

No client names, product names or links appear (parent spec §5, amended).

**Naming rule (owner):** the full name **Bhavani Sankar Naveen Dwarapudi** is used
wherever space allows: the hero `<h1>`, the About section, the footer, the
portrait alt text and Person structured data. The short name **Naveen
Dwarapudi** is used where space is tight: `<title>`, Open Graph titles, compact
nav and labels. The "ND." monogram stays as the logo.

---

## 7. Testing

**Unit (Vitest + RTL):**
- `resolveTheme` / `nextTheme`: every combination of stored value and OS preference.
- `ThemeToggle`: accessible name, flip, persistence to storage, behaviour when
  storage throws.
- `CountUp`: renders the final value on the server and under reduced motion.
- `Button` / `ButtonLink` / `Chip` / `Section` / `Heading`: roles, levels and
  variants.

**E2E (Playwright):**
- Theme follows the OS: emulate the light scheme with no storage → light tokens;
  emulate dark → dark tokens.
- No flash: an init script stores "light" while the OS is dark. The computed
  `<html>` background is the light value at `domcontentloaded`, before hydration.
- The toggle persists across reload and keeps its accessible name in sync.
- Reduced motion: emulate `reducedMotion: "reduce"` → metrics show final values,
  and the line reveal and cards are untransformed.
- axe WCAG 2.1 AA in four states: OS light, OS dark, toggled light, toggled dark.
- No horizontal scroll at 375px, including with the portrait and badge.

**Lighthouse CI:** the existing budgets, unchanged.

---

## 8. Out of scope

- Real home sections, case studies, i18n, the command palette, the contact form
  and SEO (phases 3–8).
- The Motion library.
- A "system" option in the toggle (light/dark only; YAGNI).

---

## 9. Decisions log

| Decision | Choice | Why |
|---|---|---|
| Visual direction | C: burnt orange + Bricolage Grotesque | owner choice from side-by-side mockups |
| First-visit theme | follow OS; dark if no preference | owner correction of the parent spec's "dark default" |
| Animation ambition | rich and interactive | owner direction, approved from a live prototype |
| Client naming | withheld everywhere | confidentiality to the current employer; parent spec §5 amended |
| Headline metric | "5 client engagements" | resolves parent spec §4 open item unambiguously |
| Name display | full name where space allows, "Naveen Dwarapudi" where tight | owner rule |
| Theme engine | hand-rolled | no dependency, minimal JS, no Next 16 compatibility risk |
| Scroll reveals | CSS `view()` timeline | zero JS; never gates content |
