# Command Palette (Phase 6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Ctrl/⌘+K command palette on every page, hand-built on the native `<dialog>` and lazy-loaded, plus the owner-raised fixes: the language menu dismisses on an outside click or Esc, and back-to-top and the side-project links become orange `accent` buttons.

**Architecture:**
- **Pure core.** `src/lib/palette/commands.ts` turns serialisable page data into `Command[]`; `rank.ts` filters and ranks them.
- **Always-loaded trigger.** `PaletteTrigger` (about 0.9 KB) renders the header button, listens for Ctrl/⌘+K, and `React.lazy`-loads `CommandPalette` (about 3.6 KB gzipped) on first open.
- **The palette.** A modal `<dialog>` whose input and list follow the ARIA 1.2 combobox pattern. Theme and clipboard logic move into shared helpers, so the existing toggle and copy button use the same code.

**Tech Stack:** Next.js 16.4 (Cache Components), React 19.3 (`lazy`, `Suspense`, `useSyncExternalStore`), Tailwind 4, Vitest + RTL (jsdom 30), Playwright + axe, calibrated LHCI. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-11-command-palette-design.md`

**Prototype evidence:** every file below was built and verified in a throwaway worktree before the plan was written.
- **Unit tests:** 187/187.
- **E2E:** 83/83 (all 72 existing specs pass, with one string change and one added test in `i18n.spec.ts`).
- **Calibrated LHCI:**
  - `/`: LCP 2337–2475 ms; script **141,218 B**, up 884 B from 140,334 (budget 153,600). Accessibility and best practices 1.0.
  - The case study: LCP 2173–2175 ms.
- **Palette chunk:** 3,589 B gzipped. It is fetched only on first open (pinned by e2e).
- **Visual check:** screenshots in both themes on desktop and at 390 px.

## Global Constraints

- **No new dependencies.** No `next/link`, no `<Image>`.
- **Budgets unchanged.** `/` script ≤ 150 KiB, LCP ≤ 2500 ms; the always-loaded trigger ≤ 1.5 KB gzipped. Never edit `lighthouserc.json` assertions.
- **Copy:** all user-visible text lives in `homeContent` (typed), never hard-coded in components.
- **Accessibility:**
  - WCAG 2.1 AA, with axe in both themes.
  - Accessible names start with the visible text (2.5.3).
  - Reduced motion means no animation.
- **Confidentiality guard passes.** Tokens only, never raw hex in components.
- **No commits during execution.** The owner reviews and commits (skill `suggest-commit`), with no AI attribution lines.
- Branch: `feat/command-palette`.

## Deviations from the spec (found while prototyping)

1. **Ranking tiers and the best-match highlight.**
   - **Problem:** with group-first ordering, weak subsequence hits in "Go to" (a stack keyword that happens to contain t…h…e…m…e) were listed above "Switch theme", and Enter ran the weak hit.
   - **Fix, part 1:** when any command matches strongly (score ≥ 60: substring or better), loose subsequence and typo matches are dropped.
   - **Fix, part 2:** `rankCommands` returns `{ commands, best }`, and the palette first highlights the highest-scoring row, even when its group comes later.
2. **The accent tint is 8%, not "about 10%".** At 10%, light-theme accent text over `--bg` measures 4.42:1, which fails AA. 8% gives 4.55:1. `src/test/accent-contrast.test.ts` computes this from the real tokens and reads the tint from `button.tsx`, so the two can't drift.
3. **The open animation uses `@keyframes`** on `.palette[open]` rather than `@starting-style`. The result is the same and the CSS is simpler.
4. **The palette input drops the global focus ring.** The unlayered `:focus-visible` rule beats Tailwind utilities and drew a clipped ring inside the card. The input is the dialog's only focus target and always focused; the caret and the highlighted row show position.
5. **jsdom has no `showModal()` or `close()`.** `src/test/setup.ts` adds a minimal stand-in. The real modal behaviour (focus trap, Esc, backdrop) is pinned in Playwright.

## Review Focus

1. **Shortcut before hydration.** Ctrl+K pressed before React hydrates does nothing; the button and links still work. E2E waits for `networkidle` before pressing. Reviewer: confirm that nothing hides or shifts layout without JS.
2. **Focus return on every closing route:** Esc, a backdrop click, Ctrl+K again, a link command and a copy command. Pinned for Esc and click (unit and e2e) and Ctrl+K (unit). Reviewer: check `onClosed` runs after the dialog has closed, since focus can't leave an open modal.
3. **IME composition.** Enter or K during Japanese, Chinese or Indic composition must not run a command or toggle. Guarded with `isComposing` in both handlers; reviewer check.
4. **Contrast of the `accent` buttons** at rest and on hover in both themes. Pinned by the contrast unit test and by axe on `/` (existing home specs, both themes).
5. **The language menu with the palette open, and vice versa.** Opening the palette while the language menu is open: the menu's `pointerdown` handler closes it on the trigger press, and the modal makes the rest inert. Reviewer check.

---

### Task 1: Command model, ranking and palette copy

**Files:**
- Create: `src/lib/palette/commands.ts`, `src/lib/palette/data.ts`, `src/lib/palette/rank.ts`, `src/lib/palette/commands.test.ts`, `src/lib/palette/rank.test.ts`
- Modify: `src/content/types.ts` (adds `palette`), `src/content/en/home.ts` (adds `palette` copy)

**Interfaces:**
- **Produces types:**
  - `Command`, `CommandGroup`, `CommandRun` and `GROUP_ORDER`
  - `PaletteData` (serialisable; built per page)
  - `PaletteInput` = `PaletteData` & `{ locale, path, locales }`
- **Produces functions:**
  - `buildCommands(input: PaletteInput, theme: Theme): Command[]`
  - `paletteData(content: SiteContent): PaletteData`
  - `rankCommands(query, commands): { commands: Command[]; best: number }`
  - `normalize`, `scoreText` and `withinOneEdit`
- **Content:** `HomeContent["palette"]`.

- [ ] **Step 1: Write the failing tests**

`src/lib/palette/rank.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getContent } from "@/content";
import { LOCALES } from "@/content/locales";
import { buildCommands } from "./commands";
import { paletteData } from "./data";
import { normalize, rankCommands, scoreText, withinOneEdit } from "./rank";

const commands = buildCommands(
  {
    ...paletteData(getContent("en")),
    locale: "en",
    path: "/",
    locales: LOCALES,
  },
  "dark",
);
const ids = (query: string) =>
  rankCommands(query, commands).commands.map((c) => c.id);
const best = (query: string) => {
  const r = rankCommands(query, commands);
  return r.commands[r.best]?.id;
};

describe("normalize", () => {
  it("lower-cases, strips diacritics and collapses spaces", () => {
    expect(normalize("  Résumé   PDF ")).toBe("resume pdf");
  });
});

describe("withinOneEdit", () => {
  it.each([
    ["linkedin", "linkedin", true],
    ["lnkedin", "linkedin", true], // deletion
    ["linkkedin", "linkedin", true], // insertion
    ["linkedon", "linkedin", true], // substitution
    ["lnikedin", "linkedin", true], // transposition
    ["lnkdin", "linkedin", false], // two edits
  ])("%s vs %s → %s", (a, b, expected) => {
    expect(withinOneEdit(a, b)).toBe(expected);
  });
});

describe("scoreText", () => {
  it("ranks prefix > word start > substring > subsequence > typo", () => {
    const prefix = scoreText("ware", "warehouse app");
    const wordStart = scoreText("app", "warehouse app");
    const substring = scoreText("rehou", "warehouse app");
    const subsequence = scoreText("wrhs", "warehouse app");
    const typo = scoreText("wraehouse", "warehouse");
    expect(prefix).toBeGreaterThan(wordStart);
    expect(wordStart).toBeGreaterThan(substring);
    expect(substring).toBeGreaterThan(subsequence);
    expect(subsequence).toBeGreaterThan(typo);
    expect(typo).toBeGreaterThan(0);
  });

  it("returns 0 for no match and for short typo-only queries", () => {
    expect(scoreText("zzz", "warehouse")).toBe(0);
    expect(scoreText("abd", "about")).toBe(0);
  });
});

describe("rankCommands", () => {
  it("returns every command in order for an empty query", () => {
    expect(rankCommands("   ", commands)).toEqual({ commands, best: 0 });
  });

  it("finds a case study by abbreviation", () => {
    expect(ids("wrhs")[0]).toBe("work:warehouse-mobile-migration");
  });

  it("forgives one typo", () => {
    expect(ids("lnkedin")).toContain("action:linkedin");
  });

  it("matches case-study domain and stack keywords", () => {
    expect(ids("pharma")[0]).toBe("work:pharma-enterprise-portals");
    expect(ids("react native")).toContain("work:warehouse-mobile-migration");
  });

  it("drops non-matches", () => {
    expect(ids("qqqqzz")).toEqual([]);
  });

  it("keeps groups in order: go to, actions, language", () => {
    const groups = rankCommands("e", commands).commands.map((c) => c.group);
    const order = ["goto", "actions", "language"];
    const indexes = groups.map((g) => order.indexOf(g));
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
  });

  it("hides loose matches when a strong one exists", () => {
    expect(ids("theme")).toEqual(["action:theme"]);
  });

  it("highlights the best match even when its group comes later", () => {
    expect(best("github")).toBe("action:github");
    expect(best("wrhs")).toBe("work:warehouse-mobile-migration");
  });
});
```

`src/lib/palette/commands.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getContent } from "@/content";
import { homeContent, caseStudies } from "@/content/en";
import { LOCALES, type LocaleInfo } from "@/content/locales";
import { RESUME_PATH } from "@/lib/resume";
import { buildCommands, type PaletteInput } from "./commands";
import { paletteData } from "./data";

