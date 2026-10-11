import { HomePage } from "@/components/pages/home-page";
import { getContent } from "@/content";
import { requirePublishedLocale } from "@/lib/locale-params";
import { paletteData } from "@/lib/palette/data";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const locale = requirePublishedLocale((await params).lang);
  const content = getContent(locale);
  return (
    <HomePage
      content={content.homeContent}
      locale={locale}
      palette={paletteData(content)}
    />
  );
}
