import * as en from "./en";
import * as hi from "./hi";
import type { Locale } from "./locales";
import * as te from "./te";
import type { CaseStudy, CaseStudyUi, HomeContent } from "./types";

export type SiteContent = {
  homeContent: HomeContent;
  caseStudies: CaseStudy[];
  caseStudyUi: CaseStudyUi;
};

const CONTENT: Record<Locale, SiteContent> = { en, hi, te };

export function getContent(locale: Locale): SiteContent {
  return CONTENT[locale];
}