function input(overrides: Partial<PaletteInput> = {}): PaletteInput {
  return {
    ...paletteData(getContent("en")),
    locale: "en",
    path: "/",
    locales: LOCALES,
    ...overrides,
  };
}
const byId = (cmds: ReturnType<typeof buildCommands>, id: string) =>
  cmds.find((c) => c.id === id)!;

describe("paletteData", () => {
  it("derives case-study keywords from the kicker and stack", () => {
    const data = paletteData(getContent("en"));
    const pharma = data.caseStudies.find(
      (c) => c.slug === "pharma-enterprise-portals",
    )!;
    expect(pharma.keywords).toContain("Pharma");
    expect(pharma.keywords).toContain("React.js");
    expect(data.resumePath).toBe(RESUME_PATH);
    expect(data.email).toBe(homeContent.contact.email);
  });
});

describe("buildCommands", () => {
  it("lists every section and every case study under Go to", () => {
    const cmds = buildCommands(input(), "dark");
    const goto = cmds.filter((c) => c.group === "goto").map((c) => c.label);
    expect(goto).toEqual([
      ...homeContent.nav.map((n) => n.label),
      ...caseStudies.map((s) => s.title),
    ]);
  });

  it("localizes section and case-study links", () => {
    const en = buildCommands(input(), "dark");
    expect(byId(en, "section:about").run).toEqual({
      kind: "link",
      href: "/#about",
    });
    const hi = buildCommands(input({ locale: "hi" }), "dark");
    expect(byId(hi, "section:about").run).toEqual({
      kind: "link",
      href: "/hi#about",
    });
    expect(byId(hi, "work:workflow-portal").run).toEqual({
      kind: "link",
      href: "/hi/work/workflow-portal",
    });
  });

  it("offers the opposite theme", () => {
    expect(byId(buildCommands(input(), "dark"), "action:theme").label).toBe(
      homeContent.palette.switchTheme.light,
    );
    expect(byId(buildCommands(input(), "light"), "action:theme").label).toBe(
      homeContent.palette.switchTheme.dark,
    );
  });

  it("marks external links, the resume download and the email copy", () => {
    const cmds = buildCommands(input(), "dark");
    expect(byId(cmds, "action:github").run).toEqual({
      kind: "link",
      href: homeContent.contact.github.url,
      external: true,
    });
    expect(byId(cmds, "action:resume").run).toEqual({
      kind: "link",
      href: RESUME_PATH,
      download: true,
    });
    expect(byId(cmds, "action:copy-email").run).toEqual({
      kind: "copy",
      text: homeContent.contact.email,
    });
  });

  it("marks the current language and disables unpublished ones", () => {
    const cmds = buildCommands(input(), "dark");
    expect(byId(cmds, "language:en")).toMatchObject({ current: true });
    expect(byId(cmds, "language:hi")).toMatchObject({
      disabled: true,
      hint: homeContent.site.comingSoon,
      lang: "hi",
    });
  });

  it("links a published language to the same page", () => {
    const locales: LocaleInfo[] = LOCALES.map((l) =>
      l.code === "hi" ? { ...l, published: true } : l,
    );
    const cmds = buildCommands(
      input({ locales, path: "/work/workflow-portal" }),
      "dark",
    );
    expect(byId(cmds, "language:hi").run).toEqual({
      kind: "link",
      href: "/hi/work/workflow-portal",
    });
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/lib/palette`
Expected: FAIL with `Failed to resolve import "./commands"` (and `./rank`).

- [ ] **Step 3: Add the copy.** Apply these diffs (`git apply`, or edit by hand):

```diff
diff --git a/src/content/types.ts b/src/content/types.ts
index 5c7f843..d98e7ee 100644
--- a/src/content/types.ts
+++ b/src/content/types.ts
@@ -120,6 +120,25 @@ export type HomeContent = {
     backToTop: string;
   };
   newTab: string;
+  /** Command palette (Ctrl/⌘+K). `{count}` and `{query}` are filled in. */
+  palette: {
+    buttonLabel: string;
+    /** Accessible name; starts with buttonLabel (WCAG 2.5.3). */
+    buttonAria: string;
+    placeholder: string;
+    dialogLabel: string;
+    groups: { goto: string; actions: string; language: string };
+    copyEmail: string;
+    downloadResume: string;
+    openGithub: string;
+    openLinkedin: string;
+    switchTheme: { light: string; dark: string };
+    results: { one: string; other: string };
+    noResults: string;
+    emailCopied: string;
+    copyFailed: string;
+    hints: { move: string; select: string; close: string };
+  };
   techStack: string;
   readCaseStudy: string;
   notFound: {
```

```diff
diff --git a/src/content/en/home.ts b/src/content/en/home.ts
index c2d8c01..bbaef55 100644
--- a/src/content/en/home.ts
+++ b/src/content/en/home.ts
@@ -349,6 +349,26 @@ export const homeContent: HomeContent = {
     backToTop: "Back to top",
   },
   newTab: "(opens in a new tab)",
+  palette: {
+    buttonLabel: "Search",
+    buttonAria: "Search the site",
+    placeholder: "Search or jump to…",
+    dialogLabel: "Command palette",
+    groups: { goto: "Go to", actions: "Actions", language: "Language" },
+    copyEmail: "Copy email",
+    downloadResume: "Download resume",
+    openGithub: "Open GitHub",
+    openLinkedin: "Open LinkedIn",
+    switchTheme: {
+      light: "Switch to light theme",
+      dark: "Switch to dark theme",
+    },
+    results: { one: "1 result", other: "{count} results" },
+    noResults: "No results for “{query}”",
+    emailCopied: "Email copied",
+    copyFailed: "Couldn't copy. The address is on the Contact section.",
+    hints: { move: "to move", select: "to select", close: "to close" },
+  },
   techStack: "Tech stack",
   readCaseStudy: "Read case study",
   notFound: {
```

- [ ] **Step 4: Implement**

`src/lib/palette/commands.ts`:

```ts
import type { Locale, LocaleInfo } from "@/content/locales";
import type { HomeContent, NavItem } from "@/content/types";
import { localizedPath } from "@/lib/i18n";
import { nextTheme, type Theme } from "@/lib/theme";

export type CommandGroup = "goto" | "actions" | "language";

export const GROUP_ORDER: readonly CommandGroup[] = [
  "goto",
  "actions",
  "language",
];

export type CommandRun =
  | { kind: "link"; href: string; external?: boolean; download?: boolean }
  | { kind: "copy"; text: string }
  | { kind: "theme" }
  | { kind: "none" };

export type Command = {
  id: string;
  group: CommandGroup;
  label: string;
  keywords: string[];
  /** BCP 47 tag when the label is in another language (native names). */
  lang?: string;
  disabled?: boolean;
  current?: boolean;
  /** Short note shown at the end of the row, e.g. "Coming soon". */
  hint?: string;
  run: CommandRun;
};

/** Serialisable data a page hands the header (no functions). */
export type PaletteData = {
  copy: HomeContent["palette"];
  nav: NavItem[];
  caseStudies: { slug: string; title: string; keywords: string[] }[];
  email: string;
  github: { label: string; url: string };
  linkedin: { label: string; url: string };
  resumePath: string;
  newTab: string;
  comingSoon: string;
};

export type PaletteInput = PaletteData & {
  locale: Locale;
  /** Locale-free path of the current page, for language commands. */
  path: string;
  locales: readonly LocaleInfo[];
};

export function buildCommands(input: PaletteInput, theme: Theme): Command[] {
  const { copy, locale } = input;
  const sections: Command[] = input.nav.map((item) => ({
    id: `section:${item.href.slice(2)}`,
    group: "goto",
    label: item.label,
    keywords: [item.href.slice(2)],
    run: { kind: "link", href: localizedPath(locale, item.href) },
  }));
  const studies: Command[] = input.caseStudies.map((c) => ({
    id: `work:${c.slug}`,
    group: "goto",
    label: c.title,
    keywords: c.keywords,
    run: { kind: "link", href: localizedPath(locale, `/work/${c.slug}`) },
  }));
  const actions: Command[] = [
    {
      id: "action:copy-email",
      group: "actions",
      label: copy.copyEmail,
      keywords: ["email", "mail", "contact", input.email],
      run: { kind: "copy", text: input.email },
    },
    {
      id: "action:resume",
      group: "actions",
      label: copy.downloadResume,
      keywords: ["resume", "cv", "pdf"],
      run: { kind: "link", href: input.resumePath, download: true },
    },
    {
      id: "action:github",
      group: "actions",
      label: copy.openGithub,
      keywords: ["github", "code", "source"],
      run: { kind: "link", href: input.github.url, external: true },
    },
    {
      id: "action:linkedin",
      group: "actions",
      label: copy.openLinkedin,
      keywords: ["linkedin", "profile"],
      run: { kind: "link", href: input.linkedin.url, external: true },
    },
    {
      id: "action:theme",
      group: "actions",
      label: copy.switchTheme[nextTheme(theme)],
      keywords: ["theme", "dark", "light", "mode", "appearance"],
      run: { kind: "theme" },
    },
  ];
  const languages: Command[] = input.locales.map((l) => {
    const current = l.code === locale;
    return {
      id: `language:${l.code}`,
      group: "language",
      label: l.nativeName,
      keywords: [l.code, "language"],
      lang: l.htmlLang,
      current,
      disabled: !current && !l.published,
      hint: !current && !l.published ? input.comingSoon : undefined,
      run:
        current || !l.published
          ? { kind: "none" }
          : { kind: "link", href: localizedPath(l.code, input.path) },
    };
  });
  return [...sections, ...studies, ...actions, ...languages];
}
```

`src/lib/palette/data.ts`:

```ts
import type { SiteContent } from "@/content";
import { RESUME_PATH } from "@/lib/resume";
import type { PaletteData } from "./commands";

/** Builds the palette's serialisable data from a locale's content. */
export function paletteData({
  homeContent: c,
  caseStudies,
}: SiteContent): PaletteData {
  return {
    copy: c.palette,
    nav: c.nav,
    caseStudies: caseStudies.map((s) => ({
      slug: s.slug,
      title: s.title,
      keywords: [...s.kicker.split("·").map((k) => k.trim()), ...s.stack],
    })),
    email: c.contact.email,
    github: c.contact.github,
    linkedin: c.contact.linkedin,
    resumePath: RESUME_PATH,
    newTab: c.newTab,
    comingSoon: c.site.comingSoon,
  };
}
```

`src/lib/palette/rank.ts`:

```ts
import { GROUP_ORDER, type Command } from "./commands";

/** Lower-case, strip diacritics, collapse whitespace. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function words(text: string): string[] {
  return text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

const isWordChar = (ch: string | undefined) =>
  ch !== undefined && /[\p{L}\p{N}]/u.test(ch);

/** True when a and b are within one edit (insert, delete, substitute or swap). */
export function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) {
    // substitution, or adjacent transposition
    if (a.slice(i + 1) === b.slice(i + 1)) return true;
    return (
      a[i] === b[i + 1] &&
      a[i + 1] === b[i] &&
      a.slice(i + 2) === b.slice(i + 2)
    );
  }
  const [long, short] = a.length > b.length ? [a, b] : [b, a];
  return long.slice(i + 1) === short.slice(i);
}

/** Greedy subsequence match; rewards word starts and consecutive runs. */
function subsequenceScore(query: string, text: string): number {
  let from = 0;
  let prev = -2;
  let bonus = 0;
  for (const ch of query) {
    if (ch === " ") continue;
    const at = text.indexOf(ch, from);
    if (at === -1) return 0;
    if (!isWordChar(text[at - 1])) bonus += 2;
    if (at === prev + 1) bonus += 1;
    prev = at;
    from = at + 1;
  }
  return 40 + Math.min(bonus, 19);
}

/** 0 means no match; higher is better. Inputs must be normalized. */
export function scoreText(query: string, text: string): number {
  if (!query) return 0;
  if (text.startsWith(query)) return 100;
  if (
    words(text).some((w) => w.startsWith(query)) ||
    text.includes(` ${query}`)
  )
    return 80;
  if (text.includes(query)) return 60;
  const sub = subsequenceScore(query, text);
  if (sub) return sub;
  if (
    query.length >= 4 &&
    [text, ...words(text)].some((w) => withinOneEdit(query, w))
  )
    return 20;
  return 0;
}

function scoreCommand(query: string, command: Command): number {
  // The label wins ties over keywords by one point.
  const label = scoreText(query, normalize(command.label));
  const keyword = Math.max(
    0,
    ...command.keywords.map((k) => scoreText(query, normalize(k))),
  );
  return label ? Math.max(label + 1, keyword) : keyword;
}

/** Scores at or above this are whole-word or substring matches. */
const STRONG = 60;

export type Ranked = { commands: Command[]; best: number };

/**
 * Filters and ranks commands for a query. Groups keep their order; within a
 * group, better matches come first and ties keep the original order. When any
 * command matches strongly (substring or better), loose subsequence and typo
 * matches are dropped, so "theme" doesn't list every title that happens to
 * contain t…h…e…m…e. `best` is the index of the highest-scoring command,
 * which the palette highlights first even when its group comes later.
 */
export function rankCommands(query: string, commands: Command[]): Ranked {
  const q = normalize(query);
  if (!q) return { commands, best: 0 };
  const scored = commands
    .map((command, index) => ({
      command,
      index,
      score: scoreCommand(q, command),
    }))
    .filter((r) => r.score > 0);
  const top = Math.max(0, ...scored.map((r) => r.score));
  const sorted = scored
    .filter((r) => r.score >= Math.min(top, STRONG))
    .sort(
      (a, b) =>
        GROUP_ORDER.indexOf(a.command.group) -
          GROUP_ORDER.indexOf(b.command.group) ||
        b.score - a.score ||
        a.index - b.index,
    );
  return {
    commands: sorted.map((r) => r.command),
    best: Math.max(
      0,
      sorted.findIndex((r) => r.score === top),
    ),
  };
}
```

- [ ] **Step 5: Run them to verify they pass**

Run: `npx vitest run src/lib/palette src/content`
Expected: PASS (24 palette tests plus the existing content tests).

- [ ] **Step 6: Checkpoint (no commit)**

---

### Task 2: The palette dialog and shared theme and clipboard helpers

**Files:**
- Create: `src/lib/theme-switch.ts`, `src/lib/clipboard.ts`, `src/components/palette/command-palette.tsx`, `src/components/palette/command-palette.test.tsx`
- Modify: `src/components/theme/theme-toggle.tsx`, `src/components/contact/copy-email-button.tsx`, `src/test/setup.ts` (dialog stand-in), `src/app/globals.css` (palette CSS)

**Interfaces:**
- **Consumes:** `buildCommands`, `GROUP_ORDER`, `Command`, `PaletteInput` and `rankCommands` (Task 1).
- **Produces:**
  - `currentTheme(): Theme`, `subscribeTheme(listener)`, `applyTheme(theme)` and `switchTheme(origin: { x; y })` (from `@/lib/theme-switch`)
  - `copyText(text): Promise<boolean>` (from `@/lib/clipboard`)
  - `default export CommandPalette({ input, open, onClosed })` and `COPY_CLOSE_DELAY` (600)

- [ ] **Step 1: Add the jsdom dialog stand-in, then write the failing test**

```diff
diff --git a/src/test/setup.ts b/src/test/setup.ts
index 8dfb00f..5af771b 100644
--- a/src/test/setup.ts
+++ b/src/test/setup.ts
@@ -33,6 +33,20 @@ class NoopIntersectionObserver {
 }
 vi.stubGlobal("IntersectionObserver", NoopIntersectionObserver);
 
+// jsdom has <dialog> but not showModal()/close(); a minimal stand-in so
+// components can open and close it. Real modal behaviour (focus trap, Esc,
+// backdrop) is covered by Playwright.
+if (!HTMLDialogElement.prototype.showModal) {
+  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
+    this.setAttribute("open", "");
+  };
+  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
+    if (!this.hasAttribute("open")) return;
+    this.removeAttribute("open");
+    this.dispatchEvent(new Event("close"));
+  };
+}
+
 afterEach(() => {
   cleanup();
   mockMatchMedia();
```

`src/components/palette/command-palette.test.tsx`:

```tsx
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getContent } from "@/content";
import { homeContent } from "@/content/en";
import { LOCALES } from "@/content/locales";
import type { PaletteInput } from "@/lib/palette/commands";
import { paletteData } from "@/lib/palette/data";
import { nameWithSuffix } from "@/test/accessible-name";
import CommandPalette, { COPY_CLOSE_DELAY } from "./command-palette";

const copy = homeContent.palette;
const input: PaletteInput = {
  ...paletteData(getContent("en")),
  locale: "en",
  path: "/",
  locales: LOCALES,
};

function setup() {
  const onClosed = vi.fn();
  const user = userEvent.setup();
  render(<CommandPalette input={input} open onClosed={onClosed} />);
  const combobox = screen.getByRole("combobox", { name: copy.placeholder });
  return { user, onClosed, combobox };
}

const activeOption = (combobox: HTMLElement) =>
  document.getElementById(combobox.getAttribute("aria-activedescendant")!);

describe("CommandPalette", () => {
  it("opens as a labelled dialog with the combobox focused", () => {
    const { combobox } = setup();
    expect(
      screen.getByRole("dialog", { name: copy.dialogLabel }),
    ).toHaveAttribute("open");
    expect(combobox).toHaveFocus();
    expect(combobox).toHaveAttribute("aria-expanded", "true");
    expect(combobox).toHaveAttribute(
      "aria-controls",
      screen.getByRole("listbox").id,
    );
  });

  it("groups options under labelled groups, first option active", () => {
    const { combobox } = setup();
    for (const name of Object.values(copy.groups)) {
      expect(screen.getByRole("group", { name })).toBeInTheDocument();
    }
    const first = screen.getAllByRole("option")[0]!;
    expect(first).toHaveAttribute("aria-selected", "true");
    expect(activeOption(combobox)).toBe(first);
  });

  it("moves with arrow keys and wraps around", async () => {
    const { user, combobox } = setup();
    const options = screen.getAllByRole("option");
    await user.keyboard("{ArrowDown}");
    expect(activeOption(combobox)).toBe(options[1]);
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(activeOption(combobox)).toBe(options.at(-1));
    await user.keyboard("{ArrowDown}");
    expect(activeOption(combobox)).toBe(options[0]);
    await user.keyboard("{End}");
    expect(activeOption(combobox)).toBe(options.at(-1));
    await user.keyboard("{Home}");
    expect(activeOption(combobox)).toBe(options[0]);
  });

  it("filters as you type and announces the count", async () => {
    const { user } = setup();
    await user.keyboard("wrhs");
    expect(screen.getAllByRole("option")[0]).toHaveTextContent("Warehouse");
    expect(screen.getByRole("status").textContent).toMatch(/results?$/);
  });

  it("shows and announces no results", async () => {
    const { user } = setup();
    await user.keyboard("qqqqzz");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    const message = copy.noResults.replace("{query}", "qqqqzz");
    expect(screen.getByRole("status")).toHaveTextContent(message);
    expect(screen.getByRole("listbox")).toHaveTextContent(message);
  });

  it("navigates to a section on Enter and closes", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    const { user, onClosed } = setup();
    await user.keyboard("about{Enter}");
    expect(assign).toHaveBeenCalledWith("/#about");
    expect(onClosed).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("opens external links in a new tab and labels them", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const { user } = setup();
    await user.keyboard("github");
    expect(activeOption(screen.getByRole("combobox"))).toHaveAccessibleName(
      nameWithSuffix(copy.openGithub, homeContent.newTab),
    );
    await user.keyboard("{Enter}");
    expect(open).toHaveBeenCalledWith(
      homeContent.contact.github.url,
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("copies the email, announces it, then closes", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    const { user, onClosed } = setup();
    await user.keyboard("copy email{Enter}");
    expect(writeText).toHaveBeenCalledWith(homeContent.contact.email);
    expect(screen.getByRole("status")).toHaveTextContent(copy.emailCopied);
    expect(onClosed).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(COPY_CLOSE_DELAY));
    expect(onClosed).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("stays open and explains when the clipboard is refused", async () => {
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error());
    const { user, onClosed } = setup();
    await user.keyboard("copy email{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent(copy.copyFailed);
    expect(onClosed).not.toHaveBeenCalled();
  });

  it("switches the theme from the palette", async () => {
    const { user } = setup();
    await user.keyboard("theme{Enter}");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("can highlight but not run a coming-soon language", async () => {
    const { user, onClosed } = setup();
    await user.keyboard("हिन्दी");
    const hindi = screen.getByRole("option", { name: /हिन्दी/ });
    expect(hindi).toHaveAttribute("aria-disabled", "true");
    expect(within(hindi).getByText(homeContent.site.comingSoon)).toBeVisible();
    await user.keyboard("{Enter}");
    expect(onClosed).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/palette`
Expected: FAIL with `Failed to resolve import "./command-palette"`.

- [ ] **Step 3: Extract the shared helpers**

`src/lib/theme-switch.ts`:

```ts
import {
  isTheme,
  nextTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/lib/theme";

// Client-only theme state, shared by the toggle and the command palette.

function readStored(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function currentTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (isTheme(attr)) return attr;
  return resolveTheme(
    readStored(),
    window.matchMedia("(prefers-color-scheme: light)").matches,
  );
}

const listeners = new Set<() => void>();

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: light)");
  media.addEventListener("change", listener);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", listener);
  };
}

export function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage unavailable (private mode): the choice lasts for this page only.
  }
  listeners.forEach((l) => l());
}

/**
 * Flips the theme with a circular wipe from `origin` (viewport px). Without
 * View Transitions, or with reduced motion, it switches instantly.
 */
export function switchTheme(origin: { x: number; y: number }) {
  const next = nextTheme(currentTheme());
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduce) {
    applyTheme(next);
    return;
  }
  const { x, y } = origin;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );
  // Scopes the "no default cross-fade" CSS to this wipe only, so page-to-page
  // navigation keeps the browser's cross-fade (globals.css).
  const root = document.documentElement;
  root.classList.add("theme-wipe");
  const transition = document.startViewTransition(() => applyTheme(next));
  transition.finished
    .finally(() => root.classList.remove("theme-wipe"))
    .catch(() => {});
  transition.ready
    .then(() => {
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
    })
    // A second switch before this one is ready skips it; that's expected.
    .catch(() => {});
}
```

`src/lib/clipboard.ts`:

```ts
/** Writes text to the clipboard; false when the browser refuses. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
```

Then apply:

```diff
diff --git a/src/components/theme/theme-toggle.tsx b/src/components/theme/theme-toggle.tsx
index 2e5ec52..cd0d923 100644
--- a/src/components/theme/theme-toggle.tsx
+++ b/src/components/theme/theme-toggle.tsx
@@ -1,52 +1,8 @@
 "use client";
 
 import { useSyncExternalStore } from "react";
-import {
-  isTheme,
-  nextTheme,
-  resolveTheme,
-  THEME_STORAGE_KEY,
-  type Theme,
-} from "@/lib/theme";
-
-function readStored(): string | null {
-  try {
-    return localStorage.getItem(THEME_STORAGE_KEY);
-  } catch {
-    return null;
-  }
-}
-
-function currentTheme(): Theme {
-  const attr = document.documentElement.getAttribute("data-theme");
-  if (isTheme(attr)) return attr;
-  return resolveTheme(
-    readStored(),
-    window.matchMedia("(prefers-color-scheme: light)").matches,
-  );
-}
-
-const listeners = new Set<() => void>();
-
-function subscribe(listener: () => void) {
-  listeners.add(listener);
-  const media = window.matchMedia("(prefers-color-scheme: light)");
-  media.addEventListener("change", listener);
-  return () => {
-    listeners.delete(listener);
-    media.removeEventListener("change", listener);
-  };
-}
-
-function applyTheme(theme: Theme) {
-  document.documentElement.setAttribute("data-theme", theme);
-  try {
-    localStorage.setItem(THEME_STORAGE_KEY, theme);
-  } catch {
-    // Storage unavailable (private mode): the choice lasts for this page only.
-  }
-  listeners.forEach((l) => l());
-}
+import { nextTheme } from "@/lib/theme";
+import { currentTheme, subscribeTheme, switchTheme } from "@/lib/theme-switch";
 
 /**
  * Where the circular wipe starts: the pointer for mouse clicks, the button's
@@ -64,52 +20,11 @@ export function wipeOrigin(
 
 export function ThemeToggle() {
   // Server snapshot is null: the label renders after hydration to avoid a mismatch.
-  const theme = useSyncExternalStore(subscribe, currentTheme, () => null);
+  const theme = useSyncExternalStore(subscribeTheme, currentTheme, () => null);
   const target = theme ? nextTheme(theme) : null;
 
   function onClick(event: React.MouseEvent<HTMLButtonElement>) {
-    const next = nextTheme(currentTheme());
-    const reduce = window.matchMedia(
-      "(prefers-reduced-motion: reduce)",
-    ).matches;
-    if (!document.startViewTransition || reduce) {
-      applyTheme(next);
-      return;
-    }
-    const { x, y } = wipeOrigin(
-      event,
-      event.currentTarget.getBoundingClientRect(),
-    );
-    const radius = Math.hypot(
-      Math.max(x, window.innerWidth - x),
-      Math.max(y, window.innerHeight - y),
-    );
-    // Scopes the "no default cross-fade" CSS to this wipe only, so page-to-page
-    // navigation keeps the browser's cross-fade (globals.css).
-    const root = document.documentElement;
-    root.classList.add("theme-wipe");
-    const transition = document.startViewTransition(() => applyTheme(next));
-    transition.finished
-      .finally(() => root.classList.remove("theme-wipe"))
-      .catch(() => {});
-    transition.ready
-      .then(() => {
-        document.documentElement.animate(
-          {
-            clipPath: [
-              `circle(0px at ${x}px ${y}px)`,
-              `circle(${radius}px at ${x}px ${y}px)`,
-            ],
-          },
-          {
-            duration: 650,
-            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
-            pseudoElement: "::view-transition-new(root)",
-          },
-        );
-      })
-      // A second click before this one is ready skips it; that's expected.
-      .catch(() => {});
+    switchTheme(wipeOrigin(event, event.currentTarget.getBoundingClientRect()));
   }
 
   return (
```

```diff
diff --git a/src/components/contact/copy-email-button.tsx b/src/components/contact/copy-email-button.tsx
index bc3f3ef..3c9322d 100644
--- a/src/components/contact/copy-email-button.tsx
+++ b/src/components/contact/copy-email-button.tsx
@@ -2,6 +2,7 @@
 
 import { useEffect, useState } from "react";
 import { buttonClass } from "@/components/ui/button";
+import { copyText } from "@/lib/clipboard";
 
 type Labels = { idle: string; done: string; announced: string; failed: string };
 type Status = "idle" | "done" | "failed";
@@ -23,12 +24,7 @@ export function CopyEmailButton({
   }, [status]);
 
   async function copy() {
-    try {
-      await navigator.clipboard.writeText(email);
-      setStatus("done");
-    } catch {
-      setStatus("failed");
-    }
+    setStatus((await copyText(email)) ? "done" : "failed");
   }
 
   return (
```

- [ ] **Step 4: Implement the palette**

`src/components/palette/command-palette.tsx`:

```tsx
"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { copyText } from "@/lib/clipboard";
import {
  buildCommands,
  GROUP_ORDER,
  type Command,
  type PaletteInput,
} from "@/lib/palette/commands";
import { rankCommands } from "@/lib/palette/rank";
import { currentTheme, switchTheme } from "@/lib/theme-switch";

/** How long "Email copied" stays visible before the palette closes. */
export const COPY_CLOSE_DELAY = 600;

function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k]));
}

function navigate(run: Extract<Command["run"], { kind: "link" }>) {
  if (run.external) {
    window.open(run.href, "_blank", "noopener,noreferrer");
  } else if (run.download) {
    const a = document.createElement("a");
    a.href = run.href;
    a.download = "";
    a.click();
  } else {
    window.location.assign(run.href);
  }
}

/**
 * Lazy-loaded palette (PaletteTrigger imports it on first open). A native
 * modal <dialog> provides the focus trap, Esc and the backdrop; the input and
 * list follow the ARIA 1.2 combobox pattern.
 */
export default function CommandPalette({
  input,
  open,
  onClosed,
}: {
  input: PaletteInput;
  open: boolean;
  /** Called after the dialog has closed, by any route (Esc, click, command). */
  onClosed: () => void;
}) {
  const { copy } = input;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState("");
  const [theme, setTheme] = useState(() => currentTheme());

  const commands = useMemo(() => buildCommands(input, theme), [input, theme]);
  const ranked = useMemo(
    () => rankCommands(query, commands),
    [query, commands],
  );
  const results = ranked.commands;
  const activeCommand = results[active];
  const optionId = (c: Command) => `${listId}-${c.id}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setQuery("");
      setActive(0);
      setStatus("");
      setTheme(currentTheme());
      dialog.showModal();
      inputRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!activeCommand) return;
    document
      .getElementById(optionId(activeCommand))
      ?.scrollIntoView?.({ block: "nearest" });
    // optionId is stable for a given listId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCommand]);

  function close() {
    dialogRef.current?.close();
  }

  function onQuery(value: string) {
    const next = rankCommands(value, commands);
    const count = next.commands.length;
    setQuery(value);
    setActive(next.best);
    setStatus(
      !value.trim()
        ? ""
        : count === 0
          ? fill(copy.noResults, { query: value.trim() })
          : count === 1
            ? copy.results.one
            : fill(copy.results.other, { count }),
    );
  }

  async function runCommand(command: Command | undefined) {
    if (!command || command.disabled) return;
    const { run } = command;
    switch (run.kind) {
      case "none":
        close();
        return;
      case "link":
        close();
        navigate(run);
        return;
      case "theme":
        close();
        switchTheme({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        return;
      case "copy":
        if (await copyText(run.text)) {
          setStatus(copy.emailCopied);
          window.setTimeout(close, COPY_CLOSE_DELAY);
        } else {
          setStatus(copy.copyFailed);
        }
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    const last = results.length - 1;
    const moves: Record<string, () => number> = {
      ArrowDown: () => (active >= last ? 0 : active + 1),
      ArrowUp: () => (active <= 0 ? last : active - 1),
      Home: () => 0,
      End: () => last,
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      if (results.length) setActive(move());
    } else if (event.key === "Enter") {
      event.preventDefault();
      void runCommand(activeCommand);
    }
  }

  function onDialogClick(event: React.MouseEvent<HTMLDialogElement>) {
    // Clicks on the ::backdrop land on the dialog element itself.
    if (event.target !== event.currentTarget) return;
    const r = event.currentTarget.getBoundingClientRect();
    const inside =
      event.clientX >= r.left &&
      event.clientX <= r.right &&
      event.clientY >= r.top &&
      event.clientY <= r.bottom;
    if (!inside) close();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={copy.dialogLabel}
      onClose={onClosed}
      onClick={onDialogClick}
      className="palette fixed inset-x-0 top-[12vh] m-0 mx-auto w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl border border-line bg-surface p-0 text-text shadow-[0_24px_60px_-24px_rgb(0_0_0/0.65)] backdrop:bg-bg/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4 shrink-0 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeCommand ? optionId(activeCommand) : undefined
          }
          aria-label={copy.placeholder}
          placeholder={copy.placeholder}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
          className="h-14 w-full bg-transparent text-[15px] text-text placeholder:text-muted focus:outline-none"
        />
      </div>

      <div
        id={listId}
        role="listbox"
        aria-label={copy.dialogLabel}
        className="max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain p-2"
      >
        {results.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted">
            {fill(copy.noResults, { query: query.trim() })}
          </p>
        ) : (
          GROUP_ORDER.map((group) => {
            const items = results.filter((c) => c.group === group);
            if (!items.length) return null;
            const headingId = `${listId}-${group}`;
            return (
              <div
                key={group}
                role="group"
                aria-labelledby={headingId}
                className="py-1"
              >
                <div
                  id={headingId}
                  className="px-3 pt-2 pb-1 font-mono text-label tracking-[0.1em] text-muted uppercase"
                >
                  {copy.groups[group]}
                </div>
                {items.map((c) => {
                  const index = results.indexOf(c);
                  const selected = index === active;
                  const external = c.run.kind === "link" && c.run.external;
                  return (
                    <div
                      key={c.id}
                      id={optionId(c)}
                      role="option"
                      aria-selected={selected}
                      aria-disabled={c.disabled || undefined}
                      onMouseMove={() => !selected && setActive(index)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => void runCommand(c)}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm ${
                        selected ? "bg-surface-2" : ""
                      } ${c.disabled ? "cursor-default text-muted" : "text-text"}`}
                    >
                      <span lang={c.lang}>
                        {c.label}
                        {external ? (
                          <span className="sr-only"> {input.newTab}</span>
                        ) : null}
                      </span>
                      {c.hint ? (
                        <span className="font-mono text-[11px] tracking-[0.06em] text-muted uppercase">
                          {c.hint}
                        </span>
                      ) : c.current ? (
                        <span aria-hidden="true" className="text-accent">
                          ✓
                        </span>
                      ) : external ? (
                        <span aria-hidden="true" className="text-muted">
                          ↗
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      <div
        aria-hidden="true"
        className="flex gap-4 border-t border-line px-4 py-2.5 font-mono text-[11px] text-muted [@media(hover:none)]:hidden"
      >
        <span>
          <kbd>↑↓</kbd> {copy.hints.move}
        </span>
        <span>
          <kbd>↵</kbd> {copy.hints.select}
        </span>
        <span>
          <kbd>esc</kbd> {copy.hints.close}
        </span>
      </div>

      <p role="status" className="sr-only">
        {status}
      </p>
    </dialog>
  );
}
```

Add the palette CSS to `src/app/globals.css`:

```diff
diff --git a/src/app/globals.css b/src/app/globals.css
index 4886529..68787f0 100644
--- a/src/app/globals.css
+++ b/src/app/globals.css
@@ -487,6 +487,36 @@ body::after {
   }
 }
 
+/* Command palette. The input is the dialog's only focus target and always
+   focused (caret plus highlighted option show where you are), so it drops the
+   global ring, which would sit clipped inside the card. */
+.palette input:focus-visible {
+  outline: none;
+}
+
+/* Command palette: a short fade and scale on open (no motion if reduced). */
+@media (prefers-reduced-motion: no-preference) {
+  .palette[open] {
+    animation: palette-in 180ms var(--ease-spring) both;
+  }
+  .palette[open]::backdrop {
+    animation: palette-fade 180ms ease-out both;
+  }
+}
+
+@keyframes palette-in {
+  from {
+    opacity: 0;
+    transform: translateY(-6px) scale(0.98);
+  }
+}
+
+@keyframes palette-fade {
+  from {
+    opacity: 0;
+  }
+}
+
 /* Theme wipe: drop the browser's default cross-fade so only the clip-path
    circle is visible. Scoped to .theme-wipe (set by theme-toggle.tsx while the
    wipe runs) so page-to-page navigation keeps its cross-fade. */
```

- [ ] **Step 5: Run them to verify they pass**

Run: `npx vitest run src/components/palette src/components/theme src/components/contact`
Expected: PASS. That's 11 palette tests, and the existing theme-toggle and copy-email tests stay green, which proves the extraction kept their behaviour.

- [ ] **Step 6: Checkpoint (no commit)**

---

### Task 3: Header trigger, Ctrl/⌘+K and page wiring

**Files:**
- Create: `src/components/palette/palette-trigger.tsx`, `src/components/palette/palette-trigger.test.tsx`
- Modify: `src/components/site/site-header.tsx`, `src/components/site/site-header.test.tsx`, `src/components/pages/home-page.tsx`, `src/components/pages/home-page.test.tsx`, `src/app/[lang]/page.tsx`, `src/app/[lang]/work/[slug]/page.tsx`, `src/app/global-not-found.tsx`

**Interfaces:**
- **Consumes:** `CommandPalette` (Task 2); `PaletteData`, `PaletteInput` and `paletteData` (Task 1).
- **Produces:**
  - `PaletteTrigger({ input: PaletteInput })`
  - `SiteHeader` gains a required `palette: PaletteData`
  - `HomePage` gains a required `palette: PaletteData`

- [ ] **Step 1: Write the failing test `src/components/palette/palette-trigger.test.tsx`**

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getContent } from "@/content";
import { homeContent } from "@/content/en";
import { LOCALES } from "@/content/locales";
import type { PaletteInput } from "@/lib/palette/commands";
import { paletteData } from "@/lib/palette/data";
import { PaletteTrigger } from "./palette-trigger";

const copy = homeContent.palette;
const input: PaletteInput = {
  ...paletteData(getContent("en")),
  locale: "en",
  path: "/",
  locales: LOCALES,
};

// A closed <dialog> is excluded from role queries, so select it directly.
const dialog = () => document.querySelector("dialog");

afterEach(() => vi.unstubAllGlobals());

describe("PaletteTrigger", () => {
  it("is a button whose name starts with its visible text", () => {
    render(<PaletteTrigger input={input} />);
    const button = screen.getByRole("button", { name: copy.buttonAria });
    expect(copy.buttonAria.startsWith(copy.buttonLabel)).toBe(true);
    expect(button).toHaveAttribute("aria-haspopup", "dialog");
    expect(button).toHaveAttribute("aria-keyshortcuts", "Control+K Meta+K");
  });

  it("doesn't load the palette until first opened", () => {
    render(<PaletteTrigger input={input} />);
    expect(dialog()).not.toBeInTheDocument();
  });

  it("opens on click and returns focus to the button on close", async () => {
    const user = userEvent.setup();
    render(<PaletteTrigger input={input} />);
    const button = screen.getByRole("button", { name: copy.buttonAria });
    await user.click(button);
    await waitFor(() => expect(dialog()).toHaveAttribute("open"));
    (dialog() as HTMLDialogElement).close();
    await waitFor(() => expect(button).toHaveFocus());
  });

  it.each([["Control"], ["Meta"]])(
    "%s+K opens it and a second press closes it",
    async (modifier) => {
      const user = userEvent.setup();
      render(<PaletteTrigger input={input} />);
      await user.keyboard(`{${modifier}>}k{/${modifier}}`);
      await waitFor(() => expect(dialog()).toHaveAttribute("open"));
      await user.keyboard(`{${modifier}>}k{/${modifier}}`);
      await waitFor(() => expect(dialog()).not.toHaveAttribute("open"));
    },
  );

  it("shows Ctrl K by default and ⌘K on Apple devices", () => {
    const { unmount } = render(<PaletteTrigger input={input} />);
    expect(screen.getByText("Ctrl K")).toBeInTheDocument();
    unmount();
    vi.stubGlobal("navigator", { ...navigator, platform: "MacIntel" });
    render(<PaletteTrigger input={input} />);
    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/palette/palette-trigger.test.tsx`
Expected: FAIL with `Failed to resolve import "./palette-trigger"`.

- [ ] **Step 3: Implement the trigger**

`src/components/palette/palette-trigger.tsx`:

```tsx
"use client";

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { PaletteInput } from "@/lib/palette/commands";

const CommandPalette = lazy(() => import("./command-palette"));

const noopSubscribe = () => () => {};
const isApple = () =>
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

/**
 * Header button plus the global Ctrl/⌘+K shortcut. The palette itself is a
 * separate chunk, fetched the first time it opens, so it costs nothing at
 * page load.
 */
export function PaletteTrigger({ input }: { input: PaletteInput }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const returnTo = useRef<HTMLElement | null>(null);
  // Server snapshot: "Ctrl K"; Apple devices switch to ⌘K after hydration.
  const apple = useSyncExternalStore(noopSubscribe, isApple, () => false);

  const show = useCallback(() => {
    returnTo.current = document.activeElement as HTMLElement | null;
    setLoaded(true);
    setOpen(true);
  }, []);

  const onClosed = useCallback(() => {
    setOpen(false);
    returnTo.current?.focus();
    returnTo.current = null;
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.isComposing) return;
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        if (open) setOpen(false);
        else show();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, show]);

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label={input.copy.buttonAria}
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-line px-2.5 text-sm text-muted transition-colors hover:text-text md:px-3"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="hidden md:inline">{input.copy.buttonLabel}</span>
        <kbd className="hidden rounded border border-line px-1.5 font-mono text-[11px] md:inline">
          {apple ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>
      {loaded ? (
        <Suspense fallback={null}>
          <CommandPalette input={input} open={open} onClosed={onClosed} />
        </Suspense>
      ) : null}
    </>
  );
}
```

- [ ] **Step 4: Wire the header and every page.** Apply:

```diff
diff --git a/src/components/site/site-header.tsx b/src/components/site/site-header.tsx
index 27f87e9..4555682 100644
--- a/src/components/site/site-header.tsx
+++ b/src/components/site/site-header.tsx
@@ -1,21 +1,25 @@
+import { PaletteTrigger } from "@/components/palette/palette-trigger";
 import { LocaleSwitcher } from "@/components/site/locale-switcher";
 import { ThemeToggle } from "@/components/theme/theme-toggle";
 import { Container } from "@/components/ui/container";
 import { LOCALES, type Locale } from "@/content/locales";
 import type { HomeContent } from "@/content/types";
 import { localizedPath } from "@/lib/i18n";
+import type { PaletteData } from "@/lib/palette/commands";
 
 export function SiteHeader({
   site,
   nav,
   locale,
   path,
+  palette,
 }: {
   site: HomeContent["site"];
   nav: HomeContent["nav"];
   locale: Locale;
   /** Locale-free path of the current page, for the language switcher. */
   path: string;
+  palette: PaletteData;
 }) {
   return (
     <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-md">
@@ -43,6 +47,9 @@ export function SiteHeader({
               ))}
             </ul>
           </nav>
+          <PaletteTrigger
+            input={{ ...palette, locale, path, locales: LOCALES }}
+          />
           <LocaleSwitcher
             current={locale}
             path={path}
```

```diff
diff --git a/src/components/pages/home-page.tsx b/src/components/pages/home-page.tsx
index 696c89e..6286ed6 100644
--- a/src/components/pages/home-page.tsx
+++ b/src/components/pages/home-page.tsx
@@ -8,17 +8,26 @@ import { Skills } from "@/components/sections/skills";
 import { SiteHeader } from "@/components/site/site-header";
 import type { Locale } from "@/content/locales";
 import type { HomeContent } from "@/content/types";
+import type { PaletteData } from "@/lib/palette/commands";
 
 export function HomePage({
   content: c,
   locale,
+  palette,
 }: {
   content: HomeContent;
   locale: Locale;
+  palette: PaletteData;
 }) {
   return (
     <>
-      <SiteHeader site={c.site} nav={c.nav} locale={locale} path="/" />
+      <SiteHeader
+        site={c.site}
+        nav={c.nav}
+        locale={locale}
+        path="/"
+        palette={palette}
+      />
       <main id="main" className="flex-1">
         <Hero hero={c.hero} metrics={c.metrics} />
         <About about={c.about} />
```

```diff
diff --git a/src/app/[lang]/page.tsx b/src/app/[lang]/page.tsx
index c54f406..c3551a2 100644
--- a/src/app/[lang]/page.tsx
+++ b/src/app/[lang]/page.tsx
@@ -1,8 +1,16 @@
 import { HomePage } from "@/components/pages/home-page";
 import { getContent } from "@/content";
 import { requirePublishedLocale } from "@/lib/locale-params";
+import { paletteData } from "@/lib/palette/data";
 
 export default async function Home({ params }: PageProps<"/[lang]">) {
   const locale = requirePublishedLocale((await params).lang);
-  return <HomePage content={getContent(locale).homeContent} locale={locale} />;
+  const content = getContent(locale);
+  return (
+    <HomePage
+      content={content.homeContent}
+      locale={locale}
+      palette={paletteData(content)}
+    />
+  );
 }
```

```diff
diff --git a/src/app/[lang]/work/[slug]/page.tsx b/src/app/[lang]/work/[slug]/page.tsx
index 03ed78e..55a3559 100644
--- a/src/app/[lang]/work/[slug]/page.tsx
+++ b/src/app/[lang]/work/[slug]/page.tsx
@@ -6,6 +6,7 @@ import { SiteHeader } from "@/components/site/site-header";
 import { getContent } from "@/content";
 import { adjacentCaseStudies, findCaseStudy } from "@/content/case-studies";
 import { requirePublishedLocale } from "@/lib/locale-params";
+import { paletteData } from "@/lib/palette/data";
 
 /**
  * All case studies are prerendered per published locale (the parent [lang]
@@ -35,7 +36,8 @@ export default async function CaseStudyPage({
 }: PageProps<"/[lang]/work/[slug]">) {
   const { lang, slug } = await params;
   const locale = requirePublishedLocale(lang);
-  const { homeContent, caseStudies, caseStudyUi } = getContent(locale);
+  const content = getContent(locale);
+  const { homeContent, caseStudies, caseStudyUi } = content;
   const study = findCaseStudy(caseStudies, slug);
   const adjacent = adjacentCaseStudies(caseStudies, slug);
   if (!study || !adjacent) notFound();
@@ -47,6 +49,7 @@ export default async function CaseStudyPage({
         nav={homeContent.nav}
         locale={locale}
         path={`/work/${slug}`}
+        palette={paletteData(content)}
       />
       <main id="main" className="flex-1">
         <CaseStudyArticle
```

```diff
diff --git a/src/app/global-not-found.tsx b/src/app/global-not-found.tsx
index ebdd722..bdc1e60 100644
--- a/src/app/global-not-found.tsx
+++ b/src/app/global-not-found.tsx
@@ -6,12 +6,14 @@ import { Container } from "@/components/ui/container";
 import { TextLink } from "@/components/ui/text-link";
 import { getContent } from "@/content";
 import { DEFAULT_LOCALE } from "@/content/locales";
+import { paletteData } from "@/lib/palette/data";
 import { siteUrl } from "@/lib/site-url";
 import { themeInitScript } from "@/lib/theme";
 import { fontVariables } from "./fonts";
 import "./globals.css";
 
-const { homeContent: c } = getContent(DEFAULT_LOCALE);
+const content = getContent(DEFAULT_LOCALE);
+const { homeContent: c } = content;
 
 export const metadata: Metadata = {
   metadataBase: siteUrl,
@@ -39,6 +41,7 @@ export default function GlobalNotFound() {
           nav={c.nav}
           locale={DEFAULT_LOCALE}
           path="/"
+          palette={paletteData(content)}
         />
         <main id="main" className="flex flex-1 items-center">
           <Container className="py-24">
```

```diff
diff --git a/src/components/site/site-header.test.tsx b/src/components/site/site-header.test.tsx
index 79b5741..12cc111 100644
--- a/src/components/site/site-header.test.tsx
+++ b/src/components/site/site-header.test.tsx
@@ -1,11 +1,21 @@
 import { render, screen } from "@testing-library/react";
 import { describe, expect, it } from "vitest";
+import { getContent } from "@/content";
 import { homeContent as c } from "@/content/en";
+import { paletteData } from "@/lib/palette/data";
 import { SiteHeader } from "./site-header";
 
 describe("SiteHeader", () => {
   it("keeps the visible logo text in the home link's accessible name (WCAG 2.5.3)", () => {
-    render(<SiteHeader site={c.site} nav={c.nav} locale="en" path="/" />);
+    render(
+      <SiteHeader
+        site={c.site}
+        nav={c.nav}
+        locale="en"
+        path="/"
+        palette={paletteData(getContent("en"))}
+      />,
+    );
     const home = screen.getByRole("link", { name: /^ND\./ });
     expect(home).toHaveAttribute("href", "/");
     expect(home).toHaveAccessibleName(
```

```diff
diff --git a/src/components/pages/home-page.test.tsx b/src/components/pages/home-page.test.tsx
index 6fe999a..e2912d0 100644
--- a/src/components/pages/home-page.test.tsx
+++ b/src/components/pages/home-page.test.tsx
@@ -1,10 +1,18 @@
 import { render, screen } from "@testing-library/react";
 import { describe, expect, it } from "vitest";
+import { getContent } from "@/content";
 import { homeContent } from "@/content/en";
+import { paletteData } from "@/lib/palette/data";
 import { HomePage } from "./home-page";
 
 function renderHome() {
-  return render(<HomePage content={homeContent} locale="en" />);
+  return render(
+    <HomePage
+      content={homeContent}
+      locale="en"
+      palette={paletteData(getContent("en"))}
+    />,
+  );
 }
 
 describe("HomePage", () => {
```

- [ ] **Step 5: Verify**

```bash
npm run format && npm run lint && npm run typecheck && npx vitest run src/components
```

Expected: everything passes, with 6 trigger tests.

- [ ] **Step 6: Checkpoint (no commit)**

---

### Task 4: Language menu dismissal and the orange `accent` buttons

**Files:**
- Create: `src/components/site/dismissible-details.tsx`, `src/components/site/dismissible-details.test.tsx`, `src/test/accent-contrast.test.ts`
- Modify: `src/components/site/locale-switcher.tsx`, `src/components/site/locale-switcher.test.tsx`, `src/components/ui/button.tsx`, `src/components/ui/button.test.tsx`, `src/components/site/site-footer.tsx`, `src/components/site/site-footer.test.tsx`, `src/components/sections/projects.tsx`, `src/components/sections/sections.test.tsx`, `e2e/i18n.spec.ts`

**Interfaces:**
- **Produces:**
  - `DismissibleDetails({ className, children })`
  - the button `Variant` gains `"accent"`
  - the switcher summary's `aria-label` becomes `"<native name>, <languageLabel>"`

- [ ] **Step 1: Write the failing tests**

`src/components/site/dismissible-details.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DismissibleDetails } from "./dismissible-details";

function setup() {
  render(
    <>
      <button type="button">Outside</button>
      <DismissibleDetails>
        <summary>Menu</summary>
        <a href="#x">Inside link</a>
      </DismissibleDetails>
    </>,
  );
  const summary = screen.getByText("Menu");
  const details = summary.closest("details")!;
  return { summary, details };
}

describe("DismissibleDetails", () => {
  it("closes on a pointer press outside", async () => {
    const user = userEvent.setup();
    const { summary, details } = setup();
    await user.click(summary);
    expect(details.open).toBe(true);
    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));
    expect(details.open).toBe(false);
  });

  it("stays open on a press inside", async () => {
    const user = userEvent.setup();
    const { summary, details } = setup();
    await user.click(summary);
    fireEvent.pointerDown(screen.getByRole("link", { name: "Inside link" }));
    expect(details.open).toBe(true);
  });

  it("closes on Esc and returns focus to the summary", async () => {
    const user = userEvent.setup();
    const { summary, details } = setup();
    await user.click(summary);
    screen.getByRole("link", { name: "Inside link" }).focus();
    await user.keyboard("{Escape}");
    expect(details.open).toBe(false);
    expect(summary).toHaveFocus();
  });
});
```

`src/test/accent-contrast.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The `accent` button variant draws accent text on a faint accent tint over the
// page or a card, and fills solid accent on hover. Check both pairs meet AA
// (4.5:1) in both themes, from the real tokens in globals.css.

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const button = readFileSync(
  join(process.cwd(), "src/components/ui/button.tsx"),
  "utf8",
);
/** The accent variant's tint, e.g. "bg-accent/8" → 0.08. */
const TINT = Number(/bg-accent\/(\d+)/.exec(button)![1]) / 100;

function block(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  return css.slice(start, css.indexOf("}", start));
}

function token(scope: string, name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i").exec(scope);
  if (!match) throw new Error(`--${name} not found`);
  return match[1]!;
}

type Rgb = [number, number, number];
const rgb = (hex: string): Rgb =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
const mix = (top: Rgb, under: Rgb, alpha: number): Rgb =>
  top.map((c, i) => c * alpha + under[i]! * (1 - alpha)) as Rgb;
const luminance = (c: Rgb) => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

const themes = {
  dark: block(":root"),
  light: block(':root[data-theme="light"]'),
};

describe.each(Object.entries(themes))("accent button (%s)", (_, scope) => {
  const accent = rgb(token(scope, "accent"));
  const onAccent = rgb(token(scope, "on-accent"));

  it.each(["bg", "surface"])(
    "accent text on the tint over --%s ≥ 4.5:1",
    (under) => {
      const tint = mix(accent, rgb(token(scope, under)), TINT);
      expect(contrast(accent, tint)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("on-accent text on the solid hover fill ≥ 4.5:1", () => {
    expect(contrast(onAccent, accent)).toBeGreaterThanOrEqual(4.5);
  });
});
```

Then apply these test diffs:

```diff
diff --git a/src/components/ui/button.test.tsx b/src/components/ui/button.test.tsx
index 7db32e3..5a85193 100644
--- a/src/components/ui/button.test.tsx
+++ b/src/components/ui/button.test.tsx
@@ -40,6 +40,26 @@ describe("ButtonLink", () => {
   });
 });
 
+describe("ButtonLink accent variant", () => {
+  it("draws an accent outline and tint that fills on hover", () => {
+    render(
+      <ButtonLink href="#c" variant="accent">
+        Accent
+      </ButtonLink>,
+    );
+    const cls = screen.getByRole("link", { name: "Accent" }).className;
+    for (const c of [
+      "border-accent/50",
+      "bg-accent/8",
+      "text-accent",
+      "hover:bg-accent",
+      "hover:text-on-accent",
+    ]) {
+      expect(cls).toContain(c);
+    }
+  });
+});
+
 describe("Button", () => {
   it("defaults to type=button so it never submits a form by accident", () => {
     render(<Button>Go</Button>);
```

```diff
diff --git a/src/components/site/site-footer.test.tsx b/src/components/site/site-footer.test.tsx
index f564b6d..121dd05 100644
--- a/src/components/site/site-footer.test.tsx
+++ b/src/components/site/site-footer.test.tsx
@@ -8,11 +8,11 @@ import { SiteFooter } from "./site-footer";
 vi.mock("./copyright-year", () => ({ CopyrightYear: () => "2026" }));
 
 describe("SiteFooter", () => {
-  it("renders back to top as a small secondary button with an up arrow", () => {
+  it("renders back to top as a small accent button with an up arrow", () => {
     render(<SiteFooter footer={c.footer} newTabLabel={c.newTab} />);
     const top = screen.getByRole("link", { name: c.footer.backToTop });
     expect(top).toHaveAttribute("href", "#top");
-    expect(top.className).toBe(buttonClass("secondary", "sm"));
+    expect(top.className).toBe(buttonClass("accent", "sm"));
     expect(top.querySelector('[aria-hidden="true"]')).toHaveTextContent("↑");
   });
 });
```

```diff
diff --git a/src/components/sections/sections.test.tsx b/src/components/sections/sections.test.tsx
index 1c8b05e..ed2afaa 100644
--- a/src/components/sections/sections.test.tsx
+++ b/src/components/sections/sections.test.tsx
@@ -178,7 +178,7 @@ describe("Projects case-study link", () => {
 });
 
 describe("Projects side-project links", () => {
-  it("renders each side project's live link as a secondary button", () => {
+  it("renders each side project's live link as an accent button", () => {
     render(
       <Projects
         projects={c.projects}
@@ -192,7 +192,7 @@ describe("Projects side-project links", () => {
       const link = screen.getByRole("link", {
         name: nameWithSuffix(`Live site: ${s.title}`, c.newTab),
       });
-      expect(link.className).toBe(buttonClass("secondary"));
+      expect(link.className).toBe(buttonClass("accent"));
     }
   });
 });
```

```diff
diff --git a/src/components/site/locale-switcher.test.tsx b/src/components/site/locale-switcher.test.tsx
index 534926c..f1697d4 100644
--- a/src/components/site/locale-switcher.test.tsx
+++ b/src/components/site/locale-switcher.test.tsx
@@ -17,7 +17,7 @@ describe("LocaleSwitcher", () => {
     );
     expect(container.querySelector("summary")).toHaveAttribute(
       "aria-label",
-      "Language: English",
+      "English, Language",
     );
   });
 
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/components/site src/components/ui src/components/sections src/test/accent-contrast.test.ts`
Expected: FAIL. You'll see `Failed to resolve import "./dismissible-details"`, a regex null for `bg-accent/` in the contrast test, accent class mismatches, and the old "Language: English" label.

- [ ] **Step 3: Implement**

`src/components/site/dismissible-details.tsx`:

```tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A <details> that also closes on an outside pointer press or Esc (Esc returns
 * focus to its <summary>). Without JS it is a plain <details>.
 */
export function DismissibleDetails({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const details = ref.current;
      if (details?.open && !details.contains(event.target as Node)) {
        details.open = false;
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      const details = ref.current;
      if (event.key !== "Escape" || !details?.open) return;
      details.open = false;
      details.querySelector("summary")?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details ref={ref} className={className}>
      {children}
    </details>
  );
}
```

Then apply:

```diff
diff --git a/src/components/site/locale-switcher.tsx b/src/components/site/locale-switcher.tsx
index deafa2e..57c1559 100644
--- a/src/components/site/locale-switcher.tsx
+++ b/src/components/site/locale-switcher.tsx
@@ -1,9 +1,11 @@
+import { DismissibleDetails } from "@/components/site/dismissible-details";
 import type { Locale, LocaleInfo } from "@/content/locales";
 import { localizedPath } from "@/lib/i18n";
 
 /**
- * Native <details> disclosure (zero JS). Current language is marked; published
- * languages link to the same page; unpublished ones show "Coming soon".
+ * Native <details> disclosure; a small client enhancement closes it on an
+ * outside press or Esc. Current language is marked; published languages link
+ * to the same page; unpublished ones show "Coming soon".
  */
 export function LocaleSwitcher({
   current,
@@ -19,9 +21,9 @@ export function LocaleSwitcher({
 }) {
   const active = locales.find((l) => l.code === current);
   return (
-    <details className="group relative">
+    <DismissibleDetails className="group relative">
       <summary
-        aria-label={`${labels.languageLabel}: ${active?.nativeName ?? current}`}
+        aria-label={`${active?.nativeName ?? current}, ${labels.languageLabel}`}
         className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-line px-3 text-sm text-muted transition-colors hover:text-text [&::-webkit-details-marker]:hidden"
       >
         <svg
@@ -74,6 +76,6 @@ export function LocaleSwitcher({
           </li>
         ))}
       </ul>
-    </details>
+    </DismissibleDetails>
   );
 }
```

```diff
diff --git a/src/components/ui/button.tsx b/src/components/ui/button.tsx
index 2d85224..165a56f 100644
--- a/src/components/ui/button.tsx
+++ b/src/components/ui/button.tsx
@@ -1,11 +1,11 @@
 import type { ComponentProps, ReactNode } from "react";
 import { newTabProps } from "./new-tab";
 
-type Variant = "primary" | "secondary";
+type Variant = "primary" | "secondary" | "accent";
 type Size = "md" | "sm";
 
 const base =
-  "group inline-flex items-center gap-2 rounded-[10px] border font-medium transition-[transform,box-shadow,color,border-color] duration-300 ease-spring";
+  "group inline-flex items-center gap-2 rounded-[10px] border font-medium transition-[transform,box-shadow,color,background-color,border-color] duration-300 ease-spring";
 
 const sizes: Record<Size, string> = {
   md: "px-5 py-3 text-[15px]",
@@ -17,6 +17,11 @@ const variants: Record<Variant, string> = {
     "border-transparent bg-accent text-on-accent shadow-[0_8px_30px_-10px_var(--accent)]",
   secondary:
     "border-line bg-surface/70 text-text backdrop-blur-sm hover:border-line-strong",
+  // Orange outline on a faint tint; fills solid on hover. Sits between
+  // primary and secondary in emphasis. 8% is the strongest tint that keeps
+  // light-theme text at AA (src/test/accent-contrast.test.ts reads it here).
+  accent:
+    "border-accent/50 bg-accent/8 text-accent hover:border-accent hover:bg-accent hover:text-on-accent",
 };
 
 function Arrow({ children }: { children: ReactNode }) {
```

```diff
diff --git a/src/components/site/site-footer.tsx b/src/components/site/site-footer.tsx
index 235a2c3..b01326b 100644
--- a/src/components/site/site-footer.tsx
+++ b/src/components/site/site-footer.tsx
@@ -20,7 +20,7 @@ export function SiteFooter({
             {footer.sourceLabel}
           </TextLink>
         </p>
-        <a href="#top" className={buttonClass("secondary", "sm")}>
+        <a href="#top" className={buttonClass("accent", "sm")}>
           {footer.backToTop}
           <span
             aria-hidden="true"
```

```diff
diff --git a/src/components/sections/projects.tsx b/src/components/sections/projects.tsx
index 3b8520e..4b045dd 100644
--- a/src/components/sections/projects.tsx
+++ b/src/components/sections/projects.tsx
@@ -122,7 +122,7 @@ export function Projects({
               </ul>
               <div className="mt-5">
                 <ButtonLink
-                  variant="secondary"
+                  variant="accent"
                   href={s.liveUrl}
                   arrow="↗"
                   newTabLabel={newTabLabel}
```

- [ ] **Step 4: Update the language-menu e2e** (the new label plus the dismissal test):

```diff
diff --git a/e2e/i18n.spec.ts b/e2e/i18n.spec.ts
index 72957d5..e97895c 100644
--- a/e2e/i18n.spec.ts
+++ b/e2e/i18n.spec.ts
@@ -78,7 +78,7 @@ test("the language switcher opens from the keyboard and shows coming-soon langua
 }) => {
   await page.goto("/");
   const summary = page.locator("header details summary");
-  await expect(summary).toHaveAttribute("aria-label", "Language: English");
+  await expect(summary).toHaveAttribute("aria-label", "English, Language");
   await summary.focus();
   await page.keyboard.press("Enter");
   const menu = page.locator("header details ul");
@@ -89,6 +89,23 @@ test("the language switcher opens from the keyboard and shows coming-soon langua
   await expect(menu).toBeHidden();
 });
 
+test("the language menu closes on an outside click or Esc", async ({
+  page,
+}) => {
+  await page.goto("/");
+  const summary = page.locator("header details summary");
+  const menu = page.locator("header details ul");
+  await summary.click();
+  await expect(menu).toBeVisible();
+  await page.locator("main h1").click();
+  await expect(menu).toBeHidden();
+  await summary.click();
+  await expect(menu).toBeVisible();
+  await page.keyboard.press("Escape");
+  await expect(menu).toBeHidden();
+  await expect(summary).toBeFocused();
+});
+
 test("the switcher is available on phones too", async ({ page }) => {
   await page.setViewportSize({ width: 375, height: 700 });
   await page.goto("/");
```

- [ ] **Step 5: Run them to verify they pass**

Run: `npx vitest run`
Expected: 187 passed.

- [ ] **Step 6: Checkpoint (no commit)**

---

### Task 5: Palette E2E, Lighthouse and docs

**Files:**
- Create: `e2e/palette.spec.ts`
- Modify: `CLAUDE.md`, `docs/superpowers/specs/2026-10-11-command-palette-design.md`

- [ ] **Step 1: Write `e2e/palette.spec.ts`**

```ts
import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

const palette = (page: Page) =>
  page.getByRole("dialog", { name: "Command palette" });
const search = (page: Page) =>
  page.getByRole("combobox", { name: "Search or jump to…" });

async function openWithShortcut(page: Page) {
  // The shortcut listener attaches on hydration; a real visitor is never
  // faster than that, but a test can be.
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Control+k");
  await expect(palette(page)).toBeVisible();
  await expect(search(page)).toBeFocused();
}

test("Ctrl+K, type, Enter navigates to a case study", async ({ page }) => {
  await page.goto("/");
  await openWithShortcut(page);
  await page.keyboard.type("wareh");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/work\/warehouse-mobile-migration$/);
});

test("the palette chunk loads only when first opened", async ({ page }) => {
  const scripts: string[] = [];
  page.on("request", (r) => {
    if (r.resourceType() === "script") scripts.push(r.url());
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const before = scripts.length;
  await openWithShortcut(page);
  await expect.poll(() => scripts.length).toBeGreaterThan(before);
});

test("from a case study, About goes to the home section", async ({ page }) => {
  await page.goto("/work/pharma-enterprise-portals");
  await openWithShortcut(page);
  await page.keyboard.type("about");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/#about$/);
});

test("Esc closes and returns focus to where it was", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Search the site" });
  await trigger.click();
  await expect(palette(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(palette(page)).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("clicking the backdrop closes it", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await openWithShortcut(page);
  await page.mouse.click(20, 780);
  await expect(palette(page)).toBeHidden();
});

test("on phones the search button opens it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Search the site" }).click();
  await expect(search(page)).toBeFocused();
});

test("the theme action flips the theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await openWithShortcut(page);
  await page.keyboard.type("theme");
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(palette(page)).toBeHidden();
});

test("copy email puts the address on the clipboard", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await openWithShortcut(page);
  await page.keyboard.type("copy email");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("status").filter({ hasText: "Email copied" }),
  ).toHaveCount(1);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "dbsnaveen@gmail.com",
  );
  await expect(palette(page)).toBeHidden();
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`no WCAG 2.1 AA violations with the palette open (${colorScheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await page.goto("/");
    await openWithShortcut(page);
    await page.keyboard.press("ArrowDown");
    // The modal makes the page behind it inert, so axe checks the palette
    // only (17 text nodes measured).
    await expectNoAxeViolations(page, 15);
  });
}
```

- [ ] **Step 2: Run the full E2E suite**

Run: `npm run build && npx playwright test`
Expected: 83 passed.

- [ ] **Step 3: Run calibrated Lighthouse and measure the chunks**

```bash
CHROME_PATH="$(ls -d ~/Library/Caches/ms-playwright/chromium-*/chrome-mac*/*.app/Contents/MacOS/* | head -1)" \
  npm run lhci -- --upload.target=filesystem --upload.outputDir=.lighthouseci/reports
