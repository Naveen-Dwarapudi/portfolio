import { caseStudies } from "./en";
import type { CaseStudy } from "./types";

export function findCaseStudy(
  list: readonly CaseStudy[],
  slug: string,
): CaseStudy | undefined {
  return list.find((c) => c.slug === slug);
}

/** Previous and next case study, wrapping at both ends. */
export function adjacentCaseStudies(
  list: readonly CaseStudy[],
  slug: string,
): { previous: CaseStudy; next: CaseStudy } | undefined {
  const i = list.findIndex((c) => c.slug === slug);
  if (i === -1 || list.length < 2) return undefined;
  const previous = list[(i - 1 + list.length) % list.length];
  const next = list[(i + 1) % list.length];
  if (!previous || !next) return undefined;
  return { previous, next };
}

export const getCaseStudy = (slug: string) => findCaseStudy(caseStudies, slug);
export const getAdjacent = (slug: string) =>
  adjacentCaseStudies(caseStudies, slug);
