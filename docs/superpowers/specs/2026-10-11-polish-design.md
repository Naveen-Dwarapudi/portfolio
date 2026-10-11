# Design: Polish (Phase 9)

**Date:** 2026-10-11
**Status:** Approved (owner, 2026-10-11)
**Parent spec:** `2026-09-19-nextjs-portfolio-design.md` (§11 phase 9: a11y audit, reduced-motion pass, Lighthouse budget)
**Branch:** `feat/polish`

---

## 1. Purpose and scope

Finish the build: audit accessibility and motion across the whole site, and
resolve the minors deferred in phases 5–8 that affect real visitors. Tidy the
invisible ones, and fix one line of copy.

**Owner decision:** skip the `/resume` viewer page (parent §2). The hero's
"Download resume" already serves it. A viewer page would add little on phones and
give a client-naming PDF more prominence. Parent §2's route table is amended.

### Success criteria

1. **Accessibility audit:**
   - axe (WCAG 2.1 AA, with the contrast-coverage guard) passes on **every
     route in both themes**: the home page, all six case studies and the 404.
   - A keyboard-only e2e walks the header in order and reaches every
     interactive control with a visible focus ring:
     skip link → logo → section nav (desktop) → Search → Language → Theme.
   - The 404 page gets the skip link.
2. **Reduced-motion audit:** with `prefers-reduced-motion: reduce`:
   - no CSS animations or transitions run on load, scroll or theme switch
     (`document.getAnimations()` is empty);
   - smooth scrolling is off;
   - all reveal content is fully visible (opacity 1) without scrolling.
   This is pinned by e2e on the home page and a case study.
3. **Visitor-facing fixes:** all of §2 is done, each with a test.
4. **Behind-the-scenes fixes:** all of §3 is done.
5. **Copy:** the Contact line changes as set out in §4.
6. **Budgets unchanged; no new dependencies; confidentiality guard passes.**

---

## 2. Visitor-facing fixes

| # | From | Fix |
|---|---|---|
| B1 | Phase 6 | **English names find languages:** `LOCALES` gains `englishName` ("English", "Hindi", "Telugu"), added to each language command's keywords. "hindi" now finds हिन्दी. |
| B2 | Phase 6 | **Shortcut per platform:** ⌘K on Apple devices and Ctrl+K elsewhere. Ctrl+K on a Mac keeps the system "delete to end of line" in text fields. The typed letter (`event.key`) decides on Latin layouts, so Dvorak's Ctrl+T stays "new tab"; `event.code === "KeyK"` is the fallback only when the layout types a non-Latin character. Repeats and Shift/Alt combinations are ignored. |
| B3 | Phase 6 | **Copy-close timer:** the timer is stored in a ref and cleared when the palette closes or reopens. A palette reopened within 600 ms after "Copy email" no longer shuts on its own. |
| B4 | Phase 6 | **IME guard:** Enter or K with `isComposing` **or** `keyCode === 229` is ignored in the palette input and the global shortcut handler. In Safari, the Enter that commits a Japanese, Chinese or Indic composition no longer runs a command. |
| B5 | Phase 7 | **Turnstile challenge time:** if Cloudflare shows its interactive challenge (`before-interactive-callback`), the submit waits up to **2 minutes** instead of 8 s. Visitors solving the challenge don't see a false alert. |
| B6 | Phase 7 | **Turnstile loader retry:** if the script loads but `window.turnstile` is missing (for example, an ad blocker's stub script), the loader resets and the failed `<script>` element is removed. A later focus retries without piling up script tags. |
| B7 | Phase 7 | **Refund on failed send:** when Resend fails (`sendFailed`), the visitor's rate-limit slot is refunded, because a server-side failure shouldn't lock a real person out. Verification failures still count. |
| B8 | Phase 6 | **Glow contrast:** the spotlight was already behind the content; its 22% accent wash, seen through the accent button's translucent tint, was the cause. The tint is now opaque and the glow is a theme token (`--card-glow`: 22% dark, 10% light), so accent text and buttons stay AA under the pointer (pinned by `accent-contrast.test.ts`). |

---

## 3. Behind-the-scenes fixes

| # | From | Fix |
|---|---|---|
| C1 | Phase 8 | **JSON-LD from content:** the employer, region and country come from content (`seo.employer`, `seo.region`, `seo.country`), not literals in `structured-data.ts`. |
| C2 | Phase 7 | **Clear misconfiguration logs:** a missing production key logs `contact: misconfigured: TURNSTILE_SECRET_KEY` or `contact: misconfigured: RESEND_API_KEY`, not as a bot or send failure. |
| C3 | Phase 8 | **Sitemap `lastModified`:** set to the build time, stamped once in `next.config.ts` as `BUILD_TIME`. Nothing is computed during render. |
| C4 | Phase 8 | **Locale tag:** `og:locale` is `en_US`. |
| C5 | Phase 8 | **Exact icon match:** the Proxy matcher uses `apple-icon$`. |
| C6 | Phase 8 | **Glow colour:** the card glow derives from `OG_COLORS.accent` (hex plus alpha), so the colour test covers it. |
| C7 | Phases 7–8 | **Tests:** the Turnstile blocked-script timeout and the expired-token wait (fake timers). |
| C8 | Phase 8 | **Docs and type tidy-up:** remove the redundant `U+00B7` line in the fonts README; correct the `generateImageMetadata` params type; record the final card sizes in the phase 8 spec. |

---

## 4. Copy

| Key | Old | New |
|---|---|---|
| `contact.line` | "The quickest way to reach me is email." | "Email me directly, or send a message with the form." |

On phones the form sits below the line, so it reads "with the form" rather than
"on the right".

---

## 5. Testing

- **E2E `a11y.spec.ts`:**
  - axe on 8 routes × 2 themes;
  - the header keyboard order;
  - a visible focus ring (`outline-style` not `none`) on each stop;
  - (B8 is pinned by the unit contrast test: axe can't measure contrast over a gradient.)
- **E2E `motion.spec.ts`** (extended): the reduced-motion invariants on `/`
  and on a case study.
- **Unit:** one test per fix B1–B7 and C1–C6, written to fail first.
- **LHCI:** budgets unchanged.

---

## 6. Decisions log

| Decision | Choice | Why |
|---|---|---|
| `/resume` viewer | Skipped | low value on phones; the download already exists; it would give the client-naming PDF more prominence |
| Shortcut | ⌘K on Apple, Ctrl+K elsewhere; typed letter first, physical `KeyK` only for non-Latin layouts | keeps Mac text editing and Dvorak shortcuts intact; works on non-Latin layouts |
| Rate-limit refund | On `sendFailed` and on a missing key (misconfiguration) | server and owner faults shouldn't lock out people; failed verifications stay counted |
| Glow fix (final) | Opaque accent tint + `--card-glow` 22% dark / 10% light | the glow was already behind the text; the 22% wash (seen through a translucent tint) was the cause |
| Glow test | Unit contrast test only; no e2e | axe can't measure contrast over a gradient (a prototype e2e passed on the broken code) |
