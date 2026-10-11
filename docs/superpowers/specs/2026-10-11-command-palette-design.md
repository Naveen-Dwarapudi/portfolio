# Design: Command Palette (Phase 6)

**Date:** 2026-10-11
**Status:** Draft — awaiting owner review
**Parent spec:** `2026-09-19-nextjs-portfolio-design.md` (§8 command palette, §7 budgets)
**Branch:** `feat/command-palette`

---

## 1. Purpose and scope

A Ctrl/⌘+K command palette that lets a visitor jump anywhere on the site, or
run a common action, without scrolling. It is the senior-frontend detail parent
§8 asks for. The phase also includes three header and button fixes the owner
raised (§6).

### Success criteria

1. **Opening:** Ctrl+K on Windows and Linux or ⌘K on macOS opens the palette on
   every page. A visible **Search** button in the header opens it too, and is
   the only way in on phones.
2. **Commands:** every home section, all six case studies, the actions (copy
   email, download resume, open GitHub, open LinkedIn, switch theme) and the
   languages (English current; हिन्दी and తెలుగు disabled as "Coming soon").
3. **Search:** fuzzy matching (a subsequence plus one-typo tolerance), ranked.
   Case studies also match their domain keywords.
4. **Accessibility (WCAG 2.1 AA):**
   - a modal dialog with focus kept inside;
   - Esc and outside clicks close it;
   - focus returns to where it was;
   - the input and list follow the ARIA 1.2 combobox pattern;
   - result counts and action feedback are announced through a polite live
     region;
   - axe passes with the palette open in both themes.
5. **Budgets unchanged:**
   - The always-loaded trigger is ≤ 1.5 KB gzipped.
   - The palette loads on first open, so `/` stays within the script budget
     (≤ 150 KiB) and LCP budget (≤ 2500 ms).
6. **No new dependencies.**
7. **Copy:** all user-visible text lives in `homeContent` (typed), ready for
   translation.

### Deviation from the parent spec

Parent §3 and §8 named **cmdk**.

- **Why not cmdk:** it measured 52 KB minified / **17.8 KB gzipped**
  (including Radix Dialog), against ~10–13 KB of script headroom on `/`.
- **What we use instead:** a hand-built palette on the native `<dialog>`
  element, at about 3–5 KB gzipped and lazy-loaded.
- **Gains:** a smaller first-open download, no dependency, and an accessible
  combobox built and tested in the open (a portfolio exhibit).
- **Cost:** we own the keyboard and ARIA behaviour, which the tests pin.

---

## 2. User experience

- **Trigger:** a header button placed before the language switcher.
  - **From `md` up:** a magnifier icon, "Search", and a `<kbd>` hint (`⌘K` on
    Apple platforms, otherwise `Ctrl K`, chosen after hydration; the server
    renders `Ctrl K`).
  - **Below `md`:** the icon only, with an `aria-label`.
- **Palette:** a card near the top of the viewport (`max-width: 36rem`; full
  width minus 16px gutters on phones), over a dimmed, blurred backdrop.
  - The search input is focused on open.
  - Results scroll inside the card (`max-height: min(60vh, 28rem)`).
  - A footer row shows the key hints `↑↓ to move · ↵ to select · esc to close`
    (hidden on touch-only devices).
- **Groups and items**, in this order:

| Group | Items |
|---|---|
| Go to | About, Experience, Skills, Projects, Contact; then the six case studies by title |
| Actions | Copy email · Download resume · Open GitHub ↗ · Open LinkedIn ↗ · Switch to light/dark theme |
| Language | English (current, marked ✓) · हिन्दी — Coming soon · తెలుగు — Coming soon (disabled) |

- **Running items:**
  - **Links** (sections, case studies, resume, GitHub, LinkedIn) navigate.
  - **External links** open in a new tab, with the existing new-tab
    announcement.
  - **Section links** use `localizedPath(locale, "/#id")`, so they work from a
    case-study page too.
  - **Copy email** writes to the clipboard, announces "Email copied", and
    closes after a short pause (about 600 ms) so the confirmation is visible.
  - **Switch theme** closes the palette, then runs the same circular theme
    wipe as the toggle, starting from the centre of the screen.
  - **Disabled items** can be highlighted but not run.
- **Empty query:** shows every group. **No match:** "No results for
  “{query}”".
