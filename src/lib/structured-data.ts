import type { CaseStudy, HomeContent } from "@/content/types";
import { absoluteUrl } from "@/lib/seo";

const PERSON_ID = "/#person";
const WEBSITE_ID = "/#website";

type Json = Record<string, unknown>;

/** schema.org Person + WebSite for the home page. */
export function homeStructuredData(c: HomeContent, base?: URL): Json {
  const url = absoluteUrl("/", base);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": absoluteUrl(PERSON_ID, base),
        name: c.footer.name,
        alternateName: c.seo.siteName,
        jobTitle: c.seo.jobTitle,
        worksFor: { "@type": "Organization", name: c.seo.employer },
        url,
        email: `mailto:${c.contact.email}`,
        image: absoluteUrl("/opengraph-image", base),
        sameAs: [c.contact.linkedin.url, c.contact.github.url],
        address: {
          "@type": "PostalAddress",
          addressRegion: c.seo.region,
          addressCountry: c.seo.country,
        },
      },
      {
        "@type": "WebSite",
        "@id": absoluteUrl(WEBSITE_ID, base),
        name: c.seo.siteName,
        url,
        inLanguage: "en",
        author: { "@id": absoluteUrl(PERSON_ID, base) },
      },
    ],
  };
}

/**
 * schema.org CreativeWork for one case study. The author is named inline:
 * Google doesn't resolve an @id defined on another page (the home Person).
 */
export function caseStudyStructuredData(
  study: CaseStudy,
  c: HomeContent,
  base?: URL,
): Json {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: study.title,
    description: study.summary,
    url: absoluteUrl(`/work/${study.slug}`, base),
    about: study.kicker,
    inLanguage: "en",
    author: {
      "@type": "Person",
      "@id": absoluteUrl(PERSON_ID, base),
      name: c.footer.name,
      url: absoluteUrl("/", base),
    },
  };
}

/** JSON for a <script> tag: "<" escaped so content can't close the tag. */
export function serializeJsonLd(data: Json): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