for f in $(grep -l "noopener,noreferrer" .next/static/chunks/*.js); do gzip -9c "$f" | wc -c; done
```

Expected:
- LHCI exits 0, with `/` script transfer ≈ 141 KB.
- The palette chunk is ≈ 3.6 KB gzipped.
- Budgets are untouched.

- [ ] **Step 4: Update the docs**

In the spec:
- Change "(about 10%)" to "(8%)" in §6.2.
- Append these rows to the §7 decisions table:

```markdown
| Ranking tiers | Strong matches (≥ 60) hide loose subsequence/typo hits; best match highlighted first | group-first order let weak "Go to" hits outrank "Switch theme" |
| Accent tint | 8% | 10% measured 4.42:1 for light-theme text over --bg (fails AA); 8% gives 4.55:1 |
| Palette input focus ring | dropped (caret + highlighted row show position) | the global ring drew clipped inside the card |
```

In `CLAUDE.md`, make these edits:
- **Planned stack:** replace `cmdk` with `hand-built command palette (native <dialog>)`.
- **Conventions:** add:

```markdown
- Command palette: `src/components/palette/` (the trigger is always loaded; `command-palette.tsx` is lazy). Commands are data from `src/lib/palette/commands.ts`, ranked by `rank.ts`; pages pass `paletteData(getContent(locale))` to `SiteHeader`. Theme changes go through `src/lib/theme-switch.ts`, clipboard writes through `src/lib/clipboard.ts`.
- Buttons: `primary` (solid) > `accent` (orange outline on an 8% tint, AA-checked by `src/test/accent-contrast.test.ts`) > `secondary`.
```

- [ ] **Step 5: Final verification, then stop for the owner's review**

```bash
npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build && npx playwright test
```

Expected: everything passes. Leave everything uncommitted, and suggest the commit messages (skill `suggest-commit`).