- **Motion:** the card fades and scales in from 0.98 using `@starting-style`.
  None under `prefers-reduced-motion`.

---

## 3. Architecture

| Unit | Responsibility |
|---|---|
| `src/components/palette/palette-trigger.tsx` (client, always loaded) | The header button plus a global Ctrl/⌘+K listener. Lazy-loads the palette on first open (`React.lazy` + `import()`) and renders it inside `<Suspense>`. Holds the open state and returns focus. |
| `src/components/palette/command-palette.tsx` (client, lazy chunk) | `<dialog>` UI: the input, grouped listbox, active item, keyboard handling, live region, and running the commands. |
| `src/lib/palette/commands.ts` (pure) | `buildCommands({ content, locale, locales })` returns `Command[]`. The data only; no React. |
| `src/lib/palette/rank.ts` (pure) | `rankCommands(query, commands)` returns the filtered, ranked `Command[]`, with group order preserved. |
| `src/lib/theme-switch.ts` (client) | `currentTheme`, `applyTheme` and `switchTheme(origin)`, extracted from `ThemeToggle` so the toggle and the palette share one implementation (wipe included). |
| `src/lib/clipboard.ts` | `copyText(text): Promise<boolean>`, shared by `CopyEmailButton` and the palette. |

**Command shape:**

```ts
type Command = {
  id: string;
  group: "goto" | "actions" | "language";
  label: string;
  keywords: string[];
  disabled?: boolean;
  current?: boolean;
  hint?: string;
  run:
    | { kind: "link"; href: string; external?: boolean; download?: boolean }
    | { kind: "copy"; text: string }
    | { kind: "theme" };
};
```

**Interfaces:**
- The header renders `<PaletteTrigger content={...} locale path />`. The props
  are serialisable: content strings plus a commands-input subset; functions
  never cross the server/client boundary. `buildCommands` runs inside the lazy
  chunk.

**Keyboard behaviour:**
- **Ctrl/⌘+K:**
  - Opens the palette, or closes it when it's open.
  - Calls `preventDefault` so the browser's own shortcut doesn't fire.
  - Is ignored while an IME composition is in progress.
- **Inside the palette:**
  - ↓/↑ move with wrap-around; Home/End jump to the ends; Enter runs the
    active item.
  - Esc and clicks on the backdrop close it.
  - Typing resets the active item to the first result.
  - The active option is scrolled into view (`block: "nearest"`).
- **Focus return:** the trigger records `document.activeElement` on open and
  restores it on close, so the native dialog's behaviour isn't relied on
  across browsers.

**ARIA:**
- **Input:** `role="combobox"`, `aria-expanded="true"`, `aria-controls` = the
  listbox id, `aria-activedescendant` = the active option id, and
  `aria-autocomplete="list"`.
- **List:** `role="listbox"` containing `role="group"` + `aria-labelledby`
  (the group heading) and `role="option"` with `aria-selected` (active) and
  `aria-disabled`.
- **Live region:** `role="status"` announcing "{n} results", "No results" and
  "Email copied".
- **Dialog:** `aria-label` from the copy.

**Ranking (`rank.ts`):**
1. Normalise case and diacritics.
2. Match each command's `label` and `keywords` as follows:
   - **Prefix of the label:** score 100.
   - **Word-start or substring match:** 80 / 60.
   - **Subsequence:** 40 plus bonuses for word-start characters and
     consecutive runs.
   - **Typo (queries of 4+ characters only):** a word within
     Damerau–Levenshtein distance 1 scores 20.
3. Drop non-matches. Results are ordered by group, then by score, then by
   original order (stable).
4. An empty query returns everything in the original order.

**Without JavaScript:** the trigger button is server-rendered, so there is no
layout shift, and it is inert. Every destination remains reachable through
normal links. This matches the "never gate content" rule: the palette is an
enhancement.

---

## 4. Copy (in `homeContent.palette`, typed)

- **Button and input:**
  - `buttonLabel`: "Search"
  - `buttonAria`: "Search the site"
  - `placeholder`: "Search or jump to…"
  - `dialogLabel`: "Command palette"
- **Groups:** `groups`: { goto: "Go to", actions: "Actions", language: "Language" }
- **Actions:**
  - `copyEmail`: "Copy email"
  - `downloadResume`: "Download resume"
  - `openGithub`: "Open GitHub"
  - `openLinkedin`: "Open LinkedIn"
  - `switchTheme`: { light: "Switch to light theme", dark: "Switch to dark theme" }
