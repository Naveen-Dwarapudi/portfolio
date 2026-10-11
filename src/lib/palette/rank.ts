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
