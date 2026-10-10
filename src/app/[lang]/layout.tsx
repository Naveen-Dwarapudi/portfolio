import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/site-footer";
import { SkipLink } from "@/components/ui/skip-link";
import { getContent } from "@/content";
import { localeInfo } from "@/lib/i18n";
import { localeParams, requirePublishedLocale } from "@/lib/locale-params";
import { siteUrl } from "@/lib/site-url";
import { themeInitScript } from "@/lib/theme";
import { fontVariables } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Naveen Dwarapudi | React.js & React Native Engineer",
  description:
    "Portfolio of Bhavani Sankar Naveen Dwarapudi, a React.js and React Native engineer with 4+ years building production web and mobile applications.",
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
