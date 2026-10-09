import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyArticle } from "@/components/case-study/case-study-article";
import { CaseStudyPager } from "@/components/case-study/case-study-pager";
import { getAdjacent, getCaseStudy } from "@/content/case-studies";
import { caseStudies, caseStudyUi, homeContent } from "@/content/en";

/**
 * All case studies are prerendered. Cache Components doesn't allow
 * `dynamicParams = false`, so unknown slugs render on request and 404 via
 * notFound().
 */
export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/work/[slug]">): Promise<Metadata> {
  const study = getCaseStudy((await params).slug);
  if (!study) return {};
  return {
    title: `${study.title} | ${caseStudyUi.titleSuffix}`,
    description: study.summary,
  };
}

export default async function CaseStudyPage({
  params,
}: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  const adjacent = getAdjacent(slug);
  if (!study || !adjacent) notFound();

  return (
    <main id="main" className="flex-1">
      <CaseStudyArticle
        study={study}
        ui={caseStudyUi}
        newTabLabel={homeContent.newTab}
      />
      <CaseStudyPager
        previous={adjacent.previous}
        next={adjacent.next}
        ui={caseStudyUi}
      />
    </main>
  );
}
