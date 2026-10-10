import { HomePage } from "@/components/pages/home-page";
import { getContent } from "@/content";
import { requirePublishedLocale } from "@/lib/locale-params";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const locale = requirePublishedLocale((await params).lang);
  return <HomePage content={getContent(locale).homeContent} locale={locale} />;
}
