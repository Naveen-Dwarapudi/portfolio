import type { Metadata } from "next";
import { HomePage } from "@/components/pages/home-page";
import { JsonLd } from "@/components/seo/json-ld";
import { getContent } from "@/content";
import { requirePublishedLocale } from "@/lib/locale-params";
import { paletteData } from "@/lib/palette/data";
import { pageMetadata } from "@/lib/seo";
import { homeStructuredData } from "@/lib/structured-data";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]">): Promise<Metadata> {
  const { seo } = getContent(
    requirePublishedLocale((await params).lang),
  ).homeContent;
  return pageMetadata({
    title: seo.title,
    description: seo.description,
    path: "/",
    type: "website",
    siteName: seo.siteName,
  });
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const locale = requirePublishedLocale((await params).lang);
  const content = getContent(locale);
  return (
    <>
      <JsonLd data={homeStructuredData(content.homeContent)} />
      <HomePage
        content={content.homeContent}
        locale={locale}
        palette={paletteData(content)}
      />
    </>
  );
}
