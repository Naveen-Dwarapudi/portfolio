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
