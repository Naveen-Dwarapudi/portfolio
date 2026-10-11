import { getContent } from "@/content";
import { DEFAULT_LOCALE } from "@/content/locales";
import { findCaseStudy } from "@/content/case-studies";
import { OG_SIZE, renderCard } from "@/lib/og/card";

const { homeContent, caseStudies } = getContent(DEFAULT_LOCALE);

export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateImageMetadata({
  params,
}: {
  /** A plain object here (docs: generate-image-metadata), not a Promise. */
  params: { slug: string };
}) {
  const study = findCaseStudy(caseStudies, params.slug);
  return [
    {
      id: "card",
      size: OG_SIZE,
      contentType: "image/png",
      alt: homeContent.seo.caseStudyOgAlt.replace(
        "{title}",
        study?.title ?? "",
      ),
    },
  ];
}

/** Case-study share card, generated at build time per slug. */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const study = findCaseStudy(caseStudies, (await params).slug);
  return renderCard({
    kind: "case-study",
    kicker: study?.kicker ?? "",
    title: study?.title ?? homeContent.seo.siteName,
    byline: homeContent.seo.caseStudyCardLabel,
  });
}
