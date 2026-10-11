import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/site/site-footer";
import { SkipLink } from "@/components/ui/skip-link";
import { getContent } from "@/content";
import { localeInfo } from "@/lib/i18n";
import { localeParams, requirePublishedLocale } from "@/lib/locale-params";
import { THEME_COLORS } from "@/lib/og/colors";
import { siteUrl } from "@/lib/site-url";
import { themeInitScript } from "@/lib/theme";
import { fontVariables } from "../fonts";
import "../globals.css";

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { seo } = getContent(
    requirePublishedLocale((await params).lang),
  ).homeContent;
  return {
    metadataBase: siteUrl,
    title: seo.title,
    description: seo.description,
    applicationName: seo.siteName,
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
  ],
};

export function generateStaticParams() {
  return localeParams();
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const locale = requirePublishedLocale((await params).lang);
  const { homeContent } = getContent(locale);
  return (
    <html
      lang={localeInfo(locale).htmlLang}
      suppressHydrationWarning
      className={`${fontVariables} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SkipLink />
        {children}
        <SiteFooter
          footer={homeContent.footer}
          newTabLabel={homeContent.newTab}
        />
      </body>
    </html>
  );
}
