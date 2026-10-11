import { getContent } from "@/content";
import { DEFAULT_LOCALE } from "@/content/locales";
import { localeParams } from "@/lib/locale-params";
import { OG_SIZE, renderCard } from "@/lib/og/card";
import { siteUrl } from "@/lib/site-url";

export const alt = getContent(DEFAULT_LOCALE).homeContent.seo.ogAlt;
export const size = OG_SIZE;
export const contentType = "image/png";

/** Prerender per published locale, like the page itself. */
export function generateStaticParams() {
  return localeParams();
}

/** Home share card, generated at build time. */
export default async function Image() {
  const { homeContent: c } = getContent(DEFAULT_LOCALE);
  return renderCard({
    kind: "home",
    name: c.footer.name,
    role: c.seo.jobTitle,
    host: siteUrl.host,
  });
}