- **Feedback:**
  - `results`: { one: "1 result", other: "{count} results" }
  - `noResults`: "No results for “{query}”"
  - `emailCopied`: "Email copied"
  - `copyFailed`: "Couldn't copy. The address is on the Contact section."
- **Key hints:** `hints`: { move: "to move", select: "to select", close: "to close" }
- **Reused:** the section labels come from `nav`, case-study titles and
  keywords from `caseStudies` (`kicker` words plus `stack`), "Coming soon" from
  `site.comingSoon`, and the new-tab text from `newTab`.

---

## 5. Testing

- **Unit (Vitest):**
  - **`rank.ts`:**
    - prefix beats subsequence;
    - "wrhs" finds Warehouse;
    - "lnkedin" finds LinkedIn;
    - "pharma" and "react native" find their case studies;
    - non-matches are dropped;
    - the empty query keeps the original order;
    - group order is kept.
  - **`commands.ts`:**
    - every section and slug is present;
    - section hrefs are localized (a `hi` fixture gives `/hi#about`);
    - unpublished languages are disabled;
    - the theme label follows the current theme.
  - **`CommandPalette` (RTL):**
    - the combobox and listbox ARIA wiring;
    - arrows wrap; Enter runs the item; disabled items don't run;
    - the live region counts results;
    - copy announces its result;
    - Esc closes it.
  - **`PaletteTrigger`:**
    - Ctrl+K and Meta+K open it, and the second press closes it;
    - focus returns on close;
    - the `<kbd>` shows ⌘ on Mac.
- **E2E (Playwright):**
  - Ctrl+K, then "wareh", then Enter lands on `/work/warehouse-mobile-migration`.
  - The phone viewport opens it with the button.
  - The theme action flips `data-theme`.
  - Copy email puts the address on the clipboard.
  - Esc restores focus.
  - axe passes with the palette open, in light and dark, with the
    contrast-coverage guard.
  - Opening from a case-study page and choosing "About" lands on `/#about`.
- **LHCI:** budgets unchanged.
  - The trigger's size is measured from the build output and recorded in the
    plan.
  - The palette chunk must not appear in the initial page's requests.

---

## 6. Related fixes in this phase (owner-raised)

1. **The language menu closes on an outside click or Esc.**
   - **Today:** the `<details>` stays open. Native `<details>` has no
     light-dismiss.
   - **Change:** a small client enhancement closes it on `pointerdown` outside
     it, or on Esc (Esc returns focus to the summary).
   - **Without JS:** it still opens and closes by clicking the summary.
   - **While here:** apply review minor M-3 so the summary's accessible name
     starts with the visible text: "English, Language", not "Language:
     English" (WCAG 2.5.3).
2. **Back to top and the side projects' "Live site" become orange.**
   - A new `accent` button variant: an accent border and text on a faint
     accent tint (about 10%). On hover it fills solid accent with
     `--on-accent` text.
   - The arrow keeps its nudge (↑ lifts, ↗ shifts).
   - The main project keeps the solid `primary` button, so the hierarchy reads
     primary > accent > secondary.
   - Contrast must pass AA in both themes, at rest and on hover (axe plus a
     unit check of the token pair).

---

## 7. Decisions log

| Decision | Choice | Why |
|---|---|---|
| Palette engine | Hand-built on native `<dialog>`, lazy-loaded | cmdk is 17.8 KB gzipped against ~10–13 KB headroom; no dependency; native focus trap and Esc |
| Loading | Trigger always loaded (≤ 1.5 KB); palette on first open | budgets unchanged; LCP untouched |
| Search | Subsequence plus one-typo tolerance | finds abbreviations and small typos without a library |
| Theme action | Reuses the toggle's wipe via a shared `switchTheme` | one implementation, consistent motion |
| No-JS | Trigger inert, no layout shift | the palette is an enhancement; content stays reachable |
| Language menu | `<details>` plus a small close-on-outside/Esc enhancement | keeps the zero-JS baseline; fixes the light-dismiss gap |
| Side-project and back-to-top buttons | New `accent` variant (orange outline and tint) | owner prefers orange; keeps the main project's solid button dominant |
