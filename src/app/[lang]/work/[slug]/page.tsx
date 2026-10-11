import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyArticle } from "@/components/case-study/case-study-article";
import { CaseStudyPager } from "@/components/case-study/case-study-pager";
import { SiteHeader } from "@/components/site/site-header";
import { getContent } from "@/content";
import { adjacentCaseStudies, findCaseStudy } from "@/content/case-studies";
import { requirePublishedLocale } from "@/lib/locale-params";
import { paletteData } from "@/lib/palette/data";
import { pageMetadata } from "@/lib/seo";
import { caseStudyStructuredData } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/json-ld";

/**
 * All case studies are prerendered per published locale (the parent [lang]
 * layout supplies `lang`). Unknown slugs and unpublished locales get real 404s
 * from src/proxy.ts before rendering.
 */
export function generateStaticParams() {
  return getContent("en").caseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/work/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = requirePublishedLocale(lang);
  const { caseStudies, caseStudyUi, homeContent } = getContent(locale);
  const study = findCaseStudy(caseStudies, slug);
  if (!study) return {};
  return pageMetadata({
    title: `${study.title} | ${caseStudyUi.titleSuffix}`,
    description: study.summary,
    path: `/work/${slug}`,
    type: "article",
    siteName: homeContent.seo.siteName,
  });
}

export default async function CaseStudyPage({
  params,
}: PageProps<"/[lang]/work/[slug]">) {
  const { lang, slug } = await params;
  const locale = requirePublishedLocale(lang);
  const content = getContent(locale);
  const { homeContent, caseStudies, caseStudyUi } = content;
  const study = findCaseStudy(caseStudies, slug);
  const adjacent = adjacentCaseStudies(caseStudies, slug);
  if (!study || !adjacent) notFound();

  return (
    <>
      <SiteHeader
        site={homeContent.site}
        nav={homeContent.nav}
        locale={locale}
        path={`/work/${slug}`}
        palette={paletteData(content)}
      />
      <JsonLd data={caseStudyStructuredData(study, homeContent)} />
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
          locale={locale}
        />
      </main>
    </>
  );
}
